// TradeConnect - API Wrapper
// Handles all API requests with authentication

const API = {
    /**
     * Make an authenticated API request
     * @param {string} url - API endpoint URL
     * @param {object} options - Fetch options (method, body, etc.)
     * @returns {Promise} Response data or error
     */
    async request(url, options = {}) {
        try {
            // Get token from localStorage
            const token = localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
            
            // Default headers
            const headers = {
                'Content-Type': 'application/json',
                ...options.headers
            };
            
            // Add authorization if token exists
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            // Make request
            const response = await fetch(url, {
                ...options,
                headers
            });
            
            // Parse response
            const data = await response.json();
            
            // Handle errors
            if (!response.ok) {
                // Token expired or invalid
                if (response.status === 401) {
                    this.handleUnauthorized();
                }
                
                throw new Error(data.error || data.message || 'Request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    /**
     * GET request
     */
    async get(endpoint, params = {}) {
        const url = CONFIG.buildUrl(endpoint, params);
        return this.request(url, { method: 'GET' });
    },
    
    /**
     * POST request
     */
    async post(endpoint, data = {}, params = {}) {
        const url = CONFIG.buildUrl(endpoint, params);
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    /**
     * PUT request
     */
    async put(endpoint, data = {}, params = {}) {
        const url = CONFIG.buildUrl(endpoint, params);
        return this.request(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    /**
     * DELETE request
     */
    async delete(endpoint, params = {}) {
        const url = CONFIG.buildUrl(endpoint, params);
        return this.request(url, { method: 'DELETE' });
    },
    
    /**
     * Handle unauthorized access (token expired)
     */
    handleUnauthorized() {
        // Clear stored data
        localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
        
        // Redirect to login
        if (!window.location.pathname.includes('login')) {
            alert('Session expired. Please login again.');
            window.location.href = '/pages/login.html';
        }
    },
    
    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
    },
    
    /**
     * Get current user from localStorage
     */
    getCurrentUser() {
        const userStr = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
        return userStr ? JSON.parse(userStr) : null;
    },
    
    /**
     * Save user and token to localStorage
     */
    saveAuth(token, user) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, token);
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(user));
    },
    
    /**
     * Clear authentication
     */
    clearAuth() {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
}
