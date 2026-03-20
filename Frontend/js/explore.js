// TradeConnect - Explore Page
// Search and discover traders

const Explore = {
    traders: [],
    filters: {
        search: '',
        trading_style: '',
        experience_level: '',
        market: ''
    },
    
    /**
     * Initialize explore page
     */
    async init() {
        // Check authentication
        if (!API.isAuthenticated()) {
            window.location.href = '/pages/login.html';
            return;
        }
        
        // Setup search
        this.setupSearch();
        
        // Setup filters
        this.setupFilters();
        
        // Load all traders
        await this.loadTraders();
    },
    
    /**
     * Setup search functionality
     */
    setupSearch() {
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        
        if (!searchInput) return;
        
        // Search on button click
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.filters.search = searchInput.value;
                this.loadTraders();
            });
        }
        
        // Search on enter
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.filters.search = searchInput.value;
                this.loadTraders();
            }
        });
        
        // Real-time search (debounced)
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.filters.search = e.target.value;
                this.loadTraders();
            }, 500);
        });
    },
    
    /**
     * Setup filter buttons
     */
    setupFilters() {
        // Trading style filters
        document.querySelectorAll('[data-filter-type="trading_style"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter('trading_style', btn.dataset.filterValue);
                this.updateFilterUI('trading_style', btn);
            });
        });
        
        // Experience level filters
        document.querySelectorAll('[data-filter-type="experience"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter('experience_level', btn.dataset.filterValue);
                this.updateFilterUI('experience', btn);
            });
        });
        
        // Market filters
        document.querySelectorAll('[data-filter-type="market"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter('market', btn.dataset.filterValue);
                this.updateFilterUI('market', btn);
            });
        });
        
        // Clear filters button
        const clearBtn = document.getElementById('clearFilters');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearFilters();
            });
        }
    },
    
    /**
     * Set filter value
     */
    setFilter(type, value) {
        this.filters[type] = value;
        this.loadTraders();
    },
    
    /**
     * Update filter button UI
     */
    updateFilterUI(type, activeBtn) {
        // Remove active class from all buttons of this type
        document.querySelectorAll(`[data-filter-type="${type}"]`).forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active class to clicked button
        activeBtn.classList.add('active');
    },
    
    /**
     * Clear all filters
     */
    clearFilters() {
        this.filters = {
            search: '',
            trading_style: '',
            experience_level: '',
            market: ''
        };
        
        // Clear search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';
        
        // Remove active class from all filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Reload traders
        this.loadTraders();
    },
    
    /**
     * Load traders based on filters
     */
    async loadTraders() {
        try {
            // Show loading
            this.showLoading();
            
            // Build query params
            const params = new URLSearchParams();
            if (this.filters.search) params.append('search', this.filters.search);
            if (this.filters.trading_style) params.append('trading_style', this.filters.trading_style);
            if (this.filters.experience_level) params.append('experience_level', this.filters.experience_level);
            
            // Get traders
            const url = `${CONFIG.ENDPOINTS.USERS}?${params.toString()}`;
            const data = await API.get(url);
            
            this.traders = data.users;
            
            // Render traders
            this.renderTraders();
            
        } catch (error) {
            console.error('Load traders error:', error);
            Auth.showMessage('Failed to load traders', 'error');
        }
    },
    
    /**
     * Render traders grid
     */
    renderTraders() {
        const container = document.getElementById('tradersGrid');
        
        if (!container) return;
        
        // Hide loading
        this.hideLoading();
        
        // If no traders found
        if (this.traders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <h3>No traders found</h3>
                    <p>Try adjusting your search or filters</p>
                </div>
            `;
            return;
        }
        
        // Render trader cards
        container.innerHTML = this.traders.map(trader => this.renderTraderCard(trader)).join('');
    },
    
    /**
     * Render single trader card
     */
    renderTraderCard(trader) {
        return `
            <div class="trader-card">
                <div class="trader-card-header">
                    <img src="${trader.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(trader.name)}" 
                         alt="${trader.name}" 
                         class="avatar avatar-lg">
                    <div class="trader-card-info">
                        <h4><a href="/pages/profile.html?id=${trader.id}">${this.escapeHtml(trader.name)}</a></h4>
                        <p>${trader.trading_style || 'Trader'} • ${trader.experience_level || 'Beginner'}</p>
                    </div>
                </div>
                
                ${trader.bio ? `
                    <p class="trader-card-bio">${this.escapeHtml(trader.bio)}</p>
                ` : ''}
                
                <div class="trader-card-stats">
                    <div class="trader-card-stat">
                        <div class="trader-card-stat-number">0</div>
                        <div class="trader-card-stat-label">Posts</div>
                    </div>
                    <div class="trader-card-stat">
                        <div class="trader-card-stat-number">0</div>
                        <div class="trader-card-stat-label">Followers</div>
                    </div>
                    <div class="trader-card-stat">
                        <div class="trader-card-stat-number">0</div>
                        <div class="trader-card-stat-label">Following</div>
                    </div>
                </div>
                
                <a href="/pages/profile.html?id=${trader.id}" class="btn-primary btn-full">View Profile</a>
            </div>
        `;
    },
    
    /**
     * Show loading
     */
    showLoading() {
        const container = document.getElementById('tradersGrid');
        if (container) {
            container.innerHTML = `
                <div class="loading">
                    <div class="loading-spinner"></div>
                </div>
            `;
        }
    },
    
    /**
     * Hide loading
     */
    hideLoading() {
        const loading = document.querySelector('.loading');
        if (loading) loading.remove();
    },
    
    /**
     * Escape HTML
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Explore.init());
} else {
    Explore.init();
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Explore;
}
