// Core application utilities and shared functionality
class ExpenseTracker {
    constructor() {
        this.baseURL = '/api';
        this.init();
    }

    init() {
        this.setupGlobalEventListeners();
        this.setupNavigationToggle();
        this.setupAlertSystem();
        this.checkAuthStatus();
    }

    // Authentication is handled server-side via httpOnly cookies
    // No client-side token validation needed
    isAuthenticated() {
        // Server-side authentication via cookies - always return true
        // Spring Security will handle redirects if not authenticated
        return true;
    }

    getAuthHeaders() {
        return {
            'Content-Type': 'application/json'
            // No Authorization header needed - using httpOnly cookies
        };
    }

    // No client-side token management needed with httpOnly cookies
    clearAuth() {
        // Server-side logout will clear httpOnly cookies
        // No client-side storage to clear
        console.log('Authentication cleared server-side');
    }

    checkAuthStatus() {
        // Server-side authentication - no client-side checks needed
        // Spring Security handles authentication and redirects
        console.log('Using server-side authentication');
    }

    // HTTP request helpers
    async makeRequest(url, options = {}) {
        const config = {
            method: 'GET',
            headers: this.getAuthHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            // Handle authentication errors
            if (response.status === 401) {
                console.log('Authentication failed - redirecting to login');
                // Clear any client-side data
                this.clearAuth();
                // Redirect to login page
                window.location.href = '/login';
                return null;
            }

            // Handle authorization errors
            if (response.status === 403) {
                this.showAlert('You do not have permission to perform this action', 'error');
                throw new Error('Forbidden: Insufficient permissions');
            }

            // Handle not found errors
            if (response.status === 404) {
                this.showAlert('The requested resource was not found', 'error');
                throw new Error('Resource not found');
            }

            // Handle server errors
            if (response.status >= 500) {
                this.showAlert('Server error occurred. Please try again later.', 'error');
                throw new Error(`Server error: ${response.status}`);
            }

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error occurred');
                const errorMessage = this.extractErrorMessage(errorText) || `HTTP ${response.status}: ${response.statusText}`;
                throw new Error(errorMessage);
            }

            // Parse response based on content type
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            
            return await response.text();
        } catch (error) {
            // Only show alert if we haven't already redirected or shown one
            if (!error.message.includes('Forbidden') && !error.message.includes('Server error')) {
                console.error('Request failed:', error);
                if (error.name !== 'TypeError') { // Avoid showing alerts for network errors during redirect
                    this.showAlert(error.message || 'Request failed', 'error');
                }
            }
            throw error;
        }
    }

    async get(endpoint) {
        return this.makeRequest(`${this.baseURL}${endpoint}`);
    }

    async post(endpoint, data) {
        return this.makeRequest(`${this.baseURL}${endpoint}`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data) {
        return this.makeRequest(`${this.baseURL}${endpoint}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.makeRequest(`${this.baseURL}${endpoint}`, {
            method: 'DELETE'
        });
    }

    // Helper function to extract error messages from response text
    extractErrorMessage(errorText) {
        try {
            // Try to parse as JSON first
            const errorObj = JSON.parse(errorText);
            return errorObj.message || errorObj.error || errorText;
        } catch (e) {
            // If not JSON, return the text directly
            return errorText;
        }
    }

    // UI helpers
    showLoading(show = true) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

    showAlert(message, type = 'info', duration = 5000) {
        const container = document.getElementById('alertContainer');
        if (!container) return;

        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        
        const icon = this.getAlertIcon(type);
        alert.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
            <button type="button" class="alert-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(alert);

        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                if (alert.parentElement) {
                    alert.remove();
                }
            }, duration);
        }

        // Animate in
        requestAnimationFrame(() => {
            alert.style.opacity = '1';
            alert.style.transform = 'translateX(0)';
        });
    }

    getAlertIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // Form helpers
    setButtonLoading(button, loading = true) {
        const btnText = button.querySelector('.btn-text');
        const btnLoading = button.querySelector('.btn-loading');
        const btnSpinner = button.querySelector('.btn-spinner');

        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
            if (btnText) btnText.style.display = 'none';
            if (btnLoading) btnLoading.style.display = 'inline';
            if (btnSpinner) btnSpinner.style.display = 'inline';
        } else {
            button.classList.remove('loading');
            button.disabled = false;
            if (btnText) btnText.style.display = 'inline';
            if (btnLoading) btnLoading.style.display = 'none';
            if (btnSpinner) btnSpinner.style.display = 'none';
        }
    }

    validateForm(form) {
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;
        const errors = [];

        requiredFields.forEach(field => {
            const value = field.value.trim();
            if (!value) {
                isValid = false;
                errors.push(`${field.labels?.[0]?.textContent || field.name} is required`);
                field.classList.add('error');
            } else {
                field.classList.remove('error');
            }

            // Email validation
            if (field.type === 'email' && value && !this.isValidEmail(value)) {
                isValid = false;
                errors.push('Please enter a valid email address');
                field.classList.add('error');
            }

            // Number validation
            if (field.type === 'number' && value && (isNaN(value) || parseFloat(value) <= 0)) {
                isValid = false;
                errors.push(`${field.labels?.[0]?.textContent || field.name} must be a positive number`);
                field.classList.add('error');
            }
        });

        if (!isValid) {
            this.showAlert(errors.join('<br>'), 'error');
        }

        return isValid;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Event listeners
    setupGlobalEventListeners() {
        // Handle form errors
        document.addEventListener('invalid', (e) => {
            e.target.classList.add('error');
        }, true);

        // Remove error class on input
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('error')) {
                e.target.classList.remove('error');
            }
        });

        // Handle ESC key for modals and alerts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Close alerts
                const alerts = document.querySelectorAll('.alert');
                alerts.forEach(alert => alert.remove());
            }
        });
    }

    setupNavigationToggle() {
        const navToggle = document.getElementById('navToggle');
        const navMenu = document.getElementById('navMenu');
        
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                navToggle.classList.toggle('active');
            });

            // Close nav on link click (mobile)
            navMenu.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    navMenu.classList.remove('active');
                    navToggle.classList.remove('active');
                });
            });

            // Close nav on outside click
            document.addEventListener('click', (e) => {
                if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                    navMenu.classList.remove('active');
                    navToggle.classList.remove('active');
                }
            });
        }
    }

    setupAlertSystem() {
        // Clear old alerts on page load
        const container = document.getElementById('alertContainer');
        if (container) {
            container.innerHTML = '';
        }
    }

    // Utility functions
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(new Date(date));
    }

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

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// Global logout function
async function logout() {
    if (confirm('Are you sure you want to logout?')) {
        try {
            // Call backend logout to blacklist JWT token
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
                // Cookie will be sent automatically
            });
        } catch (error) {
            console.error('Logout request failed:', error);
            // Continue with logout even if request fails
        } finally {
            // Clear any client-side data and redirect
            app.clearAuth();
            window.location.href = '/login';
        }
    }
}

// Global export function
async function exportExpenses() {
    try {
        if (typeof app !== 'undefined') {
            app.showAlert('Exporting expenses...', 'info');
        }
        
        const expenses = await app.get('/api/expense/get');
        
        if (!expenses || expenses.length === 0) {
            if (typeof app !== 'undefined') {
                app.showAlert('No expenses to export', 'warning');
            } else {
                alert('No expenses to export');
            }
            return;
        }

        // Convert to CSV format
        const csv = convertExpensesToCSV(expenses);
        
        // Create and download file
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `expenses-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        if (typeof app !== 'undefined') {
            app.showAlert('Expenses exported successfully!', 'success');
        }
    } catch (error) {
        console.error('Export failed:', error);
        if (typeof app !== 'undefined') {
            app.showAlert('Failed to export expenses', 'error');
        } else {
            alert('Failed to export expenses');
        }
    }
}

// Helper function to convert expenses to CSV
function convertExpensesToCSV(expenses) {
    const headers = ['Date', 'Description', 'Amount', 'Category'];
    const csvContent = [headers.join(',')];
    
    expenses.forEach(expense => {
        const row = [
            new Date(expense.createdAt).toLocaleDateString(),
            `"${expense.description.replace(/"/g, '""')}"`, // Escape quotes
            expense.amount,
            expense.category
        ];
        csvContent.push(row.join(','));
    });
    
    return csvContent.join('\n');
}

// Initialize app
const app = new ExpenseTracker();

// Export for other modules
window.ExpenseTracker = ExpenseTracker;
window.app = app;