// TradeConnect - Utility Functions
// Common helper functions used across the app

const Utils = {
    /**
     * Format timestamp to "time ago" text
     * @param {string|Date} timestamp - Date to format
     * @returns {string} Time ago text (e.g., "2h ago")
     */
    getTimeAgo(timestamp) {
        const now = new Date();
        const past = new Date(timestamp);
        const diffMs = now - past;
        
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        const diffWeeks = Math.floor(diffDays / 7);
        const diffMonths = Math.floor(diffDays / 30);
        const diffYears = Math.floor(diffDays / 365);
        
        if (diffSeconds < 30) return 'Just now';
        if (diffMinutes < 1) return `${diffSeconds}s ago`;
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        if (diffWeeks < 4) return `${diffWeeks}w ago`;
        if (diffMonths < 12) return `${diffMonths}mo ago`;
        return `${diffYears}y ago`;
    },
    
    /**
     * Escape HTML to prevent XSS attacks
     * @param {string} text - Text to escape
     * @returns {string} Escaped HTML
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    /**
     * Format date to readable string
     * @param {string|Date} date - Date to format
     * @param {boolean} includeTime - Whether to include time
     * @returns {string} Formatted date
     */
    formatDate(date, includeTime = false) {
        const d = new Date(date);
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        
        if (includeTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
        }
        
        return d.toLocaleDateString('en-US', options);
    },
    
    /**
     * Debounce function calls
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @returns {Function} Debounced function
     */
    debounce(func, wait = 300) {
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
    
    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} Is valid email
     */
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    /**
     * Truncate text to specified length
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} Truncated text
     */
    truncate(text, maxLength = 100) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },
    
    /**
     * Generate avatar URL if user doesn't have one
     * @param {string} name - User name
     * @param {string} avatar - User avatar URL
     * @returns {string} Avatar URL
     */
    getAvatarUrl(name, avatar) {
        return avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2563eb&color=fff`;
    },
    
    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise<boolean>} Success status
     */
    async copyToClipboard(text) {
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback for older browsers
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                return true;
            }
        } catch (error) {
            console.error('Copy to clipboard failed:', error);
            return false;
        }
    },
    
    /**
     * Format number with commas
     * @param {number} num - Number to format
     * @returns {string} Formatted number
     */
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    
    /**
     * Get query parameter from URL
     * @param {string} param - Parameter name
     * @returns {string|null} Parameter value
     */
    getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    },
    
    /**
     * Show toast notification
     * @param {string} message - Message to show
     * @param {string} type - Type (success, error, info)
     * @param {number} duration - Duration in ms
     */
    showToast(message, type = 'info', duration = 3000) {
        // Use Auth.showMessage if available
        if (typeof Auth !== 'undefined' && Auth.showMessage) {
            Auth.showMessage(message, type);
            return;
        }
        
        // Fallback toast implementation
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#2563eb'};
            color: white;
            font-weight: 600;
            z-index: 9999;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },
    
    /**
     * Validate password strength
     * @param {string} password - Password to validate
     * @returns {object} Validation result
     */
    validatePassword(password) {
        const result = {
            valid: true,
            errors: []
        };
        
        if (password.length < 6) {
            result.valid = false;
            result.errors.push('Password must be at least 6 characters');
        }
        
        if (!/[a-z]/.test(password)) {
            result.errors.push('Password should contain lowercase letters');
        }
        
        if (!/[A-Z]/.test(password)) {
            result.errors.push('Password should contain uppercase letters');
        }
        
        if (!/[0-9]/.test(password)) {
            result.errors.push('Password should contain numbers');
        }
        
        return result;
    },
    
    /**
     * Scroll to top of page smoothly
     */
    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    },
    
    /**
     * Check if element is in viewport
     * @param {HTMLElement} element - Element to check
     * @returns {boolean} Is in viewport
     */
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },
    

    /**
     * Count-up animation for a number element
     * @param {HTMLElement} el - Element with data-target attribute
     */
    countUp(el) {
        const target = parseInt(el.dataset.target, 10);
        const s = performance.now();
        const ease = t => 1 - Math.pow(1 - t, 3);
        el.removeAttribute('data-target');
        (function step(now) {
            const p = Math.min((now - s) / 1700, 1);
            const v = Math.round(ease(p) * target);
            el.textContent = v >= 1000 ? v.toLocaleString() : v;
            if (p < 1) requestAnimationFrame(step);
        })(s);
    },

    /**
     * Init scroll animation observer (intro + outro) for pages using [data-anim]
     */
    initScrollAnimations() {
        const animEls = Array.from(document.querySelectorAll('[data-anim]'));
        const seenEls = new Set();

        /* Mark elements hidden via JS — they stay visible if JS fails */
        animEls.forEach(el => el.classList.add('anim-ready'));

        const animObs = new IntersectionObserver(entries => {
            entries.forEach(e => {
                const el    = e.target;
                const ratio = e.intersectionRatio;

                if (e.isIntersecting && ratio >= 0.18) {
                    el.classList.remove('anim-out');
                    el.classList.add('anim-in');
                    seenEls.add(el);

                    if (el.classList.contains('sg-item')) {
                        el.classList.add('in');
                        setTimeout(() => {
                            el.classList.add('ring-pulse');
                            setTimeout(() => el.classList.remove('ring-pulse'), 800);
                        }, 200);
                    }
                    if (el.classList.contains('m-card')) {
                        setTimeout(() => {
                            el.classList.add('shimmer');
                            setTimeout(() => el.classList.remove('shimmer'), 800);
                        }, 120);
                    }
                    if (el.closest && el.closest('.cta-section')) {
                        const sec = document.querySelector('.cta-section');
                        if (sec) {
                            setTimeout(() => {
                                sec.classList.add('glow-once');
                                setTimeout(() => sec.classList.remove('glow-once'), 1400);
                            }, 350);
                        }
                    }
                } else if (!e.isIntersecting && seenEls.has(el)) {
                    el.classList.remove('anim-in');
                    el.classList.add('anim-out');
                    el.addEventListener('transitionend', function snap() {
                        if (el.classList.contains('anim-out')) {
                        el.classList.remove('anim-out');
                        el.classList.add('anim-ready');
                    }
                        el.removeEventListener('transitionend', snap);
                    });
                }
            });
        }, { threshold: [0, 0.18, 1], rootMargin: '0px 0px -30px 0px' });

        animEls.forEach(el => animObs.observe(el));

        document.querySelectorAll('.reveal').forEach(el => {
            if (!el.dataset.anim) {
                el.classList.add('anim-fade-up');
                el.setAttribute('data-anim', '');
                animObs.observe(el);
            }
        });

        document.querySelectorAll('.m-card').forEach((el, i) => {
            if (!el.dataset.anim) {
                el.setAttribute('data-anim', '');
                el.style.transitionDelay = (i * 0.09) + 's';
                animObs.observe(el);
            }
        });

        const countObs = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting && e.target.dataset.target) {
                    Utils.countUp(e.target);
                    countObs.unobserve(e.target);
                }
            });
        }, { threshold: 0.5 });
        document.querySelectorAll('.count-up').forEach(el => countObs.observe(el));
    },

    /**
     * Generate random ID
     * @returns {string} Random ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}