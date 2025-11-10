/**
 * Royal Blue Premium UI - Enhanced Dashboard Manager
 * Modern dashboard with animations, charts, and micro-interactions
 */

class DashboardManager {
    constructor() {
        this.cache = new Map();
        this.refreshInterval = null;
        this.currentTimePeriod = 'month';
        this.isLoading = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeAnimations();
        this.loadDashboardData();
        this.startAutoRefresh();
    }

    setupEventListeners() {
        // Time period selector
        const timePeriodSelector = document.getElementById('timePeriodSelector');
        if (timePeriodSelector) {
            timePeriodSelector.addEventListener('change', (e) => {
                this.currentTimePeriod = e.target.value;
                this.loadDashboardData();
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshDashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshDashboard();
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
        const quickActionBtns = document.querySelectorAll('.quick-action-btn');
        quickActionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleQuickAction(e);
            });
        });

        // Recent expense items
        document.addEventListener('click', (e) => {
            if (e.target.closest('.recent-expense-item')) {
                this.handleExpenseClick(e.target.closest('.recent-expense-item'));
            }
        });
    }

    initializeAnimations() {
        // Animate statistics cards
        const statCards = document.querySelectorAll('.stat-card');
        AnimationUtils.staggerAnimation(statCards, (card) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 100);
        }, 150);

        // Animate dashboard cards
        const dashboardCards = document.querySelectorAll('.dashboard-card');
        AnimationUtils.staggerAnimation(dashboardCards, (card) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 200);
        }, 200);

        // Animate quick action buttons
        const quickActions = document.querySelectorAll('.quick-action-btn');
        AnimationUtils.staggerAnimation(quickActions, (btn) => {
            btn.style.opacity = '0';
            btn.style.transform = 'scale(0)';
            btn.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            
            setTimeout(() => {
                btn.style.opacity = '1';
                btn.style.transform = 'scale(1)';
            }, 50);
        }, 100);
    }

    async loadDashboardData() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        LoadingUtils.show();
        LoadingUtils.setText('Loading dashboard data...');

        try {
            // Load all dashboard data in parallel
            const [stats, recentExpenses, categoryData, monthlyData] = await Promise.all([
                this.loadStatistics(),
                this.loadRecentExpenses(),
                this.loadCategoryBreakdown(),
                this.loadMonthlyTrends()
            ]);

            // Update UI with animations
            this.updateStatistics(stats);
            this.updateRecentExpenses(recentExpenses);
            this.updateCategoryChart(categoryData);
            this.updateMonthlyChart(monthlyData);
            this.updateLastRefreshTime();

            // Cache the data
            this.cache.set('stats', stats);
            this.cache.set('recentExpenses', recentExpenses);
            this.cache.set('categoryData', categoryData);
            this.cache.set('monthlyData', monthlyData);

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            AlertUtils.error('Failed to load dashboard data. Please try again.');
        } finally {
            this.isLoading = false;
            LoadingUtils.hide();
        }
    }

    async loadStatistics() {
        const response = await apiFetch(`/api/dashboard/statistics`, { method: 'GET' });
        if (!response.ok) throw new Error('Failed to load statistics');
        return await response.json();
    }

    async loadRecentExpenses() {
        const response = await apiFetch('/api/dashboard/recent-expenses', { method: 'GET' });
        if (!response.ok) {
            let body = null;
            try { body = await response.text(); } catch (e) { /* ignore */ }
            console.error('loadRecentExpenses failed', { status: response.status, body });
            throw new Error('Failed to load recent expenses: ' + (body || response.status));
        }
        return await response.json();
    }

    async loadCategoryBreakdown() {
        const response = await apiFetch(`/api/dashboard/category-breakdown`, { method: 'GET' });
        if (!response.ok) throw new Error('Failed to load category breakdown');
        return await response.json();
    }

    async loadMonthlyTrends() {
        // Request the last 6 months by default so the dashboard shows a trend
        const response = await apiFetch(`/api/dashboard/monthly-expenses?months=6`, { method: 'GET' });
        if (!response.ok) throw new Error('Failed to load monthly trends');
        return await response.json();
    }

    updateStatistics(stats) {
        // Animate counter values
        this.animateCounter('totalExpenses', stats.totalExpenses, '$');
        this.animateCounter('totalTransactions', stats.totalTransactions, '');
        this.animateCounter('averageTransaction', stats.averageTransaction, '$');

        // Update trends with animations (using mock data since backend doesn't provide trends)
        this.updateTrend('totalExpenses', 5.2);
        this.updateTrend('totalTransactions', -2.1);
        this.updateTrend('averageTransaction', 8.7);
    }

    animateCounter(elementId, targetValue, prefix = '') {
        // Update only the inner .stat-value element so we don't remove headings/labels
        const card = document.getElementById(elementId);
        if (!card) return;
        const valueEl = card.querySelector('.stat-value');
        if (!valueEl) return;

        const startValue = 0;
        const duration = 1500;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function for smooth animation
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            const currentValue = startValue + (targetValue - startValue) * easeOutCubic;

            if (prefix === '$') {
                valueEl.textContent = Utils.formatCurrency(currentValue);
            } else {
                valueEl.textContent = Math.round(currentValue).toLocaleString();
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    updateTrend(elementId, trend) {
        const statCard = document.getElementById(elementId);
        if (!statCard) return;

        const trendElement = statCard.querySelector('.stat-trend');
        if (!trendElement) return;

        const icon = trendElement.querySelector('i');
        const span = trendElement.querySelector('span');

        if (trend > 0) {
            trendElement.classList.add('positive');
            trendElement.classList.remove('negative');
            icon.className = 'fas fa-arrow-up';
            span.textContent = `+${trend.toFixed(1)}%`;
                } else {
            trendElement.classList.add('negative');
            trendElement.classList.remove('positive');
            icon.className = 'fas fa-arrow-down';
            span.textContent = `${trend.toFixed(1)}%`;
        }

        // Animate trend appearance
        AnimationUtils.scaleIn(trendElement, 300);
    }

    updateRecentExpenses(expenses) {
        const container = document.getElementById('recentExpensesList');
        if (!container) return;

        if (expenses.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-receipt"></i>
                    </div>
                    <div class="empty-title">No Recent Expenses</div>
                    <div class="empty-message">Start adding expenses to see them here</div>
                </div>
            `;
            return;
        }

        const expensesHTML = expenses.map(expense => `
            <div class="recent-expense-item" data-expense-id="${expense.id}">
                <div class="expense-info">
                    <div class="expense-description">${expense.description}</div>
                    <div class="expense-meta">
                        <div class="expense-category">
                            <i class="fas fa-${Utils.getCategoryIcon(expense.category)}"></i>
                            ${Utils.getCategoryDisplayName(expense.category)}
                        </div>
                        <div class="expense-date">
                            <i class="fas fa-calendar"></i>
                            ${Utils.formatDate(expense.createdAt)}
                        </div>
                    </div>
                </div>
                <div class="expense-amount">${Utils.formatCurrency(expense.amount)}</div>
            </div>
        `).join('');

        container.innerHTML = expensesHTML;

        // Animate expense items
        const expenseItems = container.querySelectorAll('.recent-expense-item');
        AnimationUtils.staggerAnimation(expenseItems, (item) => {
            item.style.opacity = '0';
            item.style.transform = 'translateX(-20px)';
            item.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateX(0)';
            }, 50);
        }, 100);
    }

    updateCategoryChart(categoryData) {
        const container = document.getElementById('categoryChart');
        if (!container) return;

        if (categoryData.length === 0) {
            container.innerHTML = `
                <div class="chart-placeholder">
                    <div class="chart-placeholder-icon">
                        <i class="fas fa-chart-pie"></i>
                    </div>
                    <div class="chart-placeholder-text">
                        <h4>No Category Data</h4>
                        <p>Add some expenses to see category breakdown</p>
                    </div>
                </div>
            `;
            return;
        }

        // Create simple category breakdown visualization
        const totalAmount = categoryData.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        
        const chartHTML = `
            <div class="category-cards">
                ${categoryData.map(item => {
                     return `
                        <div class="category-card card">
                            <div class="card-body">
                                <div class="category-center">
                                    <div class="category-name">${Utils.getCategoryDisplayName(item.category)}</div>
                                    <div class="category-amount">${Utils.formatCurrency(item.amount)}</div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        container.innerHTML = chartHTML;

        // Simple entrance animation for the new cards
        const cards = container.querySelectorAll('.category-card');
        AnimationUtils.staggerAnimation(cards, (card) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(10px)';
            card.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 50);
        }, 120);
    }

    updateMonthlyChart(monthlyData) {
        const container = document.getElementById('monthlyChart');
        if (!container) return;
        // Backend may return either a single numeric amount (legacy) or an array of {label, amount}
        if (!monthlyData) {
            container.innerHTML = `
                <div class="chart-placeholder">
                    <div class="chart-placeholder-icon">
                        <i class="fas fa-chart-bar"></i>
                    </div>
                    <div class="chart-placeholder-text">
                        <h4>No Monthly Data</h4>
                        <p>Add some expenses to see monthly trends</p>
                    </div>
                </div>
            `;
            return;
        }

        // If backend returned an array of months, render each as a small card (trend)
        if (Array.isArray(monthlyData)) {
            const cardsHTML = monthlyData.map(item => `
                <div class="monthly-card card">
                    <div class="card-body">
                        <div class="monthly-card-content">
                            <div class="monthly-card-month">${item.label}</div>
                            <div class="monthly-card-amount">${Utils.formatCurrency(item.amount)}</div>
                        </div>
                    </div>
                </div>
            `).join('');

            container.innerHTML = `<div class="monthly-cards">${cardsHTML}</div>`;
            // Simple entrance animation
            const cards = container.querySelectorAll('.monthly-card');
            AnimationUtils.staggerAnimation(cards, (card) => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(8px)';
                card.style.transition = 'all 0.45s cubic-bezier(0.4, 0, 0.2, 1)';
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 40);
            }, 80);
            return;
        }

        // Legacy single-value response (number or string)
        const currentMonthAmount = parseFloat(monthlyData) || 0;

        if (currentMonthAmount === 0) {
            container.innerHTML = `
                <div class="chart-placeholder">
                    <div class="chart-placeholder-icon">
                        <i class="fas fa-chart-bar"></i>
                    </div>
                    <div class="chart-placeholder-text">
                        <h4>No Monthly Data</h4>
                        <p>Add some expenses to see monthly trends</p>
                    </div>
                </div>
            `;
            return;
        }

        // Format current month label
        const currentMonth = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

        // Render as a single card so it matches other dashboard items
        const chartHTML = `
            <div class="monthly-cards">
                <div class="monthly-card card">
                    <div class="card-body">
                        <div class="monthly-card-content">
                            <div class="monthly-card-month">${currentMonth}</div>
                            <div class="monthly-card-amount">${Utils.formatCurrency(currentMonthAmount)}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = chartHTML;
    }

    updateLastRefreshTime() {
        const lastRefreshElement = document.getElementById('lastRefreshTime');
        if (lastRefreshElement) {
            lastRefreshElement.textContent = new Date().toLocaleTimeString();
        }
    }

    async refreshDashboard() {
        const refreshBtn = document.getElementById('refreshDashboard');
        if (refreshBtn) {
            ButtonUtils.setLoading(refreshBtn, true);
        }

        try {
            await this.loadDashboardData();
            AlertUtils.success('Dashboard refreshed successfully!');
        } catch (error) {
            AlertUtils.error('Failed to refresh dashboard');
        } finally {
            if (refreshBtn) {
                ButtonUtils.setLoading(refreshBtn, false);
            }
        }
    }

    async exportData() {
        AlertUtils.info('Export functionality will be available soon!');
    }

    handleQuickAction(event) {
        const action = event.currentTarget.dataset.action;
        
        // Add ripple effect
        ButtonUtils.createRipple(event, event.currentTarget);

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
        }
    }

    handleExpenseClick(expenseItem) {
        const expenseId = expenseItem.dataset.expenseId;
        if (expenseId) {
            // Add click animation
            AnimationUtils.scaleIn(expenseItem, 200);
            
            // Navigate to expense details or edit page
            window.location.href = `/expenses?id=${expenseId}`;
        }
    }

    startAutoRefresh() {
        // Refresh dashboard every 5 minutes
        this.refreshInterval = setInterval(() => {
            this.loadDashboardData();
        }, 5 * 60 * 1000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    destroy() {
        this.stopAutoRefresh();
        this.cache.clear();
    }
}

// Initialize DashboardManager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.dashboard-grid')) {
                window.dashboardManager = new DashboardManager();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (window.dashboardManager) {
        window.dashboardManager.destroy();
    }
});