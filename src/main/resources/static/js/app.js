/**
 * Royal Blue Premium UI - Enhanced App Utilities
 * Modern JavaScript utilities with animations and micro-interactions
 */

// Animation utilities
const AnimationUtils = {
    // Smooth scroll to element
    scrollToElement(element, offset = 0) {
        const targetPosition = element.offsetTop - offset;
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    },

    // Fade in animation
    fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        let start = null;
        function animate(timestamp) {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            const opacity = Math.min(progress / duration, 1);
            
            element.style.opacity = opacity;
            
            if (progress < duration) {
                requestAnimationFrame(animate);
            }
        }
        
        requestAnimationFrame(animate);
    },

    // Fade out animation
    fadeOut(element, duration = 300) {
        let start = null;
        function animate(timestamp) {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            const opacity = Math.max(1 - (progress / duration), 0);
            
            element.style.opacity = opacity;
            
            if (progress < duration) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
            }
        }
        
        requestAnimationFrame(animate);
    },

    // Slide in from top
    slideInFromTop(element, duration = 400) {
        element.style.transform = 'translateY(-100%)';
        element.style.opacity = '0';
        element.style.display = 'block';
        
        let start = null;
        function animate(timestamp) {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            const progressRatio = Math.min(progress / duration, 1);
            
            const translateY = -100 + (100 * progressRatio);
            const opacity = progressRatio;
            
            element.style.transform = `translateY(${translateY}%)`;
            element.style.opacity = opacity;
            
            if (progress < duration) {
                requestAnimationFrame(animate);
            }
        }
        
        requestAnimationFrame(animate);
    },

    // Scale animation
    scaleIn(element, duration = 300) {
        element.style.transform = 'scale(0)';
        element.style.opacity = '0';
        element.style.display = 'block';
        
        let start = null;
        function animate(timestamp) {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            const progressRatio = Math.min(progress / duration, 1);
            
            const scale = progressRatio;
            const opacity = progressRatio;
            
            element.style.transform = `scale(${scale})`;
            element.style.opacity = opacity;
            
            if (progress < duration) {
                requestAnimationFrame(animate);
            }
        }
        
        requestAnimationFrame(animate);
    },

    // Stagger animation for multiple elements
    staggerAnimation(elements, animationFn, delay = 100) {
        elements.forEach((element, index) => {
            setTimeout(() => {
                animationFn(element);
            }, index * delay);
        });
    },

    // Parallax effect
    parallax(element, speed = 0.5) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -speed;
            element.style.transform = `translateY(${rate}px)`;
        });
    }
};

// Loading utilities
const LoadingUtils = {
    show() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('active');
            AnimationUtils.fadeIn(overlay);
        }
    },

    hide() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            AnimationUtils.fadeOut(overlay, 200);
            setTimeout(() => {
                overlay.classList.remove('active');
            }, 200);
        }
    },

    setText(text) {
        const loadingText = document.querySelector('.loading-text');
        if (loadingText) {
            loadingText.textContent = text;
        }
    }
};

