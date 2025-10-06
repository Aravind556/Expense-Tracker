// Enhanced Dashboard functionality with interactive features and time period selection
class DashboardManager {
    constructor() {
        this.baseURL = '/api';
        this.refreshInterval = 300000; // 5 minutes
        this.refreshTimer = null;
        this.currentTimePeriod = 'month'; // week, month, quarter, year
        this.cache = new Map(); // Cache for API responses
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.charts = {}; // Store chart instances
        this.init();
    }

    /**
     * Initialize dashboard components and event listeners
     */
    init() {
        this.loadDashboardData();
        this.setupAutoRefresh();
        this.setupEventListeners();
        this.setupTimePeriodSelector();
    }

    /**
     * Setup all event listeners for dashboard interactions
     */
    setupEventListeners() {
        // Refresh button
        const refreshBtn = document.getElementById('refreshDashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadDashboardData();
            });
        }

        // Export button
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        }

        // Quick action buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.quick-action-btn')) {
                const btn = e.target.closest('.quick-action-btn');
                this.handleQuickAction(btn);
            }
        });

        // Chart interaction handlers
        this.setupChartInteractions();
    }

    /**
     * Setup time period selector functionality
     */
    setupTimePeriodSelector() {
        const periodSelector = document.getElementById('timePeriodSelector');
        if (periodSelector) {
            periodSelector.addEventListener('change', (e) => {
                this.currentTimePeriod = e.target.value;
                this.loadDashboardData();
                this.saveTimePeriodPreference();
            });

            // Load saved preference
            this.loadTimePeriodPreference();
        }
    }

    /**
     * Setup chart click interactions
     */
    setupChartInteractions() {
        // Category chart clicks - navigate to filtered expenses
        document.addEventListener('click', (e) => {
            if (e.target.closest('.chart-category-item')) {
                const item = e.target.closest('.chart-category-item');
                const category = item.dataset.category;
                if (category) {
                    this.navigateToFilteredExpenses({ category });
                }
            }
        });
    }

    /**
     * Load all dashboard data in parallel for better performance
     */
    async loadDashboardData() {
        try {
            this.showLoading(true);
            console.log(`Loading dashboard data for period: ${this.currentTimePeriod}`);

            // Calculate date range for current period
            const dateRange = this.calculateDateRange(this.currentTimePeriod);

            // Load all data in parallel
            const [stats, recentExpenses, categoryBreakdown, monthlyData] = await Promise.all([
                this.loadStatistics(dateRange),
                this.loadRecentExpenses(),
                this.loadCategoryBreakdown(dateRange),
                this.loadMonthlyData()
            ]);

            // Process and display data
            this.processDashboardData({
                stats,
                recentExpenses,
                categoryBreakdown,
                monthlyData,
                dateRange
            });

            // Update last refresh time
            this.updateLastRefreshTime();

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showError('Failed to load dashboard data. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Calculate date range for the selected time period
     * @param {string} period - Time period (week, month, quarter, year)
     * @returns {Object} Date range object with startDate and endDate
     */
    calculateDateRange(period) {
        const now = new Date();
        const startDate = new Date(now);
        const endDate = new Date(now);

        switch (period) {
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setDate(1); // First day of current month
                break;
            case 'quarter':
                const quarterStart = Math.floor(now.getMonth() / 3) * 3;
                startDate.setMonth(quarterStart, 1);
                break;
            case 'year':
                startDate.setMonth(0, 1); // January 1st
                break;
            default:
                startDate.setDate(now.getDate() - 30); // Default to 30 days
        }

        return {
            startDate: this.formatDateForAPI(startDate),
            endDate: this.formatDateForAPI(endDate)
        };
    }

    /**
     * Load dashboard statistics with optional date range
     * @param {Object} dateRange - Date range object
     * @returns {Promise<Object>} Statistics data
     */
    async loadStatistics(dateRange) {
        const cacheKey = `stats_${this.currentTimePeriod}`;

        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        try {
            let stats;

            if (dateRange) {
                // Use date range filtered data
                const expenses = await app.get(`/expense/DateRange?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
                stats = this.calculateStatsFromExpenses(expenses);
            } else {
                // Use general stats endpoint
                stats = await app.get('/dashboard/statistics');
            }

            // Cache the result
            this.cache.set(cacheKey, {
                data: stats,
                timestamp: Date.now()
            });

            return stats;
        } catch (error) {
            console.error('Error loading statistics:', error);
            return this.getDefaultStats();
        }
    }

    /**
     * Calculate statistics from expense data
     * @param {Array} expenses - Array of expenses
     * @returns {Object} Statistics object
     */
    calculateStatsFromExpenses(expenses) {
        if (!expenses || expenses.length === 0) {
            return this.getDefaultStats();
        }

        const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);
        const averageTransaction = totalExpenses / expenses.length;

        return {
            totalExpenses: totalExpenses,
            totalTransactions: expenses.length,
            averageTransaction: averageTransaction,
            period: this.currentTimePeriod
        };
    }

    /**
     * Get default statistics when no data is available
     * @returns {Object} Default stats object
     */
    getDefaultStats() {
        return {
            totalExpenses: 0,
            totalTransactions: 0,
            averageTransaction: 0,
            period: this.currentTimePeriod
        };
    }

    /**
     * Load recent expenses for dashboard display
     * @returns {Promise<Array>} Recent expenses
     */
    async loadRecentExpenses() {
        try {
            return await app.get('/dashboard/recent-expenses');
        } catch (error) {
            console.error('Error loading recent expenses:', error);
            return [];
        }
    }

    /**
     * Load category breakdown data
     * @param {Object} dateRange - Date range for filtering
     * @returns {Promise<Array>} Category breakdown data
     */
    async loadCategoryBreakdown(dateRange) {
        const cacheKey = `categories_${this.currentTimePeriod}`;

        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        try {
            let breakdown;

            if (dateRange) {
                // Calculate breakdown from date-filtered expenses
                const expenses = await app.get(`/expense/DateRange?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
                breakdown = this.calculateCategoryBreakdown(expenses);
            } else {
                // Use dashboard endpoint
                breakdown = await app.get('/dashboard/category-breakdown');
            }

            // Cache the result
            this.cache.set(cacheKey, {
                data: breakdown,
                timestamp: Date.now()
            });

            return breakdown;
        } catch (error) {
            console.error('Error loading category breakdown:', error);
            return [];
        }
    }

    /**
     * Calculate category breakdown from expenses
     * @param {Array} expenses - Array of expenses
     * @returns {Array} Category breakdown data
     */
    calculateCategoryBreakdown(expenses) {
        if (!expenses || expenses.length === 0) {
            return [];
        }

        const categoryTotals = {};
        let totalAmount = 0;

        // Calculate totals by category
        expenses.forEach(expense => {
            const category = expense.category || 'OTHER';
            const amount = parseFloat(expense.amount || 0);

            categoryTotals[category] = (categoryTotals[category] || 0) + amount;
            totalAmount += amount;
        });

        // Convert to percentage breakdown
        return Object.entries(categoryTotals).map(([category, amount]) => ({
            name: this.getCategoryDisplayName(category),
            category: category,
            amount: amount,
            percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0
        })).sort((a, b) => b.amount - a.amount);
    }

    /**
     * Get display name for category
     * @param {string} category - Category code
     * @returns {string} Display name
     */
    getCategoryDisplayName(category) {
        const displayNames = {
            'FOOD': 'Food',
            'TRANSPORTATION': 'Transportation',
            'ENTERTAINMENT': 'Entertainment',
            'UTILITIES': 'Utilities',
            'HEALTHCARE': 'Healthcare',
            'SHOPPING': 'Shopping',
            'EDUCATION': 'Education',
            'OTHER': 'Other'
        };
        return displayNames[category] || category;
    }

    /**
     * Load monthly trend data for charts
     * @returns {Promise<Array>} Monthly data
     */
    async loadMonthlyData() {
        try {
            // This would ideally use a backend endpoint for monthly trends
            // For now, we'll calculate from available data
            const currentDate = new Date();
            const monthlyData = [];

            // Generate last 6 months of data
            for (let i = 5; i >= 0; i--) {
                const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
                const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

                // In a real implementation, this would call a backend endpoint
                // For now, we'll use placeholder data
                monthlyData.push({
                    month: monthName,
                    amount: Math.random() * 1000 + 500, // Placeholder
                    transactions: Math.floor(Math.random() * 20) + 5
                });
            }

            return monthlyData;
        } catch (error) {
            console.error('Error loading monthly data:', error);
            return [];
        }
    }

    /**
     * Process and display dashboard data
     * @param {Object} data - Dashboard data object
     */
    processDashboardData(data) {
        // Update statistics cards
        this.updateStatisticsCards(data.stats);

        // Update recent expenses
        this.updateRecentExpenses(data.recentExpenses);

        // Update category breakdown chart
        this.updateCategoryChart(data.categoryBreakdown);

        // Update monthly trend chart
        this.updateMonthlyChart(data.monthlyData);

        // Calculate and show trends
        this.calculateAndShowTrends(data);
    }

    /**
     * Update statistics cards with trend indicators
     * @param {Object} stats - Statistics data
     */
    updateStatisticsCards(stats) {
        // Update total expenses
        this.updateStatCard('totalExpenses', stats.totalExpenses, 'Total Expenses');

        // Update transaction count
        this.updateStatCard('totalTransactions', stats.totalTransactions, 'Transactions');

        // Update average transaction
        this.updateStatCard('averageTransaction', stats.averageTransaction, 'Average Transaction');
    }

    /**
     * Update individual statistic card
     * @param {string} cardId - Card element ID
     * @param {number} value - Value to display
     * @param {string} label - Card label
     */
    updateStatCard(cardId, value, label) {
        const card = document.getElementById(cardId);
        if (card) {
            const valueEl = card.querySelector('.stat-value');
            const labelEl = card.querySelector('.stat-label');

            if (valueEl) {
                // Format currency values
                if (cardId.includes('Expenses') || cardId.includes('Transaction')) {
                    valueEl.textContent = this.formatCurrency(value);
                } else {
                    valueEl.textContent = value.toLocaleString();
                }
            }

            if (labelEl) {
                labelEl.textContent = label;
            }
        }
    }

    /**
     * Update recent expenses display
     * @param {Array} expenses - Recent expenses array
     */
    updateRecentExpenses(expenses) {
        const container = document.getElementById('recentExpensesList');
        if (!container) return;

        if (!expenses || expenses.length === 0) {
            container.innerHTML = '<div class="no-data">No recent expenses</div>';
            return;
        }

        container.innerHTML = expenses.slice(0, 5).map(expense => `
            <div class="recent-expense-item" onclick="dashboardManager.navigateToExpense(${expense.id})">
                <div class="expense-info">
                    <div class="expense-description">${this.escapeHtml(expense.description || 'No description')}</div>
                    <div class="expense-meta">
                        <span class="expense-category">${this.getCategoryDisplayName(expense.category)}</span>
                        <span class="expense-date">${this.formatDate(expense.createdAt)}</span>
                    </div>
                </div>
                <div class="expense-amount">${this.formatCurrency(expense.amount)}</div>
            </div>
        `).join('');
    }

    /**
     * Update category breakdown chart
     * @param {Array} categories - Category data array
     */
    updateCategoryChart(categories) {
        const chartContainer = document.getElementById('categoryChart');
        if (!chartContainer) return;

        if (!categories || categories.length === 0) {
            chartContainer.innerHTML = '<div class="no-data">No category data available</div>';
            return;
        }

        // Create interactive category list
        chartContainer.innerHTML = `
            <div class="category-breakdown">
                ${categories.map(cat => `
                    <div class="category-item chart-category-item" data-category="${cat.category}">
                        <div class="category-info">
                            <div class="category-name">${cat.name}</div>
                            <div class="category-percentage">${cat.percentage.toFixed(1)}%</div>
                        </div>
                        <div class="category-amount">${this.formatCurrency(cat.amount)}</div>
                        <div class="category-bar">
                            <div class="category-bar-fill" style="width: ${cat.percentage}%"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Update monthly trend chart
     * @param {Array} monthlyData - Monthly data array
     */
    updateMonthlyChart(monthlyData) {
        const chartContainer = document.getElementById('monthlyChart');
        if (!chartContainer) return;

        if (!monthlyData || monthlyData.length === 0) {
            chartContainer.innerHTML = '<div class="no-data">No trend data available</div>';
            return;
        }

        // Simple bar chart representation
        const maxAmount = Math.max(...monthlyData.map(d => d.amount));

        chartContainer.innerHTML = `
            <div class="monthly-trend-chart">
                ${monthlyData.map(data => `
                    <div class="month-bar">
                        <div class="bar-container">
                            <div class="bar-fill" style="height: ${(data.amount / maxAmount) * 100}%">
                                <span class="bar-value">${this.formatCurrency(data.amount)}</span>
                            </div>
                        </div>
                        <div class="month-label">${data.month}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Calculate and show trend indicators
     * @param {Object} data - Dashboard data
     */
    calculateAndShowTrends(data) {
        // Calculate trends compared to previous period
        const trends = this.calculateTrends(data);

        // Update trend indicators in stat cards
        this.updateTrendIndicators(trends);
    }

    /**
     * Calculate trends for different metrics
     * @param {Object} data - Dashboard data
     * @returns {Object} Trends object
     */
    calculateTrends(data) {
        // This is a simplified trend calculation
        // In a real implementation, you'd compare with previous period data
        return {
            totalExpenses: { change: 5.2, direction: 'up' },
            transactions: { change: -2.1, direction: 'down' },
            averageTransaction: { change: 8.7, direction: 'up' }
        };
    }

    /**
     * Update trend indicators in stat cards
     * @param {Object} trends - Trends data
     */
    updateTrendIndicators(trends) {
        // Add trend indicators to stat cards
        Object.entries(trends).forEach(([metric, trend]) => {
            const card = document.querySelector(`#${metric}`);
            if (card) {
                const trendEl = card.querySelector('.trend-indicator') || document.createElement('div');
                trendEl.className = `trend-indicator trend-${trend.direction}`;
                trendEl.innerHTML = `
                    <i class="fas fa-arrow-${trend.direction}"></i>
                    ${Math.abs(trend.change)}%
                `;

                if (!card.querySelector('.trend-indicator')) {
                    card.appendChild(trendEl);
                }
            }
        });
    }

    /**
     * Navigate to filtered expenses page
     * @param {Object} filters - Filter parameters
     */
    navigateToFilteredExpenses(filters) {
        const params = new URLSearchParams();

        if (filters.category) {
            params.set('category', filters.category);
        }
        if (filters.dateFrom) {
            params.set('dateFrom', filters.dateFrom);
        }
        if (filters.dateTo) {
            params.set('dateTo', filters.dateTo);
        }

        const url = `/expenses${params.toString() ? '?' + params.toString() : ''}`;
        window.location.href = url;
    }

    /**
     * Navigate to specific expense details
     * @param {number} expenseId - Expense ID
     */
    navigateToExpense(expenseId) {
        window.location.href = `/expenses/${expenseId}`;
    }

    /**
     * Handle quick action button clicks
     * @param {HTMLElement} btn - Button element
     */
    handleQuickAction(btn) {
        const action = btn.dataset.action;

        switch (action) {
            case 'add-expense':
                window.location.href = '/add-expense';
                break;
            case 'view-expenses':
                window.location.href = '/expenses';
                break;
            case 'export-data':
                this.exportData();
                break;
            default:
                console.log('Unknown action:', action);
        }
    }

    /**
     * Export dashboard data
     */
    async exportData() {
        try {
            // Create CSV content from current dashboard data
            const data = await this.getCurrentDashboardData();
            const csv = this.convertToCSV(data);

            // Download CSV file
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);

            this.showSuccess('Data exported successfully!');
        } catch (error) {
            console.error('Export failed:', error);
            this.showError('Failed to export data');
        }
    }

    /**
     * Get current dashboard data for export
     * @returns {Promise<Object>} Dashboard data
     */
    async getCurrentDashboardData() {
        // This would gather all current dashboard data
        return {
            period: this.currentTimePeriod,
            exportDate: new Date().toISOString(),
            // Add actual data here
        };
    }

    /**
     * Convert data to CSV format
     * @param {Object} data - Data to convert
     * @returns {string} CSV string
     */
    convertToCSV(data) {
        // Simple CSV conversion - enhance as needed
        return 'Period,Export Date\n' +
               `${data.period},${data.exportDate}\n`;
    }

    /**
     * Setup auto-refresh functionality
     */
    setupAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }

        this.refreshTimer = setInterval(() => {
            this.loadDashboardData();
        }, this.refreshInterval);
    }

    /**
     * Save time period preference to localStorage
     */
    saveTimePeriodPreference() {
        try {
            localStorage.setItem('dashboardTimePeriod', this.currentTimePeriod);
        } catch (error) {
            console.warn('Could not save time period preference:', error);
        }
    }

    /**
     * Load time period preference from localStorage
     */
    loadTimePeriodPreference() {
        try {
            const saved = localStorage.getItem('dashboardTimePeriod');
            if (saved && ['week', 'month', 'quarter', 'year'].includes(saved)) {
                this.currentTimePeriod = saved;
                const selector = document.getElementById('timePeriodSelector');
                if (selector) {
                    selector.value = saved;
                }
            }
        } catch (error) {
            console.warn('Could not load time period preference:', error);
        }
    }

    /**
     * Update last refresh time display
     */
    updateLastRefreshTime() {
        const refreshTimeEl = document.getElementById('lastRefreshTime');
        if (refreshTimeEl) {
            refreshTimeEl.textContent = new Date().toLocaleTimeString();
        }
    }

    /**
     * Format date for API calls
     * @param {Date} date - Date to format
     * @returns {string} Formatted date string
     */
    formatDateForAPI(date) {
        return date.toISOString().split('T')[0];
    }

    /**
     * Format date for display
     * @param {string|Date} date - Date to format
     * @returns {string} Formatted date string
     */
    formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    /**
     * Format currency value
     * @param {number} amount - Amount to format
     * @returns {string} Formatted currency string
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Show loading state
     * @param {boolean} show - Whether to show loading
     */
    showLoading(show) {
        if (typeof app !== 'undefined' && app.showLoading) {
            app.showLoading(show);
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        if (typeof app !== 'undefined' && app.showAlert) {
            app.showAlert(message, 'error');
        } else {
            alert(message);
        }
    }

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccess(message) {
        if (typeof app !== 'undefined' && app.showAlert) {
            app.showAlert(message, 'success');
        } else {
            alert(message);
        }
    }

    /**
     * Clear all caches
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Destroy dashboard manager and cleanup
     */
    destroy() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        this.clearCache();
    }
}

// Global functions for template usage
function exportExpenses() {
    if (window.dashboardManager) {
        window.dashboardManager.exportData();
    }
}

function refreshDashboard() {
    if (window.dashboardManager) {
        window.dashboardManager.loadDashboardData();
    }
}

// Initialize dashboard manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize on dashboard page
    if (window.location.pathname.includes('/dashboard') || document.querySelector('.stats-grid')) {
        // Wait for app.js to be available
        const initDashboard = () => {
            if (typeof app !== 'undefined') {
                window.dashboardManager = new DashboardManager();
            } else {
                // Try again after a short delay
                setTimeout(initDashboard, 100);
            }
        };
        initDashboard();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (window.dashboardManager) {
        window.dashboardManager.destroy();
    }
});

// Export for other modules
window.DashboardManager = DashboardManager;