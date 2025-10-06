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
        this.setupEventListeners();
        this.loadExpenses();
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
     * Fetch all expenses for the user
     * @returns {Promise<Array>} All user expenses
     */
    async fetchAllExpenses() {
        try {
            return await app.get('/get');
        } catch (error) {
            console.error('Error fetching all expenses:', error);
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
     * Apply quick filter presets
     * @param {string} filterType - Type of quick filter ('week', 'month', '30days')
     */
    applyQuickFilter(filterType) {
        const now = new Date();
        let startDate, endDate;

        switch (filterType) {
            case 'week':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
                endDate = now;
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = now;
                break;
            case '30days':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 30);
                endDate = now;
                break;
            default:
                return;
        }

        // Set date inputs
        const dateFromInput = document.getElementById('dateFrom');
        const dateToInput = document.getElementById('dateTo');

        if (dateFromInput) {
            dateFromInput.value = this.formatDate(startDate);
        }
        if (dateToInput) {
            dateToInput.value = this.formatDate(endDate);
        }

        // Clear other filters
        this.filters = {
            dateFrom: this.formatDate(startDate),
            dateTo: this.formatDate(endDate)
        };

        // Update UI to show active quick filter
        this.setActiveQuickFilter(filterType);

        this.loadExpenses(0);
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

    async loadExpenses(page = 0) {
        try {
            app.showLoading(true);
            this.currentPage = page;

            let endpoint = `${this.baseURL}/get`;
            
            // Apply category filter if selected
            if (this.filters.category) {
                endpoint = `${this.baseURL}/CategoryFilter?category=${this.filters.category}`;
            }

            let data = await app.get(endpoint);
            
            // Apply client-side filtering for search and date ranges
            if (this.filters.search || this.filters.dateFrom || this.filters.dateTo) {
                data = this.filterExpensesClientSide(data);
            }
            
            this.renderExpenses(data);
        } catch (error) {
            console.error('Error loading expenses:', error);
            app.showAlert('Failed to load expenses', 'error');
        } finally {
            app.showLoading(false);
        }
    }

    applyFilters() {
        const filterForm = document.getElementById('filterForm');
        if (!filterForm) return;

        const formData = new FormData(filterForm);
        this.filters = {};

        for (let [key, value] of formData.entries()) {
            if (value.trim()) {
                this.filters[key] = value.trim();
            }
        }

        this.loadExpenses(0);
    }

    // Client-side filtering for search and date range since API doesn't have these endpoints
    filterExpensesClientSide(expenses) {
        let filtered = [...expenses];

        // Apply search filter
        if (this.filters.search) {
            const searchTerm = this.filters.search.toLowerCase();
            filtered = filtered.filter(expense => 
                expense.description.toLowerCase().includes(searchTerm) ||
                expense.category.toLowerCase().includes(searchTerm)
            );
        }

        // Apply date range filters
        if (this.filters.dateFrom) {
            const fromDate = new Date(this.filters.dateFrom);
            filtered = filtered.filter(expense => 
                new Date(expense.createdAt) >= fromDate
            );
        }

        if (this.filters.dateTo) {
            const toDate = new Date(this.filters.dateTo);
            toDate.setHours(23, 59, 59, 999); // End of day
            filtered = filtered.filter(expense => 
                new Date(expense.createdAt) <= toDate
            );
        }

        return filtered;
    }

    clearFilters() {
        const filterForm = document.getElementById('filterForm');
        if (filterForm) {
            filterForm.reset();
        }
        this.filters = {};
        this.loadExpenses(0);
    }

    renderExpenses(data) {
        const container = document.getElementById('expensesContainer');
        if (!container) return;

        if (!data.content || data.content.length === 0) {
            this.renderEmptyState(container);
            return;
        }

        container.innerHTML = data.content.map(expense => this.createExpenseCard(expense)).join('');
        this.renderPagination(data);
    }

    createExpenseCard(expense) {
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

    renderEmptyState(container) {
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

    renderPagination(data) {
        const paginationContainer = document.querySelector('.pagination-container');
        if (!paginationContainer || data.totalPages <= 1) {
            if (paginationContainer) {
                paginationContainer.parentElement.style.display = 'none';
            }
            return;
        }

        const currentPage = data.number;
        const totalPages = data.totalPages;
        const totalElements = data.totalElements;
        const pageSize = data.size;

        const startElement = currentPage * pageSize + 1;
        const endElement = Math.min((currentPage + 1) * pageSize, totalElements);

        paginationContainer.innerHTML = `
            <div class="pagination-info">
                Showing ${startElement} to ${endElement} of ${totalElements} expenses
            </div>
            
            <div class="pagination-controls">
                ${currentPage > 0 ? `<button class="btn btn-secondary" onclick="changePage(0)">
                    <i class="fas fa-angle-double-left"></i>
                </button>` : ''}
                
                ${currentPage > 0 ? `<button class="btn btn-secondary" onclick="changePage(${currentPage - 1})">
                    <i class="fas fa-angle-left"></i>
                </button>` : ''}
                
                <span class="pagination-current">
                    Page ${currentPage + 1} of ${totalPages}
                </span>
                
                ${currentPage < totalPages - 1 ? `<button class="btn btn-secondary" onclick="changePage(${currentPage + 1})">
                    <i class="fas fa-angle-right"></i>
                </button>` : ''}
                
                ${currentPage < totalPages - 1 ? `<button class="btn btn-secondary" onclick="changePage(${totalPages - 1})">
                    <i class="fas fa-angle-double-right"></i>
                </button>` : ''}
            </div>
        `;

        paginationContainer.parentElement.style.display = 'block';
    }

    async createExpense(expenseData) {
        try {
            const response = await app.post(this.baseURL, expenseData);
            app.showAlert('Expense added successfully!', 'success');
            return response;
        } catch (error) {
            console.error('Error creating expense:', error);
            app.showAlert(error.message || 'Failed to add expense', 'error');
            throw error;
        }
    }

    async updateExpense(id, expenseData) {
        try {
            const response = await app.put(`${this.baseURL}/${id}`, expenseData);
            app.showAlert('Expense updated successfully!', 'success');
            return response;
        } catch (error) {
            console.error('Error updating expense:', error);
            app.showAlert(error.message || 'Failed to update expense', 'error');
            throw error;
        }
    }

    async deleteExpense(id) {
        try {
            await app.delete(`${this.baseURL}/${id}`);
            app.showAlert('Expense deleted successfully!', 'success');
            
            // Remove from UI
            const expenseCard = document.querySelector(`[data-expense-id="${id}"]`);
            if (expenseCard) {
                expenseCard.remove();
            }
            
            // Reload if no expenses left on current page
            const remainingExpenses = document.querySelectorAll('.expense-card').length;
            if (remainingExpenses === 0 && this.currentPage > 0) {
                this.loadExpenses(this.currentPage - 1);
            } else if (remainingExpenses === 0) {
                this.loadExpenses(0);
            }
        } catch (error) {
            console.error('Error deleting expense:', error);
            app.showAlert(error.message || 'Failed to delete expense', 'error');
        }
    }

    async getExpense(id) {
        try {
            return await app.get(`${this.baseURL}/${id}`);
        } catch (error) {
            console.error('Error getting expense:', error);
            app.showAlert(error.message || 'Failed to load expense', 'error');
            throw error;
        }
    }

    getCategoryDisplay(category) {
        const categoryMap = {
            'FOOD': '🍔 Food',
            'TRANSPORTATION': '🚗 Transportation',
            'ENTERTAINMENT': '🎬 Entertainment',
            'UTILITIES': '⚡ Utilities',
            'HEALTHCARE': '🏥 Healthcare',
            'OTHER': '📦 Other'
        };
        return categoryMap[category] || category;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Export functionality
    async exportExpenses(format = 'csv') {
        try {
            app.showLoading(true);
            const params = new URLSearchParams({
                format: format,
                ...this.filters
            });

            const response = await fetch(`${app.baseURL}${this.baseURL}/export?${params}`, {
                headers: app.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Export failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `expenses_${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            app.showAlert('Expenses exported successfully!', 'success');
        } catch (error) {
            console.error('Error exporting expenses:', error);
            app.showAlert('Failed to export expenses', 'error');
        } finally {
            app.showLoading(false);
        }
    }
}

// Global functions for template usage
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



// Export for other modules
window.ExpenseManager = ExpenseManager;