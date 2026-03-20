// TradeConnect - Authentication
// Handle login, register, logout

const Auth = {
    /**
     * Initialize authentication
     */
    init() {
        // Check if on login/register page
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        if (loginForm) {
            this.initLoginForm();
        }
        
        if (registerForm) {
            this.initRegisterForm();
        }
        
        // Check authentication on protected pages
        this.checkAuthOnProtectedPages();
    },
    
    /**
     * Initialize login form
     */
    initLoginForm() {
        const form = document.getElementById('loginForm');
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            try {
                // Show loading
                submitBtn.disabled = true;
                submitBtn.textContent = 'Logging in...';
                
                // Get form data
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                
                // Login
                const data = await API.post(CONFIG.ENDPOINTS.LOGIN, {
                    email,
                    password
                });
                
                // Save auth data
                API.saveAuth(data.token, data.user);
                
                // Show success
                this.showMessage('Login successful! Redirecting...', 'success');
                
                // Redirect to feed
                setTimeout(() => {
                    window.location.href = '/pages/feed.html';
                }, 1000);
                
            } catch (error) {
                console.error('Login error:', error);
                this.showMessage(error.message || 'Login failed. Please try again.', 'error');
                
                // Reset button
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    },
    
    /**
     * Initialize register form
     */
    initRegisterForm() {
        const form = document.getElementById('registerForm');
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            try {
                // Show loading
                submitBtn.disabled = true;
                submitBtn.textContent = 'Creating account...';
                
                // Get form data
                const name = document.getElementById('name').value;
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                const confirmPassword = document.getElementById('confirmPassword')?.value;
                
                // Validate passwords match
                if (confirmPassword && password !== confirmPassword) {
                    throw new Error('Passwords do not match');
                }
                
                // Get optional fields
                const trading_style = document.getElementById('tradingStyle')?.value;
                const experience_level = document.getElementById('experienceLevel')?.value;
                
                // Register
                const data = await API.post(CONFIG.ENDPOINTS.REGISTER, {
                    name,
                    email,
                    password,
                    trading_style,
                    experience_level
                });
                
                // Save auth data
                API.saveAuth(data.token, data.user);
                
                // Show success
                this.showMessage('Registration successful! Redirecting...', 'success');
                
                // Redirect to feed
                setTimeout(() => {
                    window.location.href = '/pages/feed.html';
                }, 1000);
                
            } catch (error) {
                console.error('Registration error:', error);
                this.showMessage(error.message || 'Registration failed. Please try again.', 'error');
                
                // Reset button
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    },
    
    /**
     * Google OAuth login
     */
    async loginWithGoogle(googleData) {
        try {
            const data = await API.post(CONFIG.ENDPOINTS.GOOGLE_AUTH, googleData);
            
            // Save auth data
            API.saveAuth(data.token, data.user);
            
            // Redirect to feed
            window.location.href = '/pages/feed.html';
            
        } catch (error) {
            console.error('Google login error:', error);
            this.showMessage('Google login failed. Please try again.', 'error');
        }
    },
    
    /**
     * Logout user
     */
    logout() {
        // Clear auth data
        API.clearAuth();
        
        // Redirect to login
        window.location.href = '/pages/login.html';
    },
    
    /**
     * Check authentication on protected pages
     */
    checkAuthOnProtectedPages() {
        const protectedPages = ['/feed.html', '/profile.html', '/explore.html'];
        const currentPage = window.location.pathname;
        
        // Check if on protected page
        const isProtected = protectedPages.some(page => currentPage.includes(page));
        
        if (isProtected && !API.isAuthenticated()) {
            // Redirect to login
            window.location.href = '/pages/login.html';
        }
    },
    
    /**
     * Get current logged in user
     */
    getCurrentUser() {
        return API.getCurrentUser();
    },
    
    /**
     * Update user profile in localStorage
     */
    updateCurrentUser(userData) {
        const currentUser = this.getCurrentUser();
        const updatedUser = { ...currentUser, ...userData };
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    },
    
    /**
     * Show message to user
     */
    showMessage(message, type = 'info') {
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `alert alert-${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#2563eb'};
            color: white;
            font-weight: 600;
            z-index: 9999;
            box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
            animation: slideIn 0.3s ease;
        `;
        
        // Add to page
        document.body.appendChild(messageDiv);
        
        // Remove after 3 seconds
        setTimeout(() => {
            messageDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => messageDiv.remove(), 300);
        }, 3000);
    }
};

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Auth.init());
} else {
    Auth.init();
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Auth;
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
