// TradeConnect - Explore Page
// Search and discover traders

const Explore = {
    traders: [],
    currentUser: null,
    followStatus: {}, // Track follow status for each trader
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
            window.location.href = './login.html';
            return;
        }
        
        // Get current user
        this.currentUser = Auth.getCurrentUser();
        
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
        // Trading style filter select
        const tradingStyleFilter = document.getElementById('tradingStyleFilter');
        if (tradingStyleFilter) {
            tradingStyleFilter.addEventListener('change', (e) => {
                this.setFilter('trading_style', e.target.value);
            });
        }
        
        // Experience level filter select
        const experienceFilter = document.getElementById('experienceFilter');
        if (experienceFilter) {
            experienceFilter.addEventListener('change', (e) => {
                this.setFilter('experience_level', e.target.value);
            });
        }
        
        // Reset filters button
        const resetBtn = document.getElementById('resetFiltersBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
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
        
        // Reset select dropdowns
        const tradingStyleFilter = document.getElementById('tradingStyleFilter');
        if (tradingStyleFilter) tradingStyleFilter.value = '';
        
        const experienceFilter = document.getElementById('experienceFilter');
        if (experienceFilter) experienceFilter.value = '';
        
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
            
            // Check follow status for each trader
            if (this.currentUser) {
                for (const trader of this.traders) {
                    try {
                        const followData = await API.get(CONFIG.ENDPOINTS.CHECK_FOLLOW.replace(':userId', trader.id));
                        this.followStatus[trader.id] = followData.is_following > 0;
                    } catch (error) {
                        this.followStatus[trader.id] = false;
                    }
                }
            }
            
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
        const isFollowing = this.followStatus[trader.id] || false;
        
        return `
            <div class="trader-card" onclick="Explore.goToProfile(${trader.id})">
                <div class="trader-card-header">
                    <img src="${trader.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(trader.name)}" 
                         alt="${trader.name}" 
                         class="avatar avatar-lg">
                    <div class="trader-card-info">
                        <h4>${this.escapeHtml(trader.name)}</h4>
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
                
                <button class="btn-full follow-btn ${isFollowing ? 'following' : ''}" data-trader-id="${trader.id}" onclick="event.stopPropagation(); Explore.toggleFollow(${trader.id})">
                    ${isFollowing ? '✓ Following' : '+ Follow'}
                </button>
            </div>
        `;
    },
    
    /**
     * Show loading
     */
    showLoading() {
        const loadingState = document.getElementById('loadingState');
        if (loadingState) loadingState.style.display = 'block';
        
        const container = document.getElementById('tradersGrid');
        if (container) {
            container.innerHTML = '';
        }
    },
    
    /**
     * Hide loading
     */
    hideLoading() {
        const loading = document.querySelector('.loading');
        if (loading) loading.remove();
        
        // Hide loading state div
        const loadingState = document.getElementById('loadingState');
        if (loadingState) loadingState.style.display = 'none';
    },
    
    /**
     * Go to trader profile
     */
    goToProfile(traderId) {
        window.location.href = './profile.html?id=${traderId}';
    },
    
    /**
     * Toggle follow/unfollow
     */
    async toggleFollow(traderId) {
        try {
            if (this.followStatus[traderId]) {
                // Unfollow
                await API.delete(CONFIG.ENDPOINTS.FOLLOW.replace(':userId', traderId));
                this.followStatus[traderId] = false;
            } else {
                // Follow
                await API.post(CONFIG.ENDPOINTS.FOLLOW.replace(':userId', traderId));
                this.followStatus[traderId] = true;
            }
            
            // Re-render traders to update button state
            this.renderTraders();
            
            // Show message
            const action = this.followStatus[traderId] ? 'followed' : 'unfollowed';
            Auth.showMessage(`Trader ${action}!`, 'success');
        } catch (error) {
            console.error('Toggle follow error:', error);
            Auth.showMessage(error.message || 'Failed to update follow status', 'error');
        }
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


