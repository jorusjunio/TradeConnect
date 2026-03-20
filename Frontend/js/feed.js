// TradeConnect - Feed Page
// Handle feed posts, create post, likes, comments

const Feed = {
    currentUser: null,
    posts: [],
    
    /**
     * Initialize feed page
     */
    async init() {
        // Get current user
        this.currentUser = Auth.getCurrentUser();
        
        if (!this.currentUser) {
            window.location.href = '/pages/login.html';
            return;
        }
        
        // Setup event listeners
        this.setupCreatePost();
        this.setupInfiniteScroll();
        
        // Load initial posts
        await this.loadFeed();
    },
    
    /**
     * Setup create post functionality
     */
    setupCreatePost() {
        const createPostBtn = document.getElementById('createPostBtn');
        const postContentInput = document.getElementById('postContent');
        
        if (!createPostBtn || !postContentInput) return;
        
        createPostBtn.addEventListener('click', async () => {
            const content = postContentInput.value.trim();
            
            if (!content) {
                Auth.showMessage('Please enter some content', 'error');
                return;
            }
            
            await this.createPost({
                content,
                market_tag: document.getElementById('marketTag')?.value || null,
                strategy_tag: document.getElementById('strategyTag')?.value || null,
                image_url: document.getElementById('imageUrl')?.value || null
            });
            
            // Clear form
            postContentInput.value = '';
            if (document.getElementById('marketTag')) document.getElementById('marketTag').value = '';
            if (document.getElementById('strategyTag')) document.getElementById('strategyTag').value = '';
            if (document.getElementById('imageUrl')) document.getElementById('imageUrl').value = '';
        });
    },
    
    /**
     * Create new post
     */
    async createPost(postData) {
        try {
            const data = await API.post(CONFIG.ENDPOINTS.POSTS, postData);
            
            // Add to beginning of posts array
            this.posts.unshift(data.post);
            
            // Re-render feed
            this.renderPosts();
            
            Auth.showMessage('Post created successfully!', 'success');
            
        } catch (error) {
            console.error('Create post error:', error);
            Auth.showMessage(error.message || 'Failed to create post', 'error');
        }
    },
    
    /**
     * Load feed posts
     */
    async loadFeed(offset = 0) {
        try {
            // Show loading if first load
            if (offset === 0) {
                this.showLoading();
            }
            
            // Get feed
            const data = await API.get(CONFIG.ENDPOINTS.FEED + `?limit=${CONFIG.DEFAULT_LIMIT}&offset=${offset}`);
            
            // Add to posts
            if (offset === 0) {
                this.posts = data.posts;
            } else {
                this.posts = [...this.posts, ...data.posts];
            }
            
            // Render posts
            this.renderPosts();
            
        } catch (error) {
            console.error('Load feed error:', error);
            Auth.showMessage('Failed to load feed', 'error');
        }
    },
    
    /**
     * Render posts to DOM
     */
    renderPosts() {
        const feedContainer = document.getElementById('feedContainer');
        
        if (!feedContainer) return;
        
        // Clear loading
        this.hideLoading();
        
        // If no posts
        if (this.posts.length === 0) {
            feedContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <h3>No posts yet</h3>
                    <p>Follow some traders to see their posts here!</p>
                    <a href="/pages/explore.html" class="btn-primary">Explore Traders</a>
                </div>
            `;
            return;
        }
        
        // Render posts
        feedContainer.innerHTML = this.posts.map(post => this.renderPostCard(post)).join('');
        
        // Attach event listeners
        this.attachPostEventListeners();
    },
    
    /**
     * Render single post card
     */
    renderPostCard(post) {
        const timeAgo = this.getTimeAgo(post.created_at);
        const isLiked = post.user_liked > 0;
        
        return `
            <div class="post-card" data-post-id="${post.id}">
                <div class="post-header">
                    <img src="${post.user_avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(post.user_name)}" 
                         alt="${post.user_name}" 
                         class="post-avatar">
                    <div class="post-user-info">
                        <h4><a href="/pages/profile.html?id=${post.user_id}">${post.user_name}</a></h4>
                        <p>${post.trading_style || 'Trader'} • ${timeAgo}</p>
                    </div>
                </div>
                
                <div class="post-content">${this.escapeHtml(post.content)}</div>
                
                ${post.image_url ? `<img src="${post.image_url}" alt="Post image" class="post-image">` : ''}
                
                ${post.market_tag || post.strategy_tag ? `
                    <div class="post-tags">
                        ${post.market_tag ? `<span class="tag tag-primary">${post.market_tag}</span>` : ''}
                        ${post.strategy_tag ? `<span class="tag tag-success">${post.strategy_tag}</span>` : ''}
                    </div>
                ` : ''}
                
                <div class="post-actions">
                    <button class="action-btn like-btn ${isLiked ? 'active' : ''}" data-post-id="${post.id}">
                        <span>${isLiked ? '❤️' : '🤍'}</span>
                        <span>${post.likes_count} ${post.likes_count === 1 ? 'like' : 'likes'}</span>
                    </button>
                    
                    <button class="action-btn comment-btn" data-post-id="${post.id}">
                        <span>💬</span>
                        <span>${post.comments_count} ${post.comments_count === 1 ? 'comment' : 'comments'}</span>
                    </button>
                    
                    <button class="action-btn share-btn" data-post-id="${post.id}">
                        <span>🔗</span>
                        <span>Share</span>
                    </button>
                </div>
            </div>
        `;
    },
    
    /**
     * Attach event listeners to posts
     */
    attachPostEventListeners() {
        // Like buttons
        document.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const postId = btn.dataset.postId;
                await this.toggleLike(postId);
            });
        });
        
        // Comment buttons
        document.querySelectorAll('.comment-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const postId = btn.dataset.postId;
                // TODO: Show comments modal or section
                console.log('Show comments for post:', postId);
            });
        });
        
        // Share buttons
        document.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const postId = btn.dataset.postId;
                this.sharePost(postId);
            });
        });
    },
    
    /**
     * Toggle like on post
     */
    async toggleLike(postId) {
        try {
            await API.post(CONFIG.ENDPOINTS.POST_LIKE, {}, { id: postId });
            
            // Update post in array
            const post = this.posts.find(p => p.id == postId);
            if (post) {
                if (post.user_liked > 0) {
                    post.user_liked = 0;
                    post.likes_count--;
                } else {
                    post.user_liked = 1;
                    post.likes_count++;
                }
            }
            
            // Re-render
            this.renderPosts();
            
        } catch (error) {
            console.error('Like error:', error);
            Auth.showMessage('Failed to like post', 'error');
        }
    },
    
    /**
     * Share post (copy link)
     */
    sharePost(postId) {
        const url = `${window.location.origin}/pages/post.html?id=${postId}`;
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(url);
            Auth.showMessage('Post link copied to clipboard!', 'success');
        } else {
            prompt('Copy this link:', url);
        }
    },
    
    /**
     * Setup infinite scroll
     */
    setupInfiniteScroll() {
        let loading = false;
        
        window.addEventListener('scroll', async () => {
            if (loading) return;
            
            const scrollPosition = window.innerHeight + window.scrollY;
            const threshold = document.documentElement.scrollHeight - 500;
            
            if (scrollPosition >= threshold) {
                loading = true;
                await this.loadFeed(this.posts.length);
                loading = false;
            }
        });
    },
    
    /**
     * Show loading indicator
     */
    showLoading() {
        const feedContainer = document.getElementById('feedContainer');
        if (feedContainer) {
            feedContainer.innerHTML = `
                <div class="loading">
                    <div class="loading-spinner"></div>
                </div>
            `;
        }
    },
    
    /**
     * Hide loading indicator
     */
    hideLoading() {
        const loadingEl = document.querySelector('.loading');
        if (loadingEl) loadingEl.remove();
    },
    
    /**
     * Get time ago text
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
    
    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Feed.init());
} else {
    Feed.init();
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Feed;
}
