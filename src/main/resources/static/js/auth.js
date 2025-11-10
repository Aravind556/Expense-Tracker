/**
 * Royal Blue Premium UI - Enhanced Authentication Manager
 * Modern authentication with animations and micro-interactions
 */

class AuthManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeAnimations();
        this.setupFormValidation();
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Password toggle buttons
        const passwordToggles = document.querySelectorAll('.password-toggle');
        passwordToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => this.togglePassword(e));
        });

        // Quick amount buttons
        const quickAmountBtns = document.querySelectorAll('.quick-amount-btn');
        quickAmountBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleQuickAmount(e));
        });

        // Form input animations
        const inputs = document.querySelectorAll('.form-control');
        inputs.forEach(input => {
            input.addEventListener('focus', (e) => this.addInputFocusEffect(e.target));
            input.addEventListener('blur', (e) => this.removeInputFocusEffect(e.target));
            input.addEventListener('input', (e) => this.handleInputChange(e.target));
        });
    }

    initializeAnimations() {
        // Add entrance animations to form elements
        const formGroups = document.querySelectorAll('.form-group');
        AnimationUtils.staggerAnimation(formGroups, (group) => {
            group.style.opacity = '0';
            group.style.transform = 'translateY(20px)';
            group.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            
            setTimeout(() => {
                group.style.opacity = '1';
                group.style.transform = 'translateY(0)';
            }, 100);
        }, 100);

        // Animate auth icon
        const authIcon = document.querySelector('.auth-icon');
        if (authIcon) {
            setTimeout(() => {
                AnimationUtils.scaleIn(authIcon, 500);
            }, 200);
        }

        // Animate quick amount buttons
        const quickAmountButtons = document.querySelectorAll('.quick-amount-btn');
        AnimationUtils.staggerAnimation(quickAmountButtons, (btn) => {
            btn.style.opacity = '0';
            btn.style.transform = 'scale(0)';
            btn.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            
            setTimeout(() => {
                btn.style.opacity = '1';
                btn.style.transform = 'scale(1)';
            }, 50);
        }, 50);
    }

    setupFormValidation() {
        // Real-time validation for register form
        const passwordField = document.getElementById('password');
        const confirmPasswordField = document.getElementById('confirmPassword');
        
        if (passwordField) {
            passwordField.addEventListener('input', (e) => this.validatePassword(e.target));
        }
        
        if (confirmPasswordField) {
            confirmPasswordField.addEventListener('input', (e) => this.validatePasswordMatch(e.target));
        }

        // Username validation
        const usernameField = document.getElementById('username');
        if (usernameField) {
            usernameField.addEventListener('input', (e) => this.validateUsername(e.target));
        }

        // Email validation
        const emailField = document.getElementById('email');
        if (emailField) {
            emailField.addEventListener('input', (e) => this.validateEmail(e.target));
        }
    }

    addInputFocusEffect(input) {
        const group = input.closest('.form-group');
        if (group) {
            group.style.transform = 'translateY(-2px)';
            group.style.transition = 'transform 0.3s ease';
            
            // Add glow effect
            input.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.2), 0 8px 24px rgba(30, 58, 138, 0.15)';
        }
    }

    removeInputFocusEffect(input) {
        const group = input.closest('.form-group');
        if (group) {
            group.style.transform = 'translateY(0)';
        }
        
        // Remove glow effect
        input.style.boxShadow = '';
    }

    handleInputChange(input) {
        // Add typing animation
        input.style.transform = 'scale(1.02)';
        setTimeout(() => {
            input.style.transform = 'scale(1)';
        }, 100);
    }

    togglePassword(event) {
        event.preventDefault();
        const button = event.currentTarget;
        const input = button.parentElement.querySelector('input');
        const icon = button.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
            
            // Add animation
            AnimationUtils.scaleIn(icon, 200);
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
            
            // Add animation
            AnimationUtils.scaleIn(icon, 200);
        }
    }

    handleQuickAmount(event) {
        event.preventDefault();
        const button = event.currentTarget;
        const amount = button.dataset.amount;
        const amountInput = document.getElementById('amount');
        
        if (amountInput) {
            amountInput.value = amount;
            
            // Add animation to input
            AnimationUtils.scaleIn(amountInput, 200);
            
            // Update active state
            document.querySelectorAll('.quick-amount-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            button.classList.add('active');
            
            // Add ripple effect
            ButtonUtils.createRipple(event, button);
        }
    }

    validatePassword(input) {
        const password = input.value;
        const strengthBar = document.getElementById('passwordStrength');
        const strengthFill = document.getElementById('strengthFill');
        const strengthText = document.getElementById('strengthText');
        
        if (!strengthBar || !strengthFill || !strengthText) return;
        
        if (password.length > 0) {
            strengthBar.classList.add('show');
            const strength = this.calculatePasswordStrength(password);
            this.updatePasswordStrength(strengthFill, strengthText, strength);
        } else {
            strengthBar.classList.remove('show');
        }
    }

    calculatePasswordStrength(password) {
        let score = 0;
        let feedback = '';
        
        // Length check
        if (password.length >= 8) score++;
        else feedback += 'At least 8 characters. ';
        
        // Lowercase check
        if (/[a-z]/.test(password)) score++;
        else feedback += 'Lowercase letters. ';
        
        // Uppercase check
        if (/[A-Z]/.test(password)) score++;
        else feedback += 'Uppercase letters. ';
        
        // Number check
        if (/[0-9]/.test(password)) score++;
        else feedback += 'Numbers. ';
        
        // Special character check
        if (/[^A-Za-z0-9]/.test(password)) score++;
        else feedback += 'Special characters. ';
        
        return { score, feedback };
    }

    updatePasswordStrength(strengthFill, strengthText, strength) {
        strengthFill.className = 'strength-fill';
        
        if (strength.score <= 2) {
            strengthFill.classList.add('weak');
            strengthText.textContent = 'Weak password';
        } else if (strength.score === 3) {
            strengthFill.classList.add('fair');
            strengthText.textContent = 'Fair password';
        } else if (strength.score === 4) {
            strengthFill.classList.add('good');
            strengthText.textContent = 'Good password';
        } else {
            strengthFill.classList.add('strong');
            strengthText.textContent = 'Strong password';
        }
    }

    validatePasswordMatch(input) {
        const password = document.getElementById('password').value;
        const confirmPassword = input.value;
        const matchDiv = document.getElementById('passwordMatch');
        
        if (!matchDiv) return;
        
        if (confirmPassword.length > 0) {
            matchDiv.classList.add('show');
            if (password === confirmPassword) {
                matchDiv.classList.remove('error');
                matchDiv.innerHTML = '<i class="fas fa-check-circle"></i><span>Passwords match</span>';
            } else {
                matchDiv.classList.add('error');
                matchDiv.innerHTML = '<i class="fas fa-times-circle"></i><span>Passwords do not match</span>';
            }
        } else {
            matchDiv.classList.remove('show');
        }
    }

    validateUsername(input) {
        const username = input.value;
        const group = input.closest('.form-group');
        
        if (username.length < 3) {
            FormUtils.showValidationError(group, 'Username must be at least 3 characters');
            return false;
        } else if (username.length > 20) {
            FormUtils.showValidationError(group, 'Username must be less than 20 characters');
            return false;
        } else {
            FormUtils.showValidationSuccess(group);
            return true;
        }
    }

    validateEmail(input) {
        const email = input.value;
        const group = input.closest('.form-group');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (email && !emailRegex.test(email)) {
            FormUtils.showValidationError(group, 'Please enter a valid email address');
            return false;
        } else if (email) {
            FormUtils.showValidationSuccess(group);
            return true;
        }
        return true;
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const form = event.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        
        // Validate form
        if (!FormUtils.validateForm(form)) {
            AlertUtils.error('Please fill in all required fields');
            return;
        }
        
        // Show loading state
        ButtonUtils.setLoading(submitBtn, true);
        LoadingUtils.show();
        LoadingUtils.setText('Signing in...');
        
        try {
            const formData = new FormData(form);
            const loginData = {
                username: formData.get('username'),
                password: formData.get('password'),
                
            };
            
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData),
                credentials: 'include'
            });
            
            if (response.ok) {
                // Try to read token from response body (some backends return token in JSON)
                let token = null;
                try {
                    const cloned = response.clone();
                    const json = await cloned.json();
                    token = json && (json.token || json.accessToken || json.authToken || json.data?.token);
                } catch (e) {
                    // not JSON or no token - ignore
                }

                // If we found a token in the response body, set a client cookie as a fallback
                if (token) {
                    try {
                        // set non-HttpOnly cookie (fallback) so subsequent requests can include it
                        const maxAge = 24 * 60 * 60; // 1 day in seconds
                        document.cookie = `authToken=${token}; max-age=${maxAge}; path=/; samesite=Lax`;
                        // also store in localStorage as a last-resort fallback
                        try { localStorage.setItem('authToken', token); } catch (e) { /* ignore */ }
                    } catch (e) {
                        console.warn('Failed to set auth cookie from response token:', e);
                    }
                }

                // Show success animation
                AlertUtils.success('Login successful! Redirecting...');

                // Add success animation to form
                AnimationUtils.scaleIn(form, 300);

                // Redirect after animation
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1500);
            } else {
                const errorMessage = await response.text();
                AlertUtils.error(errorMessage || 'Login failed. Please try again.');
                
                // Add shake animation to form
                form.style.animation = 'shake 0.5s ease-in-out';
                setTimeout(() => {
                    form.style.animation = '';
                }, 500);
            }
        } catch (error) {
            console.error('Login error:', error);
            AlertUtils.error('Network error. Please check your connection and try again.');
        } finally {
            ButtonUtils.setLoading(submitBtn, false);
            LoadingUtils.hide();
        }
    }

    async handleRegister(event) {
        event.preventDefault();
        
        const form = event.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        
        // Validate form
        if (!FormUtils.validateForm(form)) {
            AlertUtils.error('Please fill in all required fields');
            return;
        }
        
        // Check password match
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (password !== confirmPassword) {
            AlertUtils.error('Passwords do not match');
            return;
        }
        
        // Show loading state
        ButtonUtils.setLoading(submitBtn, true);
        LoadingUtils.show();
        LoadingUtils.setText('Creating account...');
        
        try {
            const formData = new FormData(form);
            const registerData = {
                username: formData.get('username'),
                email: formData.get('email'),
                password: formData.get('password')
            };
            
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(registerData),
                credentials: 'include'
            });
            
            if (response.ok) {
                const message = await response.text();
                
                // Show success animation
                AlertUtils.success('Account created successfully! Redirecting to login...');
                
                // Add success animation to form
                AnimationUtils.scaleIn(form, 300);
                
                // Redirect to login after animation
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else {
                const errorMessage = await response.text();
                AlertUtils.error(errorMessage || 'Registration failed. Please try again.');
                
                // Add shake animation to form
                form.style.animation = 'shake 0.5s ease-in-out';
                setTimeout(() => {
                    form.style.animation = '';
                }, 500);
            }
        } catch (error) {
            console.error('Registration error:', error);
            AlertUtils.error('Network error. Please check your connection and try again.');
        } finally {
            ButtonUtils.setLoading(submitBtn, false);
            LoadingUtils.hide();
        }
    }
}