// Alert utilities with animations
const AlertUtils = {
    show(message, type = 'info', duration = 5000) {
        const container = document.getElementById('alertContainer');
        if (!container) return;

        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        
        const icon = this.getIcon(type);
        alert.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        `;

        container.appendChild(alert);

        // Animate in
        AnimationUtils.slideInFromTop(alert, 300);
        
        // Auto remove
        setTimeout(() => {
            this.remove(alert);
        }, duration);
    },

    remove(alert) {
        AnimationUtils.fadeOut(alert, 200);
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 200);
    },

    getIcon(type) {
        const icons = {
            success: 'check-circle',
            danger: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    },

    success(message) {
        this.show(message, 'success');
    },

    error(message) {
        this.show(message, 'danger');
    },

    warning(message) {
        this.show(message, 'warning');
    },

    info(message) {
        this.show(message, 'info');
    }
};

// Form utilities with enhanced interactions
const FormUtils = {
    // Add floating label effect
    initFloatingLabels() {
        const formGroups = document.querySelectorAll('.form-group');
        formGroups.forEach(group => {
            const input = group.querySelector('.form-control, .form-select');
            const label = group.querySelector('.form-label');
            
            if (input && label) {
                // Check if input has value on load
                if (input.value) {
                    label.classList.add('floating');
                }
                
                input.addEventListener('focus', () => {
                    label.classList.add('floating');
                    this.addFocusEffect(group);
                });
                
                input.addEventListener('blur', () => {
                    if (!input.value) {
                        label.classList.remove('floating');
                    }
                    this.removeFocusEffect(group);
                });
                
                input.addEventListener('input', () => {
                    if (input.value) {
                        label.classList.add('floating');
                    }
                });
            }
        });
    },

    addFocusEffect(group) {
        group.style.transform = 'translateY(-2px)';
        group.style.transition = 'transform 0.3s ease';
    },

    removeFocusEffect(group) {
        group.style.transform = 'translateY(0)';
    },

    // Validate form with animations
    validateForm(form) {
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            const group = input.closest('.form-group');
            this.clearValidation(group);
            
            if (!input.value.trim()) {
                this.showValidationError(group, 'This field is required');
                isValid = false;
            } else {
                this.showValidationSuccess(group);
            }
        });
        
        return isValid;
    },

    showValidationError(group, message) {
        this.clearValidation(group);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'form-error';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        
        group.appendChild(errorDiv);
        AnimationUtils.scaleIn(errorDiv, 200);
        
        // Add shake animation
        group.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            group.style.animation = '';
        }, 500);
    },

    showValidationSuccess(group) {
        this.clearValidation(group);
        
        const successDiv = document.createElement('div');
        successDiv.className = 'form-success';
        successDiv.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>Looks good!</span>
        `;
        
        group.appendChild(successDiv);
        AnimationUtils.scaleIn(successDiv, 200);
        
        setTimeout(() => {
            this.clearValidation(group);
        }, 2000);
    },

    clearValidation(group) {
        const existingError = group.querySelector('.form-error');
        const existingSuccess = group.querySelector('.form-success');
        
        if (existingError) {
            AnimationUtils.fadeOut(existingError, 150);
            setTimeout(() => existingError.remove(), 150);
        }
        
        if (existingSuccess) {
            AnimationUtils.fadeOut(existingSuccess, 150);
            setTimeout(() => existingSuccess.remove(), 150);
        }
    }
};

// Button utilities with enhanced interactions
const ButtonUtils = {
    // Add ripple effect to buttons
    initRippleEffect() {
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.createRipple(e, button);
            });
        });
    },

    createRipple(event, button) {
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');
        
        button.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    },

    // Add loading state to button
    setLoading(button, loading = true) {
        const btnText = button.querySelector('.btn-text');
        const btnLoading = button.querySelector('.btn-loading');

        if (loading) {
            button.disabled = true;
            if (btnText) btnText.style.display = 'none';
            if (btnLoading) btnLoading.style.display = 'flex';
        } else {
            button.disabled = false;
            if (btnText) btnText.style.display = 'flex';
            if (btnLoading) btnLoading.style.display = 'none';
        }
    }
};

// Card utilities with hover effects
const CardUtils = {
    initHoverEffects() {
        const cards = document.querySelectorAll('.card, .stat-card, .expense-card');
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                this.addHoverEffect(card);
            });
            
            card.addEventListener('mouseleave', () => {
                this.removeHoverEffect(card);
            });
        });
    },

    addHoverEffect(card) {
        card.style.transform = 'translateY(-8px) scale(1.02)';
        card.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    },

    removeHoverEffect(card) {
        card.style.transform = 'translateY(0) scale(1)';
    },

    // Animate cards on scroll
    initScrollAnimations() {
        const cards = document.querySelectorAll('.card, .stat-card, .expense-card');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        cards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            observer.observe(card);
        });
    }
};

// Navigation utilities
const NavigationUtils = {
    initSmoothScrolling() {
        const links = document.querySelectorAll('a[href^="#"]');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    AnimationUtils.scrollToElement(targetElement, 80);
                }
            });
        });
    },

    // Highlight active navigation link
    highlightActiveLink() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPath) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
};

    // Utility functions
const Utils = {
    // Debounce function
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
    },

    // Throttle function
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
    },

    // Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    },

    // Format date
    formatDate(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        
        return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(new Date(date));
    },

    // Get category display name
    getCategoryDisplayName(category) {
        const categories = {
            'FOOD': 'Food',
            'TRANSPORTATION': 'Transportation',
            'UTILITIES': 'Utilities',
            'ENTERTAINMENT': 'Entertainment',
            'HEALTHCARE': 'Healthcare',
            'OTHER': 'Other'
        };
        return categories[category] || category;
    },

    // Get category icon
    getCategoryIcon(category) {
        const icons = {
            'FOOD': 'utensils',
            'TRANSPORTATION': 'car',
            'UTILITIES': 'file-invoice',
            'ENTERTAINMENT': 'film',
            'HEALTHCARE': 'heartbeat',
            'OTHER': 'tag'
        };
        return icons[category] || 'tag';
    }
};

