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
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.applyQuickFilter(e.target.dataset.filter);
            });
        });

        // Category, Date, Search filters (apply manually)
        const categoryFilter = document.getElementById('categoryFilter');
        const searchInput = document.getElementById('searchText');
        const dateFrom = document.getElementById('dateFrom');
        const dateTo = document.getElementById('dateTo');

        [categoryFilter, dateFrom, dateTo].forEach(el => {
            if (el) el.addEventListener('change', () => this.applyFilters());
        });

        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => {
                this.applyFilters();
            }, 400));
        }

        // Amount range
        const minAmount = document.getElementById('minAmount');
        const maxAmount = document.getElementById('maxAmount');
        [minAmount, maxAmount].forEach(el => {
            if (el) el.addEventListener('input', this.debounce(() => this.applyFilters(), 400));
        });
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

        const response = await fetch(`${this.baseURL}/all?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch expenses');

        const data = await response.json();
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
    }

    /** ────────────────────────────────────────────────────────────────
     *  FILTER HANDLERS
     *  ──────────────────────────────────────────────────────────────── */
    applyFilters() {
        const filterForm = document.getElementById('filterForm');
        if (!filterForm) return;

        const formData = new FormData(filterForm);
        this.filters = {};

        for (let [key, value] of formData.entries()) {
            if (value && value.trim()) this.filters[key] = value.trim();
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

            // Update UI inputs
            const dateFromInput = document.getElementById('dateFrom');
            const dateToInput = document.getElementById('dateTo');
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

        expenses.forEach(expense => {
            const card = document.createElement('div');
            card.classList.add('expense-card');
            card.innerHTML = `
                <div class="expense-item">
                    <div class="expense-header">
                        <span class="expense-description">${expense.description}</span>
                        <span class="expense-amount">$${parseFloat(expense.amount).toFixed(2)}</span>
                    </div>
                    <div class="expense-meta">
                        <span>${expense.category}</span>
                        <span>${new Date(expense.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
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
