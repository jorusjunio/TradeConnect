// TradeConnect - Profile Page
// Handle user profile display and editing

const Profile = {
    userId: null,
    currentUser: null,
    profileUser: null,
    isOwnProfile: false,
    
    /**
     * Initialize profile page
     */
    async init() {
        // Get current logged in user
        this.currentUser = Auth.getCurrentUser();
        
        if (!this.currentUser) {
            window.location.href = './login.html';
            return;
        }
        
        // Get user ID from URL or use current user
        const urlParams = new URLSearchParams(window.location.search);
        this.userId = urlParams.get('id') || this.currentUser.id;
        this.isOwnProfile = this.userId == this.currentUser.id;
        
        // Load profile
        await this.loadProfile();
        
        // Setup tabs
        this.setupTabs();
        
        // Setup edit profile if own profile
        if (this.isOwnProfile) {
            this.setupEditProfile();
        }
    },
    
    /**
     * Setup profile tabs
     */
    setupTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = btn.dataset.tab;
                
                // Remove active class from all buttons and contents
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked button
                btn.classList.add('active');
                
                // Show corresponding tab content
                const activeTab = document.getElementById(tabName + 'Tab');
                if (activeTab) {
                    activeTab.classList.add('active');
                    
                    // Load tab data if needed
                    if (tabName === 'followers') {
                        this.loadFollowers();
                    } else if (tabName === 'following') {
                        this.loadFollowing();
                    }
                }
            });
        });
    },
    
    /**
     * Load user profile
     */
    async loadProfile() {
        try {
            // Show loading
            this.showLoading();
            
            // Get profile data
            const endpoint = this.isOwnProfile 
                ? CONFIG.ENDPOINTS.USER_PROFILE 
                : CONFIG.ENDPOINTS.USERS + `/${this.userId}`;
            
            const data = await API.get(endpoint);
            this.profileUser = data.user;
            
            // Render profile
            this.renderProfile();
            
            // Load user's posts
            await this.loadUserPosts();
            
        } catch (error) {
            console.error('Load profile error:', error);
            Auth.showMessage('Failed to load profile', 'error');
        }
    },
    
    /**
     * Render profile information
     */
    renderProfile() {
        const user = this.profileUser;
        
        // Update profile header
        document.getElementById('profileName').textContent = user.name;
        document.getElementById('profileEmail').textContent = user.email;
        document.getElementById('profileAvatar').src = 
            user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`;
        
        // Bio
        const bioEl = document.getElementById('profileBio');
        if (bioEl) {
            bioEl.textContent = user.bio || 'No bio yet';
        }
        
        // Trading style
        const tradingStyleEl = document.getElementById('profileTradingStyle');
        if (tradingStyleEl && user.trading_style) {
            tradingStyleEl.textContent = user.trading_style;
        }
        
        // Experience level
        const experienceEl = document.getElementById('profileExperience');
        if (experienceEl && user.experience_level) {
            experienceEl.textContent = user.experience_level;
        }
        
        // Portfolio link
        const portfolioEl = document.getElementById('profilePortfolio');
        if (portfolioEl && user.portfolio_link) {
            portfolioEl.href = user.portfolio_link;
            portfolioEl.style.display = 'inline-block';
        }
        
        // Stats
        document.getElementById('postsCount').textContent = user.posts_count || 0;
        document.getElementById('followersCount').textContent = user.followers_count || 0;
        document.getElementById('followingCount').textContent = user.following_count || 0;
        
        // Follow button (if not own profile)
        if (!this.isOwnProfile) {
            this.renderFollowButton();
        } else {
            // Show edit button
            const editBtn = document.getElementById('editProfileBtn');
            if (editBtn) {
                editBtn.style.display = 'inline-block';
            }
        }
        
        this.hideLoading();
    },
    
    /**
     * Render follow/unfollow button
     */
    async renderFollowButton() {
        const followBtn = document.getElementById('followBtn');
        if (!followBtn) return;
        
        try {
            const isFollowing = this.profileUser.is_following > 0;
            
            followBtn.textContent = isFollowing ? 'Unfollow' : 'Follow';
            followBtn.className = isFollowing ? 'btn-outline' : 'btn-primary';
            followBtn.style.display = 'inline-block';
            
            followBtn.onclick = async () => {
                await this.toggleFollow();
            };
            
        } catch (error) {
            console.error('Follow button error:', error);
        }
    },
    
    /**
     * Toggle follow/unfollow
     */
    async toggleFollow() {
        try {
            const isFollowing = this.profileUser.is_following > 0;
            
            if (isFollowing) {
                // Unfollow
                await API.delete(CONFIG.ENDPOINTS.FOLLOW, { userId: this.userId });
                this.profileUser.is_following = 0;
                this.profileUser.followers_count--;
            } else {
                // Follow
                await API.post(CONFIG.ENDPOINTS.FOLLOW, {}, { userId: this.userId });
                this.profileUser.is_following = 1;
                this.profileUser.followers_count++;
            }
            
            // Re-render
            this.renderProfile();
            Auth.showMessage(isFollowing ? 'Unfollowed successfully' : 'Following!', 'success');
            
        } catch (error) {
            console.error('Toggle follow error:', error);
            Auth.showMessage('Failed to update follow status', 'error');
        }
    },
    
    /**
     * Load user's posts
     */
    async loadUserPosts() {
        try {
            const data = await API.get(CONFIG.ENDPOINTS.USER_POSTS.replace(':id', this.userId));
            
            const postsContainer = document.getElementById('userPosts');
            if (!postsContainer) return;
            
            if (data.posts.length === 0) {
                postsContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📝</div>
                        <h3>No posts yet</h3>
                        <p>${this.isOwnProfile ? 'Start sharing your trades!' : 'This user hasn\'t posted yet.'}</p>
                    </div>
                `;
                return;
            }
            
            // Render posts
            postsContainer.innerHTML = data.posts.map(post => this.renderPostCard(post)).join('');
            
        } catch (error) {
            console.error('Load posts error:', error);
        }
    },
    
    /**
     * Load and render followers
     */
    async loadFollowers() {
        try {
            const followersList = document.getElementById('followersList');
            if (!followersList) return;
            
            // Show loading
            followersList.innerHTML = `
                <div class="loading">
                    <div class="loading-spinner"></div>
                </div>
            `;
            
            // Fetch followers from API
            const endpoint = CONFIG.ENDPOINTS.USER_FOLLOWERS.replace(':id', this.userId);
            const data = await API.get(endpoint);
            const followers = data.followers || [];
            
            // Hide loading and display followers
            if (followers.length === 0) {
                followersList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">👥</div>
                        <p>No followers yet</p>
                    </div>
                `;
            } else {
                followersList.innerHTML = followers.map(follower => `
                    <div class="user-card">
                        <img src="${follower.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(follower.name)}" 
                             alt="${follower.name}" 
                             class="avatar avatar-lg">
                        <h4><a href="./profile.html?id=${follower.id}">${this.escapeHtml(follower.name)}</a></h4>
                        <p>${follower.trading_style || 'Trader'}</p>
                        <a href="./profile.html?id=${follower.id}" class="btn-primary btn-sm">View Profile</a>
                    </div>
                `).join('');
            }
            
        } catch (error) {
            console.error('Load followers error:', error);
            const followersList = document.getElementById('followersList');
            if (followersList) {
                followersList.innerHTML = `
                    <div class="empty-state">
                        <p>Failed to load followers</p>
                    </div>
                `;
            }
        }
    },
    
    /**
     * Load and render following
     */
    async loadFollowing() {
        try {
            const followingList = document.getElementById('followingList');
            if (!followingList) return;
            
            // Show loading
            followingList.innerHTML = `
                <div class="loading">
                    <div class="loading-spinner"></div>
                </div>
            `;
            
            // Fetch following from API
            const endpoint = CONFIG.ENDPOINTS.USER_FOLLOWING.replace(':id', this.userId);
            const data = await API.get(endpoint);
            const following = data.following || [];
            
            // Hide loading and display following
            if (following.length === 0) {
                followingList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">👥</div>
                        <p>Not following anyone yet</p>
                    </div>
                `;
            } else {
                followingList.innerHTML = following.map(user => `
                    <div class="user-card">
                        <img src="${user.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name)}" 
                             alt="${user.name}" 
                             class="avatar avatar-lg">
                        <h4><a href="./profile.html?id=${user.id}">${this.escapeHtml(user.name)}</a></h4>
                        <p>${user.trading_style || 'Trader'}</p>
                        <a href="./profile.html?id=${user.id}" class="btn-primary btn-sm">View Profile</a>
                    </div>
                `).join('');
            }
            
        } catch (error) {
            console.error('Load following error:', error);
            const followingList = document.getElementById('followingList');
            if (followingList) {
                followingList.innerHTML = `
                    <div class="empty-state">
                        <p>Failed to load following</p>
                    </div>
                `;
            }
        }
    },
    
    /**
     * Render post card (simplified version)
     */
    renderPostCard(post) {
        const timeAgo = this.getTimeAgo(post.created_at);
        
        return `
            <div class="post-card">
                <div class="post-content">${this.escapeHtml(post.content)}</div>
                ${post.image_url ? `<img src="${post.image_url}" class="post-image">` : ''}
                <div class="post-meta">
                    <span>${timeAgo}</span>
                    <span>❤️ ${post.likes_count}</span>
                    <span>💬 ${post.comments_count}</span>
                </div>
            </div>
        `;
    },
    
    /**
     * Setup edit profile functionality
     */
    setupEditProfile() {
        const editBtn = document.getElementById('editProfileBtn');
        const cancelBtn = document.getElementById('cancelEditBtn');
        const closeModalBtn = document.getElementById('closeModalBtn');
        const editForm = document.getElementById('editProfileForm');
        
        if (!editBtn) return;
        
        // Edit button - opens modal
        editBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.openEditModal();
        });
        
        // Cancel button - closes modal
        if (cancelBtn) {
            cancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeEditModal();
            });
        }
        
        // Close button (X) - closes modal
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeEditModal();
            });
        }
        
        // Form submission - save profile
        if (editForm) {
            editForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.saveProfile();
            });
        }
    },
    
    /**
     * Open edit profile modal
     */
    openEditModal() {
        const modal = document.getElementById('editProfileModal');
        if (!modal) return;
        
        // Populate edit form
        document.getElementById('editName').value = this.profileUser.name || '';
        document.getElementById('editBio').value = this.profileUser.bio || '';
        document.getElementById('editTradingStyle').value = this.profileUser.trading_style || '';
        document.getElementById('editExperienceLevel').value = this.profileUser.experience_level || '';
        document.getElementById('editPortfolio').value = this.profileUser.portfolio_link || '';
        document.getElementById('editAvatar').value = this.profileUser.avatar || '';
        
        modal.style.display = 'flex';
    },
    
    /**
     * Close edit profile modal
     */
    closeEditModal() {
        const modal = document.getElementById('editProfileModal');
        if (modal) {
            modal.style.display = 'none';
        }
    },
    
    /**
     * Toggle edit mode (deprecated - use openEditModal/closeEditModal instead)
     */
    toggleEditMode(editing) {
        if (editing) {
            this.openEditModal();
        } else {
            this.closeEditModal();
        }
    },
    
    /**
     * Save profile changes
     */
    async saveProfile() {
        try {
            const updatedData = {
                name: document.getElementById('editName').value,
                bio: document.getElementById('editBio').value,
                trading_style: document.getElementById('editTradingStyle').value,
                experience_level: document.getElementById('editExperienceLevel').value,
                portfolio_link: document.getElementById('editPortfolio').value,
                avatar: document.getElementById('editAvatar').value
            };
            
            const data = await API.put(CONFIG.ENDPOINTS.USER_PROFILE, updatedData);
            
            // Update stored user
            Auth.updateCurrentUser(data.user);
            this.profileUser = data.user;
            
            // Re-render and close modal
            this.renderProfile();
            this.closeEditModal();
            
            Auth.showMessage('Profile updated successfully!', 'success');
            
        } catch (error) {
            console.error('Save profile error:', error);
            Auth.showMessage('Failed to update profile', 'error');
        }
    },
    
    /**
     * Show loading
     */
    showLoading() {
        const container = document.getElementById('profileContainer');
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
     * Helper functions
     */
    getTimeAgo(timestamp) {
        const now = new Date();
        const past = new Date(timestamp);
        const diffMs = now - past;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return past.toLocaleDateString();
    },
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Profile.init());
} else {
    Profile.init();
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Profile;
}