// Logout function with animation
async function logout() {
    LoadingUtils.show();
    LoadingUtils.setText('Signing out...');
    
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            const message = await response.text();
            AlertUtils.success('Logged out successfully!');
            
            // Add fade out animation to the page
            document.body.style.transition = 'opacity 0.5s ease';
            document.body.style.opacity = '0';
            
            setTimeout(() => {
                window.location.href = '/login';
            }, 500);
        } else {
            AlertUtils.error('Logout failed. Please try again.');
        }
    } catch (error) {
        console.error('Logout error:', error);
        AlertUtils.error('Network error during logout.');
    } finally {
        LoadingUtils.hide();
    }
}

// Global logout function for navigation
window.logout = logout;

// Initialize AuthManager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('#loginForm') || document.querySelector('#registerForm')) {
        // expose instance globally so templates that use inline handlers can call into it
        window.authManager = new AuthManager();

        // Backwards-compatible global handlers for inline onsubmit attributes
        window.handleLogin = function(event) {
            if (window.authManager && typeof window.authManager.handleLogin === 'function') {
                return window.authManager.handleLogin(event);
            }
            // if not ready, prevent default to avoid form submission
            if (event && event.preventDefault) event.preventDefault();
            return false;
        };

        window.handleRegister = function(event) {
            if (window.authManager && typeof window.authManager.handleRegister === 'function') {
                return window.authManager.handleRegister(event);
            }
            if (event && event.preventDefault) event.preventDefault();
            return false;
        };
    }
});