// Initialize all utilities when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize form utilities
    FormUtils.initFloatingLabels();
    
    // Initialize button utilities
    ButtonUtils.initRippleEffect();
    
    // Initialize card utilities
    CardUtils.initHoverEffects();
    CardUtils.initScrollAnimations();
    
    // Initialize navigation utilities
    NavigationUtils.initSmoothScrolling();
    NavigationUtils.highlightActiveLink();
    
    // Add shake animation CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        .ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transform: scale(0);
            animation: ripple-animation 0.6s linear;
            pointer-events: none;
        }
        
        @keyframes ripple-animation {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        .form-label.floating {
            transform: translateY(-20px) scale(0.85);
            color: var(--royal-blue-400);
        }
    `;
    document.head.appendChild(style);
});

// Export utilities for use in other modules
window.AnimationUtils = AnimationUtils;
window.LoadingUtils = LoadingUtils;
window.AlertUtils = AlertUtils;
window.FormUtils = FormUtils;
window.ButtonUtils = ButtonUtils;
window.CardUtils = CardUtils;
window.NavigationUtils = NavigationUtils;
window.Utils = Utils;

// Small helper to read cookie by name
function _getCookie(name) {
    try {
        const pairs = document.cookie.split(';').map(p => p.trim());
        for (const p of pairs) {
            if (!p) continue;
            const [k, ...rest] = p.split('=');
            if (k === name) return rest.join('=');
        }
    } catch (e) { /* ignore */ }
    return null;
}

// apiFetch: centralizes authenticated fetch options
// - sets credentials:'include' for same-origin requests
// - merges headers
// - sends Authorization: Bearer <token> fallback from localStorage
// - sends CSRF header from common cookie names for non-GET requests
window.apiFetch = async function(input, options = {}) {
    const opts = Object.assign({}, options);

    // default headers object
    opts.headers = Object.assign({}, opts.headers || {});

    // token fallback keys
    let token = null;
    try {
        token = localStorage.getItem('authToken') || localStorage.getItem('token') || localStorage.getItem('accessToken') || null;
    } catch (e) { token = null; }

    if (token && !opts.headers['Authorization'] && !opts.headers['authorization']) {
        opts.headers['Authorization'] = 'Bearer ' + token;
    }

    // ensure credentials for same-origin requests by default
    if (opts.credentials === undefined) opts.credentials = 'include';

    // CSRF: if this is a mutating request, read common CSRF cookie names and set header
    const method = (opts.method || 'GET').toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') {
        const xsrf = _getCookie('XSRF-TOKEN') || _getCookie('X-XSRF-TOKEN') || _getCookie('XSRF') || _getCookie('csrfToken');
        if (xsrf && !opts.headers['X-XSRF-TOKEN'] && !opts.headers['X-CSRF-TOKEN']) {
            opts.headers['X-XSRF-TOKEN'] = xsrf;
        }
    }

    // Delegate to the (possibly wrapped) fetch implementation
    const resp = await fetch(input, opts);
    return resp;
};

// Ensure fetch sends cookies by default for same-origin requests.
// This wrapper only sets credentials:'include' when the caller didn't specify credentials.
// It preserves the original fetch behavior otherwise.
(function() {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async function(input, init = {}) {
        try {
            // Determine URL and origin
            let url;
            if (typeof input === 'string') {
                url = input;
            } else if (input instanceof Request) {
                url = input.url;
            } else {
                url = String(input);
            }

            // Only set credentials for same-origin or relative URLs
            const isRelative = url.startsWith('/') || url.startsWith('./') || url.startsWith('../');
            let setCredentials = false;
            if (isRelative) setCredentials = true;
            else {
                try {
                    const parsed = new URL(url, window.location.href);
                    if (parsed.origin === window.location.origin) setCredentials = true;
                } catch (e) {
                    // if URL parsing fails, don't modify credentials
                }
            }

            if (setCredentials) {
                // If init is a Request, clone and modify; otherwise set default
                if (init && typeof init === 'object') {
                    if (init.credentials === undefined) init.credentials = 'include';
                }
            }

            return await originalFetch(input, init);
        } catch (err) {
            // fallback to original fetch in case of unexpected errors
            return await originalFetch(input, init);
        }
    };
})();