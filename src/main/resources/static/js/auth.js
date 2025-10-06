// Authentication functionality
class AuthManager {
    constructor() {
        this.baseURL = '/api/auth';
        this.loginForm = document.getElementById('loginForm');
        this.registerForm = document.getElementById('registerForm');
        this.init();
    }

    init() {
        if (this.loginForm) {
            this.setupLoginForm();
        }
        if (this.registerForm) {
            this.setupRegisterForm();
        }
    }

    setupLoginForm() {
        this.loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Enable form submission on Enter key
        this.loginForm.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleLogin();
            }
        });
    }

    setupRegisterForm() {
        this.registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // Password strength validation
        const passwordField = this.registerForm.querySelector('#password');
        const confirmPasswordField = this.registerForm.querySelector('#confirmPassword');
        
        if (passwordField && confirmPasswordField) {
            confirmPasswordField.addEventListener('input', () => {
                this.validatePasswordMatch();
            });
        }
    }

    async handleLogin() {
        const form = this.loginForm;
        const submitBtn = form.querySelector('#submitBtn');
        
        // Validate form with fallback
        if (typeof app !== 'undefined' && !app.validateForm(form)) {
            return;
        } else if (typeof app === 'undefined') {
            // Basic validation fallback
            const requiredFields = form.querySelectorAll('[required]');
            for (let field of requiredFields) {
                if (!field.value.trim()) {
                    alert(`${field.name} is required`);
                    field.focus();
                    return;
                }
            }
        }

        const formData = new FormData(form);
        const loginData = {
            username: formData.get('username'),
            password: formData.get('password')
        };

        try {
            if (typeof app !== 'undefined') {
                app.setButtonLoading(submitBtn, true);
            } else if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Signing In...';
            }
            
            const response = await fetch(`${this.baseURL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Login failed');
                throw new Error(errorText);
            }

            const message = await response.text();
            console.log('Login response:', message);
            
            if (typeof app !== 'undefined') {
                app.showAlert('Login successful! Redirecting...', 'success', 2000);
            }
            
            // Redirect to dashboard - server will authenticate via cookie  
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1500);

        } catch (error) {
            console.error('Login error:', error);
            const errorMessage = error.message || 'Login failed. Please try again.';
            if (typeof app !== 'undefined') {
                app.showAlert(errorMessage, 'error');
            } else {
                alert(errorMessage);
            }
        } finally {
            if (typeof app !== 'undefined') {
                app.setButtonLoading(submitBtn, false);
            } else if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign In';
            }
        }
    }

    async handleRegister() {
        const form = this.registerForm;
        const submitBtn = form.querySelector('#submitBtn');
        
        // Validate form with fallback
        if (typeof app !== 'undefined' && !app.validateForm(form)) {
            return;
        } else if (typeof app === 'undefined') {
            // Basic validation fallback
            const requiredFields = form.querySelectorAll('[required]');
            for (let field of requiredFields) {
                if (!field.value.trim()) {
                    alert(`${field.name} is required`);
                    field.focus();
                    return;
                }
            }
        }

        // Validate password match
        if (!this.validatePasswordMatch()) {
            return;
        }



        const formData = new FormData(form);
        const registerData = {
            username: formData.get('username'),
            password: formData.get('password'),
            email: formData.get('email')
        };

        try {
            if (typeof app !== 'undefined') {
                app.setButtonLoading(submitBtn, true);
            } else if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Creating Account...';
            }
            
            const response = await fetch(`${this.baseURL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(registerData)
            });

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Registration failed');
                throw new Error(errorText);
            }

            const message = await response.text();
            console.log('Registration response:', message);
            
            if (typeof app !== 'undefined') {
                app.showAlert('Registration successful! Redirecting...', 'success', 2000);
            }
            
            // Redirect to dashboard - server will authenticate via cookie
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1500);

        } catch (error) {
            console.error('Registration error:', error);
            const errorMessage = error.message || 'Registration failed. Please try again.';
            if (typeof app !== 'undefined') {
                app.showAlert(errorMessage, 'error');
            } else {
                alert(errorMessage);
            }
        } finally {
            if (typeof app !== 'undefined') {
                app.setButtonLoading(submitBtn, false);
            } else if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create Account';
            }
        }
    }

    validatePasswordMatch() {
        const passwordField = this.registerForm.querySelector('#password');
        const confirmPasswordField = this.registerForm.querySelector('#confirmPassword');
        
        if (!passwordField || !confirmPasswordField) {
            return true;
        }

        const password = passwordField.value;
        const confirmPassword = confirmPasswordField.value;

        if (confirmPassword && password !== confirmPassword) {
            confirmPasswordField.classList.add('error');
            if (typeof app !== 'undefined') {
                app.showAlert('Passwords do not match', 'error');
            } else {
                alert('Passwords do not match');
            }
            return false;
        }

        confirmPasswordField.classList.remove('error');
        return true;
    }

    checkPasswordStrength(password) {
        let score = 0;
        let suggestions = [];

        // Length check
        if (password.length >= 8) {
            score++;
        } else {
            suggestions.push('at least 8 characters');
        }

        // Lowercase check
        if (/[a-z]/.test(password)) {
            score++;
        } else {
            suggestions.push('lowercase letters');
        }

        // Uppercase check
        if (/[A-Z]/.test(password)) {
            score++;
        } else {
            suggestions.push('uppercase letters');
        }

        // Number check
        if (/[0-9]/.test(password)) {
            score++;
        } else {
            suggestions.push('numbers');
        }

        // Special character check
        if (/[^A-Za-z0-9]/.test(password)) {
            score++;
        } else {
            suggestions.push('special characters');
        }

        let strength = 'weak';
        let message = 'Password is weak';

        if (score >= 4) {
            strength = 'strong';
            message = 'Password is strong!';
        } else if (score >= 3) {
            strength = 'medium';
            message = 'Password is medium strength';
        } else {
            message = `Password is weak. Add ${suggestions.slice(0, 2).join(' and ')}.`;
        }

        return { strength, message, score };
    }

    // Forgot password functionality (for future implementation)
    async forgotPassword(email) {
        try {
            const response = await fetch(`${this.baseURL}/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            if (!response.ok) {
                throw new Error('Failed to send reset email');
            }

            if (typeof app !== 'undefined') {
                app.showAlert('Password reset instructions sent to your email', 'success');
            } else {
                alert('Password reset instructions sent to your email');
            }
            return true;
        } catch (error) {
            const errorMessage = error.message || 'Failed to send reset email';
            if (typeof app !== 'undefined') {
                app.showAlert(errorMessage, 'error');
            } else {
                alert(errorMessage);
            }
            return false;
        }
    }

    // Logout functionality
    async logout() {
        try {
            // Call logout endpoint to blacklist JWT token
            await fetch(`${this.baseURL}/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
                // httpOnly cookie will be sent automatically
            });
            console.log('Logout successful - token blacklisted');
        } catch (error) {
            console.error('Logout request failed:', error);
            // Continue with logout even if request fails
        } finally {
            // Clear any client-side data and redirect
            if (typeof app !== 'undefined') {
                app.clearAuth();
            }
            window.location.href = '/login';
        }
    }
}

// Global auth functions for form handlers
function handleLogin(event) {
    event.preventDefault();
    if (window.authManager) {
        window.authManager.handleLogin();
    } else {
        console.error('AuthManager not initialized');
        alert('Authentication system not ready. Please refresh the page.');
    }
}

function handleRegister(event) {
    event.preventDefault();
    if (window.authManager) {
        window.authManager.handleRegister();
    } else {
        console.error('AuthManager not initialized');
        alert('Authentication system not ready. Please refresh the page.');
    }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.authManager = new AuthManager();
});

// Export for other modules
window.AuthManager = AuthManager;