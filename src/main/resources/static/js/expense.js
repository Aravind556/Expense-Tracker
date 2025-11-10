// Expense management functionality with advanced filtering & caching
class ExpenseManager {
    constructor() {
        this.baseURL = '/api/expense';
        this.currentPage = 0;
        this.pageSize = 10;
        this.filters = {};
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.isLoading = false; // 🚫 Prevent double calls
        this.viewMode = 'grid'; // 'grid' or 'list'
        this.lastData = null;
        this.deletionInProgress = new Set();
        this.init();
    }

    init(loadOnStart = true) {
        this.setupEventListeners();
        if (loadOnStart) {
            this.loadExpenses();
        }
    }

    setupEventListeners() {
        // Apply Filters form
        const filterForm = document.getElementById('filterForm');
        if (filterForm) {
            filterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                if (this.isLoading) return;
                this.applyFilters();
            });
        }

        // Quick filter buttons
        const quickFilterButtons = document.querySelectorAll('.quick-filter-btn');
        quickFilterButtons.forEach(btn => {
            // use currentTarget/dataset on the button so clicks on inner nodes (icons) still work
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const filter = (e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.filter) || btn.dataset.filter;
                this.applyQuickFilter(filter);
            });
        });

        // View toggle buttons (grid/list)
        const viewBtns = document.querySelectorAll('.view-btn');
        if (viewBtns && viewBtns.length) {
            viewBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const view = (e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.view) || btn.dataset.view;
                    if (view) this.setViewMode(view);
                });
            });
        }

    // Category, Date, Search filters (apply manually)
    const categoryFilter = document.getElementById('categoryFilter');
    // Template uses `searchInput` id
    const searchInput = document.getElementById('searchInput') || document.getElementById('searchText');
    // Template uses startDate/endDate ids
    const dateFrom = document.getElementById('startDate') || document.getElementById('dateFrom');
    const dateTo = document.getElementById('endDate') || document.getElementById('dateTo');

        [categoryFilter, dateFrom, dateTo].forEach(el => {
            if (el) el.addEventListener('change', () => this.applyFilters());
        });

        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => {
                this.filters.search = searchInput.value;
                this.applyFilters();
            }, 400));
        }

        // Amount range
        const minAmount = document.getElementById('minAmount');
        const maxAmount = document.getElementById('maxAmount');
        [minAmount, maxAmount].forEach(el => {
            if (el) el.addEventListener('input', this.debounce(() => this.applyFilters(), 400));
        });

        // Delegated handler for edit/delete buttons inside rendered expense list.
        // This supports dynamically-rendered cards and server-rendered buttons that use
        // data attributes like `data-id` or `data-expense-id`.
        const expensesContainer = document.getElementById('expensesContainer');
        if (expensesContainer) {
            expensesContainer.addEventListener('click', (e) => {
                const editBtn = e.target.closest && e.target.closest('.edit-expense-btn');
                const delBtn = e.target.closest && e.target.closest('.delete-expense-btn');
                if (editBtn) {
                    const id = editBtn.dataset.id || editBtn.dataset.expenseId;
                    if (id) this.openEditExpense(id);
                    return;
                }
                if (delBtn) {
                    const id = delBtn.dataset.id || delBtn.dataset.expenseId;
                    if (id) this.handleDeleteClick(delBtn, id);
                    return;
                }
            });
        }
    }

    // Handle delete button click with debounce/guard to prevent duplicate requests
    handleDeleteClick(button, id) {
        if (!id) return;
        // If deletion already in progress for this id, ignore subsequent clicks
        if (this.deletionInProgress.has(id)) return;

        // Ask for confirmation synchronously first
        if (!confirm('Delete this expense?')) return;

        try {
            // mark as in-progress and disable button for feedback
            this.deletionInProgress.add(id);
            if (button) button.disabled = true;
            // call delete and ensure cleanup in finally
            const p = this.deleteExpense(id);
            // ensure cleanup even if caller didn't await
            p.finally(() => {
                this.deletionInProgress.delete(id);
                if (button) button.disabled = false;
            });
        } catch (err) {
            // cleanup on synchronous errors
            this.deletionInProgress.delete(id);
            if (button) button.disabled = false;
        }
    }

    // Debounce utility
    debounce(fn, delay) {
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    /** ────────────────────────────────────────────────────────────────
     *  BACKEND FETCHING LOGIC
     *  ──────────────────────────────────────────────────────────────── */
    async loadExpenses(page = 0) {
        if (this.isLoading) return;
        this.isLoading = true;

        try {
            this.showLoading(true);
            this.currentPage = page;

            const data = await this.fetchExpensesFromBackend();

            // store last fetched data for fast re-render when toggling view
            this.lastData = data;
            this.renderExpenses(data.expenses);
            this.renderPagination(data.currentPage, data.totalPages);
            this.updateFilterSummary(data.totalElements);

        } catch (error) {
            console.error('Error loading expenses:', error);
            this.showError('Failed to load expenses. Please try again.');
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }

    async fetchExpensesFromBackend() {
        const params = new URLSearchParams({
            page: this.currentPage,
            size: this.pageSize,
            ...(this.filters.search && { search: this.filters.search }),
            ...(this.filters.category && { category: this.filters.category }),
            ...(this.filters.dateFrom && { dateFrom: this.filters.dateFrom }),
            ...(this.filters.dateTo && { dateTo: this.filters.dateTo })
        });

        const cacheKey = params.toString();
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            console.log('[Cache Hit]', cacheKey);
            return cached.data;
        }

        // Build headers and include Authorization fallback from localStorage token
        const headers = {
            'Accept': 'application/json'
        };
        const storedToken = (() => {
            try { return localStorage.getItem('authToken'); } catch (e) { return null; }
        })();
        if (storedToken) {
            headers['Authorization'] = 'Bearer ' + storedToken;
        }

        // Use the paginated/filter-capable endpoint `/api/expense/all` which accepts
        // page,size,search,category,dateFrom,dateTo. The older `/get` returns all
        // expenses without filtering which prevented quick-filters from working.
        const response = await apiFetch(`${this.baseURL}/all?${params.toString()}`, {
            method: 'GET',
            headers
        });
        if (!response.ok) {
            // capture body when possible to help debug 401/403/CORS issues
            let text = null;
            try { text = await response.text(); } catch (e) { /* ignore */ }
            console.error('fetchExpensesFromBackend failed', { status: response.status, body: text });
            throw new Error('Failed to fetch expenses: ' + response.status);
        }

        const payload = await response.json();

        // Normalize response: support both array and paginated object
        let data;
        if (Array.isArray(payload)) {
            data = {
                expenses: payload,
                currentPage: 0,
                totalPages: 1,
                totalElements: payload.length
            };
        } else if (payload && Array.isArray(payload.expenses)) {
            data = payload;
        } else if (payload && Array.isArray(payload.data)) {
            // some APIs wrap under `data`
            data = {
                expenses: payload.data,
                currentPage: payload.currentPage || 0,
                totalPages: payload.totalPages || 1,
                totalElements: payload.totalElements || payload.data.length
            };
        } else {
            // Unexpected shape — try to coerce
            data = {
                expenses: [],
                currentPage: 0,
                totalPages: 0,
                totalElements: 0
            };
        }

        this.cache.set(cacheKey, { data, timestamp: Date.now() });
        // also update lastData here in case fetchExpensesFromBackend is used directly
        this.lastData = data;
        return data;
    }

    setViewMode(view) {
        if (!view || (view !== 'grid' && view !== 'list')) return;
        this.viewMode = view;
        // toggle active class
        document.querySelectorAll('.view-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));

        // re-render using cached data if available
        if (this.lastData && Array.isArray(this.lastData.expenses)) {
            this.renderExpenses(this.lastData.expenses);
            return;
        }

        // otherwise reload
        this.loadExpenses(this.currentPage);
    }

    // Navigate to edit page for given expense id. Keep simple: server `add-expense` accepts ?id=
    openEditExpense(id) {
        if (!id) return;
        window.location.href = `/add-expense?id=${encodeURIComponent(id)}`;
    }

    // Delete expense by id, remove from UI by reloading the page data on success
    async deleteExpense(id) {
        if (!id) return;
        // Confirmation is handled by caller (handleDeleteClick) to avoid double prompts and
        // to ensure deletion-in-progress state is managed correctly.

        // headers + auth fallback
        const headers = { 'Accept': 'application/json' };
        try {
            const storedToken = (() => { try { return localStorage.getItem('authToken'); } catch (e) { return null; } })();
            if (storedToken) headers['Authorization'] = 'Bearer ' + storedToken;

            const res = await apiFetch(`${this.baseURL}/${encodeURIComponent(id)}`, {
                method: 'DELETE',
                headers
            });

            if (!res.ok) {
                // Try to parse error JSON message from server for a friendlier message
                let bodyText = null;
                try {
                    const json = await res.json();
                    bodyText = json.message || JSON.stringify(json);
                } catch (e) {
                    try { bodyText = await res.text(); } catch (e2) { bodyText = null; }
                }
                console.error('deleteExpense failed', { status: res.status, body: bodyText });
                this.showError(bodyText ? `Delete failed: ${bodyText}` : 'Failed to delete expense.');
                return;
            }

            // refresh list (keep current page)
            this.loadExpenses(this.currentPage);
        } catch (err) {
            console.error('deleteExpense error', err);
            this.showError('Failed to delete expense.');
        }
    }

    /** ────────────────────────────────────────────────────────────────
     *  FILTER HANDLERS
     *  ──────────────────────────────────────────────────────────────── */
    applyFilters() {
        const filterForm = document.getElementById('filterForm');
        this.filters = {};

        if (filterForm) {
            const formData = new FormData(filterForm);
            for (let [key, value] of formData.entries()) {
                if (value && value.trim()) this.filters[key] = value.trim();
            }
        } else {
            // Fallback: gather known inputs directly
            const searchInput = document.getElementById('searchInput') || document.getElementById('searchText');
            const category = document.getElementById('categoryFilter');
            const start = document.getElementById('startDate') || document.getElementById('dateFrom');
            const end = document.getElementById('endDate') || document.getElementById('dateTo');
            const minAmount = document.getElementById('minAmount');
            const maxAmount = document.getElementById('maxAmount');

            if (searchInput && searchInput.value.trim()) this.filters.search = searchInput.value.trim();
            if (category && category.value) this.filters.category = category.value;
            if (start && start.value) this.filters.dateFrom = start.value;
            if (end && end.value) this.filters.dateTo = end.value;
            if (minAmount && minAmount.value) this.filters.minAmount = minAmount.value;
            if (maxAmount && maxAmount.value) this.filters.maxAmount = maxAmount.value;
        }

        this.clearQuickFilter();
        this.loadExpenses(0);
    }

    async applyQuickFilter(filterType) {
        if (this.isLoading) return;
        this.isLoading = true;

        try {
            this.showLoading(true);

            const now = new Date();
            let startDate, endDate;

            switch (filterType) {
                case 'week':
                    const day = now.getDay();
                    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                    startDate = new Date(now.getFullYear(), now.getMonth(), diff);
                    endDate = new Date();
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    endDate = new Date();
                    break;
                case '30days':
                    endDate = new Date();
                    startDate = new Date();
                    startDate.setDate(endDate.getDate() - 30);
                    break;
                default:
                    return;
            }

            const formatDate = (d) => d.toISOString().split('T')[0];
            const start = formatDate(startDate);
            const end = formatDate(endDate);

            // Update UI inputs (support both id variants)
            const dateFromInput = document.getElementById('startDate') || document.getElementById('dateFrom');
            const dateToInput = document.getElementById('endDate') || document.getElementById('dateTo');
            if (dateFromInput) dateFromInput.value = start;
            if (dateToInput) dateToInput.value = end;

            this.filters = {
                ...this.filters,
                dateFrom: start,
                dateTo: end,
                quickFilter: filterType
            };

            const cacheKey = this.generateCacheKey();
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    console.log(`[Cache Hit] Quick Filter: ${filterType}`);
                    this.setActiveQuickFilter(filterType);
                    this.renderExpenses(cached.data.expenses);
                    this.updateFilterSummary(cached.data.totalElements);
                    this.renderPagination(cached.data.currentPage, cached.data.totalPages);
                    return;
                }
                this.cache.delete(cacheKey);
            }

            const data = await this.fetchExpensesFromBackend();
            this.cache.set(cacheKey, { data, timestamp: Date.now() });

            this.setActiveQuickFilter(filterType);
            this.renderExpenses(data.expenses);
            this.updateFilterSummary(data.totalElements);
            this.renderPagination(data.currentPage, data.totalPages);

        } catch (error) {
            console.error('Error applying quick filter:', error);
            this.showError('Failed to apply quick filter. Please try again.');
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }

    clearFilters() {
        const filterForm = document.getElementById('filterForm');
        if (filterForm) filterForm.reset();
        this.filters = {};
        this.cache.clear();
        this.clearQuickFilter();
        this.loadExpenses(0);
    }

    clearQuickFilter() {
        document.querySelectorAll('.quick-filter-btn').forEach(btn => btn.classList.remove('active'));
    }

    setActiveQuickFilter(activeFilter) {
        document.querySelectorAll('.quick-filter-btn').forEach(btn =>
            btn.classList.toggle('active', btn.dataset.filter === activeFilter)
        );
    }

    generateCacheKey() {
        return JSON.stringify(this.filters);
    }

    /** ────────────────────────────────────────────────────────────────
     *  RENDER METHODS
     *  ──────────────────────────────────────────────────────────────── */
    renderExpenses(expenses) {
        const container = document.getElementById('expensesContainer');
        if (!container) return;
        container.innerHTML = '';

        if (!expenses || expenses.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt empty-icon"></i>
                    <div class="empty-title">No Expenses Found</div>
                    <div class="empty-message">
                        Try adjusting your filters or add a new expense.
                    </div>
                    <a href="/add-expense" class="btn btn-primary">
                        <i class="fas fa-plus"></i> Add Expense
                    </a>
                </div>
            `;
            return;
        }
        // Use a wrapper that changes layout based on viewMode
        const wrapper = document.createElement('div');
        wrapper.className = this.viewMode === 'list' ? 'expenses-list' : 'expenses-grid';

        expenses.forEach(expense => {
            const card = document.createElement('div');
            card.classList.add('expense-card');

            if (this.viewMode === 'list') {
                // list: full-width rows with description left and amount right
                card.innerHTML = `
                    <div class="expense-item">
                        <div style="display:flex;justify-content:space-between;align-items:center;">
                            <div>
                                <div class="expense-description">${expense.description || ''}</div>
                                <div class="expense-date">${expense.category || ''} ${expense.createdAt ? new Date(expense.createdAt).toLocaleDateString() : ''}</div>
                            </div>
                            <div class="expense-amount">$${parseFloat(expense.amount).toFixed(2)}</div>
                        </div>
                        <div class="expense-actions" style="position:absolute; right:16px; bottom:16px;">
                            <button class="expense-action-btn edit edit-expense-btn" data-expense-id="${expense.id}" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="expense-action-btn delete delete-expense-btn" data-expense-id="${expense.id}" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            } else {
                // grid: compact card view
                card.innerHTML = `
                    <div class="expense-item">
                        <div class="expense-header">
                            <span class="expense-description">${expense.description || ''}</span>
                            <span class="expense-amount">$${parseFloat(expense.amount).toFixed(2)}</span>
                        </div>
                        <div class="expense-meta">
                            <span class="expense-category">${expense.category || ''}</span>
                            <span class="expense-date">${expense.createdAt ? new Date(expense.createdAt).toLocaleDateString() : ''}</span>
                        </div>
                        <div class="expense-actions" style="position:absolute; right:16px; bottom:16px;">
                            <button class="expense-action-btn edit edit-expense-btn" data-expense-id="${expense.id}" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="expense-action-btn delete delete-expense-btn" data-expense-id="${expense.id}" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            }

            wrapper.appendChild(card);
        });

        container.appendChild(wrapper);
    }

    renderPagination(currentPage, totalPages) {
        const paginationContainer = document.getElementById('paginationContainer');
        if (!paginationContainer) return;

        paginationContainer.innerHTML = '';
        if (totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }

        paginationContainer.style.display = 'flex';

        const prevDisabled = currentPage === 0 ? 'disabled' : '';
        const nextDisabled = currentPage >= totalPages - 1 ? 'disabled' : '';

        paginationContainer.innerHTML = `
            <button class="btn btn-secondary" ${prevDisabled} onclick="window.expenseManager.loadExpenses(${currentPage - 1})">
                <i class="fas fa-chevron-left"></i> Prev
            </button>
            <span class="pagination-info">Page ${currentPage + 1} of ${totalPages}</span>
            <button class="btn btn-secondary" ${nextDisabled} onclick="window.expenseManager.loadExpenses(${currentPage + 1})">
                Next <i class="fas fa-chevron-right"></i>
            </button>
        `;
    }

    updateFilterSummary(count) {
        // Update header counter if present (preferred) and fallback to filterSummary
        const headerCount = document.getElementById('expensesCount');
        if (headerCount) {
            headerCount.textContent = String(count || 0);
        }

        const summaryEl = document.getElementById('filterSummary');
        if (summaryEl) {
            summaryEl.textContent = `Showing ${count} expense${count !== 1 ? 's' : ''}`;
        }
    }

    showLoading(show) {
        const loadingEl = document.getElementById('loadingExpenses');
        if (loadingEl) loadingEl.style.display = show ? 'block' : 'none';
    }

    showError(message) {
        alert(message);
    }
}

/** ────────────────────────────────────────────────────────────────
 *  INITIALIZATION
 *  ──────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function() {
    if (!window.expenseManagerInitialized) {
        window.expenseManagerInitialized = true;
        window.expenseManager = new ExpenseManager();
    }
});