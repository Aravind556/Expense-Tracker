// Expense management functionality with advanced filtering
class ExpenseManager {
    constructor() {
        this.baseURL = '/api/expense'; // Updated to use full API path
        this.currentPage = 0;
        this.pageSize = 10;
        this.filters = {};
        this.cache = new Map(); // Cache for API responses
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.init();
    }

    init() {
        this.setupEv// Global functions for template usage      this.loadExpenses();
    }

    /**
     * Setup all event listeners for filtering and interactions
     */
    setupEventListeners() {
        // Filter form submission
        const filterForm = document.getElementById('filterForm');
        if (filterForm) {
            filterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.applyFilters();
            });
        }

        // Real-time search with debouncing
        const searchInput = document.getElementById('searchText');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => {
                this.applyFilters();
            }, 300));
        }

        // Category filter change
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                this.applyFilters();
            });
        }

        // Date range filters
        const dateFrom = document.getElementById('dateFrom');
        const dateTo = document.getElementById('dateTo');
        if (dateFrom) {
            dateFrom.addEventListener('change', () => {
                this.applyFilters();
            });
        }
        if (dateTo) {
            dateTo.addEventListener('change', () => {
                this.applyFilters();
            });
        }

        // Quick filter buttons
        const quickFilterButtons = document.querySelectorAll('.quick-filter-btn');
        quickFilterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.applyQuickFilter(e.target.dataset.filter);
            });
        });

        // Amount range filters
        const minAmount = document.getElementById('minAmount');
        const maxAmount = document.getElementById('maxAmount');
        if (minAmount) {
            minAmount.addEventListener('input', this.debounce(() => {
                this.applyFilters();
            }, 300));
        }
        if (maxAmount) {
            maxAmount.addEventListener('input', this.debounce(() => {
                this.applyFilters();
            }, 300));
        }
    }

    /**
     * Debounce utility function to limit API calls during typing
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Load expenses with intelligent filtering using backend APIs
     * @param {number} page - Page number for pagination
     */
    async loadExpenses(page = 0) {
        try {
            this.showLoading(true);
            this.currentPage = page;

            // Get filtered expenses using backend APIs
            const expenses = await this.fetchFilteredExpenses();

            // Apply client-side filters (search, amount range)
            const filteredExpenses = this.applyClientSideFilters(expenses);

            this.renderExpenses(filteredExpenses);
            this.updateFilterSummary(filteredExpenses.length);

        } catch (error) {
            console.error('Error loading expenses:', error);
            this.showError('Failed to load expenses. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Fetch expenses using appropriate backend endpoints based on filters
     * @returns {Promise<Array>} Filtered expenses from backend
     */
    async fetchFilteredExpenses() {
        const cacheKey = this.generateCacheKey();

        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
            this.cache.delete(cacheKey);
        }

        try {
            let expenses = [];

            // Determine which endpoint to use based on filters
            if (this.filters.category && this.filters.dateFrom && this.filters.dateTo) {
                // Category + date range: fetch by category first, then filter by date client-side
                expenses = await this.fetchByCategory(this.filters.category);
                expenses = this.filterByDateRange(expenses, this.filters.dateFrom, this.filters.dateTo);
            } else if (this.filters.category) {
                // Only category filter: use CategoryFilter endpoint
                expenses = await this.fetchByCategory(this.filters.category);
            } else if (this.filters.dateFrom && this.filters.dateTo) {
                // Only date range filter: use DateRange endpoint
                expenses = await this.fetchByDateRange(this.filters.dateFrom, this.filters.dateTo);
            } else {
                // No filters or only search: fetch all expenses
                expenses = await this.fetchAllExpenses();
            }

            // Cache the result
            this.cache.set(cacheKey, {
                data: expenses,
                timestamp: Date.now()
            });

            return expenses;

        } catch (error) {
            console.error('Error fetching filtered expenses:', error);
            return [];
        }
    }

    /**
     * Fetch expenses by category using backend API
     * @param {string} category - Category to filter by
     * @returns {Promise<Array>} Expenses for the category
     */
    async fetchByCategory(category) {
        try {
            const endpoint = `/CategoryFilter?category=${encodeURIComponent(category)}`;
            return await app.get(endpoint);
        } catch (error) {
            console.error('Error fetching expenses by category:', error);
            return [];
        }
    }

    /**
     * Fetch expenses by date range using backend API
     * @param {string} startDate - Start date in YYYY-MM-DD format
     * @param {string} endDate - End date in YYYY-MM-DD format
     * @returns {Promise<Array>} Expenses in the date range
     */
    async fetchByDateRange(startDate, endDate) {
        try {
            const endpoint = `/DateRange?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
            return await app.get(endpoint);
        } catch (error) {
            console.error('Error fetching expenses by date range:', error);
            return [];
        }
    }

    /**
     * Fetch expenses for the current week using backend API
     * @returns {Promise<Array>} Expenses for the current week
     */
    async fetchWeeklyExpenses() {
        try {
            return await app.get('/week');
        } catch (error) {
            console.error('Error fetching weekly expenses:', error);
            return [];
        }
    }

    /**
     * Filter expenses by date range (client-side)
     * @param {Array} expenses - Expenses to filter
     * @param {string} startDate - Start date
     * @param {string} endDate - End date
     * @returns {Array} Filtered expenses
     */
    filterByDateRange(expenses, startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // End of end date

        return expenses.filter(expense => {
            const expenseDate = new Date(expense.createdAt);
            return expenseDate >= start && expenseDate <= end;
        });
    }

    /**
     * Apply client-side filters (search and amount range - other filters now handled by backend)
     * @param {Array} expenses - Expenses to filter
     * @returns {Array} Filtered expenses
     */
    applyClientSideFilters(expenses) {
        let filtered = [...expenses];

        // Apply search filter (case-insensitive search in description, category, or amount)
        if (this.filters.search) {
            const searchTerm = this.filters.search.toLowerCase();
            filtered = filtered.filter(expense =>
                expense.description.toLowerCase().includes(searchTerm) ||
                expense.category.toLowerCase().includes(searchTerm) ||
                expense.amount.toString().includes(searchTerm)
            );
        }

        // Apply amount range filters
        if (this.filters.minAmount) {
            const minAmount = parseFloat(this.filters.minAmount);
            filtered = filtered.filter(expense => expense.amount >= minAmount);
        }

        if (this.filters.maxAmount) {
            const maxAmount = parseFloat(this.filters.maxAmount);
            filtered = filtered.filter(expense => expense.amount <= maxAmount);
        }

        return filtered;
    }

    /**
     * Apply filters from form inputs
     */
    applyFilters() {
        const filterForm = document.getElementById('filterForm');
        if (!filterForm) return;

        const formData = new FormData(filterForm);
        this.filters = {};

        // Collect form data
        for (let [key, value] of formData.entries()) {
            if (value && value.trim()) {
                this.filters[key] = value.trim();
            }
        }

        // Clear quick filter if manual filters are applied
        this.clearQuickFilter();

        this.loadExpenses(0);
    }

    /**
     * Apply quick filter presets using specific endpoints
     * @param {string} filterType - Type of quick filter ('week', 'month', '30days')
     */
    async applyQuickFilter(filterType) {
        try {
            this.showLoading(true);

            let expenses = [];

            switch (filterType) {
                case 'week':
                    // Use the dedicated /week endpoint
                    expenses = await this.fetchWeeklyExpenses();
                    break;
                case 'month':
                    // Use DateRange endpoint for current month
                    const now = new Date();
                    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                    const monthEnd = now;
                    expenses = await this.fetchByDateRange(
                        this.formatDate(monthStart),
                        this.formatDate(monthEnd)
                    );
                    break;
                case '30days':
                    // Use DateRange endpoint for last 30 days
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    expenses = await this.fetchByDateRange(
                        this.formatDate(thirtyDaysAgo),
                        this.formatDate(now)
                    );
                    break;
                default:
                    return;
            }

            // Apply client-side search filter if present (optional)
            if (this.filters.search) {
                expenses = this.applyClientSideFilters(expenses);
            }

            // Clear other filters and set quick filter
            this.filters = { quickFilter: filterType };
            if (this.filters.search) {
                this.filters.search = this.filters.search; // Preserve search if it exists
            }

            // Update UI
            this.setActiveQuickFilter(filterType);
            this.renderExpenses(expenses);
            this.updateFilterSummary(expenses.length);

        } catch (error) {
            console.error('Error applying quick filter:', error);
            this.showError('Failed to apply filter. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Set active state for quick filter buttons
     * @param {string} activeFilter - Active filter type
     */
    setActiveQuickFilter(activeFilter) {
        const buttons = document.querySelectorAll('.quick-filter-btn');
        buttons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === activeFilter);
        });
    }

    /**
     * Clear quick filter active state
     */
    clearQuickFilter() {
        const buttons = document.querySelectorAll('.quick-filter-btn');
        buttons.forEach(btn => btn.classList.remove('active'));
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        const filterForm = document.getElementById('filterForm');
        if (filterForm) {
            filterForm.reset();
        }

        this.filters = {};
        this.clearQuickFilter();
        this.cache.clear(); // Clear cache when filters are cleared

        this.loadExpenses(0);
    }

    /**
     * Generate cache key based on current filters
     * @returns {string} Cache key
     */
    generateCacheKey() {
        return JSON.stringify(this.filters);
    }

    /**
     * Format date for input fields
     * @param {Date} date - Date to format
     * @returns {string} Formatted date string
     */
    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    /**
     * Update filter summary with result count
     * @param {number} count - Number of filtered results
     */
    updateFilterSummary(count) {
        const summaryEl = document.getElementById('filterSummary');
        if (summaryEl) {
            summaryEl.textContent = `Showing ${count} expense${count !== 1 ? 's' : ''}`;
        }
    }

    /**
     * Show loading state
     * @param {boolean} show - Whether to show loading
     */
    showLoading(show) {
        const loadingEl = document.getElementById('loadingExpenses');
        if (loadingEl) {
            loadingEl.style.display = show ? 'block' : 'none';
        }

        if (typeof app !== 'undefined') {
            app.showLoading(show);
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    showError(message) {
        if (typeof app !== 'undefined' && app.showAlert) {
            app.showAlert(message, 'error');
        } else {
            alert(message);
        }
    }

    }


// Global functions for template usage
function editExpense(id) {
        const formattedDate = new Date(expense.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        const formattedAmount = app.formatCurrency(expense.amount);

        return `
            <div class="card expense-card" data-expense-id="${expense.id}">
                <div class="expense-item">
                    <div class="expense-header">
                        <div class="expense-title">
                            <i class="fas fa-receipt expense-icon"></i>
                            <span>${this.escapeHtml(expense.description)}</span>
                        </div>
                        <div class="expense-amount">${formattedAmount}</div>
                    </div>
                    
                    <div class="expense-details">
                        <div class="expense-meta">
                            <span class="expense-category">
                                <i class="fas fa-tag"></i>
                                <span>${this.getCategoryDisplay(expense.category)}</span>
                            </span>
                            <span class="expense-date">
                                <i class="fas fa-calendar"></i>
                                <span>${formattedDate}</span>
                            </span>
                        </div>
                        
                        <div class="expense-actions">
                            <button class="btn btn-sm btn-secondary" onclick="editExpense(${expense.id})">
                                <i class="fas fa-edit"></i>
                                Edit
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteExpense(${expense.id})">
                                <i class="fas fa-trash"></i>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

function editExpense(id) {
        const hasFilters = Object.keys(this.filters).length > 0;
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt empty-icon"></i>
                <div class="empty-title">No Expenses Found</div>
                <div class="empty-message">
                    ${hasFilters ? 'Try adjusting your filters or' : 'Start tracking your expenses by'} 
                    adding your first expense.
                </div>
                <a href="/add-expense" class="btn btn-primary">
                    <i class="fas fa-plus"></i>
                    Add First Expense
                </a>
            </div>
        `;
    }

function editExpense(id) {
    window.location.href = `/add-expense?id=${id}`;
}

        const startElement = currentPage * pageSize + 1;
        const endElement = Math.min((currentPage + 1) * pageSize, totalElements);

function editExpense(id) {
    window.location.href = `/add-expense?id=${id}`;
}
        try {
            const response = await app.post(this.baseURL, expenseData);
            app.showAlert('Expense added successfully!', 'success');
            return response;
        } catch (error) {
            console.error('Error creating expense:', error);
            app.showAlert(error.message || 'Failed to add expense', 'error');
            throw error;
        }
    

function editExpense(id) {
    window.location.href = `/add-expense?id=${id}`;
}

function deleteExpense(id) {
    if (confirm('Are you sure you want to delete this expense?')) {
        if (window.expenseManager) {
            window.expenseManager.deleteExpense(id);
        }
    }
}

// Additional global functions
function exportExpenses(format = 'csv') {
    if (window.expenseManager) {
        window.expenseManager.exportExpenses(format);
    }
}

function changePage(page) {
    if (window.expenseManager) {
        window.expenseManager.loadExpenses(page);
    }
}

function clearFilters() {
    if (window.expenseManager) {
        window.expenseManager.clearFilters();
    }
}

function exportExpenses(format = 'csv') {
    if (window.expenseManager) {
        window.expenseManager.exportExpenses(format);
    }
}

// Handle expense form submission
async function handleExpenseSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = form.querySelector('#submitBtn');
    
    // Validate form
    if (typeof app !== 'undefined' && !app.validateForm(form)) {
        return;
    }

    const formData = new FormData(form);
    const expenseData = {
        description: formData.get('description'),
        amount: parseFloat(formData.get('amount')),
        category: formData.get('category'),
        createdAt: formData.get('createdAt') ? formData.get('createdAt') + 'T00:00:00' : null
    };

    const expenseId = formData.get('id');
    const isEditing = expenseId && expenseId !== '';

    try {
        if (typeof app !== 'undefined') {
            app.setButtonLoading(submitBtn, true);
        } else if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Saving...';
        }
        
        let response;
        if (isEditing) {
            response = await fetch(`/api/expense/update/${expenseId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(expenseData)
            });
        } else {
            response = await fetch(`/api/expense/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(expenseData)
            });
        }

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            throw new Error(errorText);
        }

        const result = await response.json();
        console.log('Expense saved:', result);
        
        if (typeof app !== 'undefined') {
            app.showAlert(isEditing ? 'Expense updated successfully!' : 'Expense added successfully!', 'success');
        } else {
            alert(isEditing ? 'Expense updated successfully!' : 'Expense added successfully!');
        }

        // Redirect to expenses page after a short delay
        setTimeout(() => {
            window.location.href = '/expenses';
        }, 1500);

    } catch (error) {
        console.error('Error saving expense:', error);
        if (typeof app !== 'undefined') {
            app.showAlert(error.message || 'Failed to save expense', 'error');
        } else {
            alert('Error: ' + (error.message || 'Failed to save expense'));
        }
    } finally {
        if (typeof app !== 'undefined') {
            app.setButtonLoading(submitBtn, false);
        } else if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Add Expense';
        }
    }
}

// Initialize expense manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize on expenses page or add-expense page
    if (window.location.pathname.includes('/expenses') || 
        window.location.pathname.includes('/add-expense') || 
        document.getElementById('expensesContainer') ||
        document.getElementById('expenseForm')) {
        window.expenseManager = new ExpenseManager();
        
        // Setup expense form submission if on add-expense page
        const expenseForm = document.getElementById('expenseForm');
        if (expenseForm) {
            expenseForm.addEventListener('submit', handleExpenseSubmit);
        }
    }
});