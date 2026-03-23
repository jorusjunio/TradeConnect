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
            window.location.href = './login.html';
            return;
        }
        
        // Display current user profile in sidebar
        this.displayCurrentUserProfile();
        
        // Setup event listeners
        this.setupCreatePost();
        this.setupFilterButtons();
        this.setupMarketLinks();
        this.setupCommentsModal();
        this.setupLoadMoreButton();
        
        // Load initial posts
        await this.loadFeed();
    },
    
    /**
     * Display current user profile in sidebar
     */
    displayCurrentUserProfile() {
        if (!this.currentUser) return;
        
        // Update user name
        const userNameEl = document.getElementById('userName');
        if (userNameEl) {
            userNameEl.textContent = this.currentUser.name || 'User';
        }
        
        // Update user avatar
        const userAvatarEl = document.getElementById('userAvatar');
        if (userAvatarEl) {
            userAvatarEl.src = this.currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(this.currentUser.name || 'User')}`;
        }
        
        // Update user bio/trading style
        const userBioEl = document.getElementById('userBio');
        if (userBioEl) {
            userBioEl.textContent = this.currentUser.trading_style || this.currentUser.bio || '';
        }
        
        // Update stats placeholders (will be updated when loading feed data)
        const userPostsEl = document.getElementById('userPosts');
        if (userPostsEl) {
            userPostsEl.textContent = this.currentUser.posts_count || '0';
        }
        
        const userFollowersEl = document.getElementById('userFollowers');
        if (userFollowersEl) {
            userFollowersEl.textContent = this.currentUser.followers_count || '0';
        }
    },
    
    /**
     * Setup comments modal
     */
    setupCommentsModal() {
        const closeBtn = document.getElementById('closeCommentsBtn');
        const addCommentForm = document.getElementById('addCommentForm');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeCommentsModal();
            });
        }
        
        if (addCommentForm) {
            addCommentForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.submitComment();
            });
        }
    },
    
    /**
     * Setup feed filter buttons
     */
    setupFilterButtons() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remove active class from all buttons
                filterBtns.forEach(b => b.classList.remove('active'));
                
                // Add active class to clicked button
                btn.classList.add('active');
                
                // TODO: Load feed based on filter
                // const filter = btn.dataset.filter;
                // this.loadFeed(0, filter);
            });
        });
    },
    
    /**
     * Setup market links in sidebar
     */
    setupMarketLinks() {
        const marketLinks = document.querySelectorAll('.market-link');
        
        marketLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const market = link.dataset.market;
                // TODO: Filter posts by market
                Auth.showMessage(`Filter by ${market} market (coming soon)`, 'info');
            });
        });
    },
    
    /**
     * Setup create post functionality
     */
    setupCreatePost() {
        const createPostForm = document.getElementById('createPostForm');
        
        if (!createPostForm) return;
        
        createPostForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const postContentInput = document.getElementById('postContent');
            const content = postContentInput.value.trim();
            
            if (!content) {
                Auth.showMessage('Please enter some content', 'error');
                return;
            }
            
            const postBtn = document.querySelector('#createPostForm button[type="submit"]');
            const originalText = postBtn.textContent;
            
            try {
                postBtn.disabled = true;
                postBtn.textContent = 'Posting...';
                
                await this.createPost({
                    content,
                    market_tag: document.getElementById('marketTag')?.value || null,
                    strategy_tag: document.getElementById('strategyTag')?.value || null,
                    image_url: document.getElementById('imageUrl')?.value || null
                });
                
                // Clear form
                createPostForm.reset();
                
            } finally {
                postBtn.disabled = false;
                postBtn.textContent = originalText;
            }
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
        const feedContainer = document.getElementById('postsContainer');
        const loadMoreContainer = document.getElementById('loadMoreContainer');
        
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
            // Hide load more button
            if (loadMoreContainer) loadMoreContainer.style.display = 'none';
            return;
        }
        
        // Render posts
        feedContainer.innerHTML = this.posts.map(post => this.renderPostCard(post)).join('');
        
        // Show load more button if there are posts
        if (loadMoreContainer) loadMoreContainer.style.display = 'block';
        
        // Attach event listeners
        this.attachPostEventListeners();
    },
    
    /**
     * Render single post card
     */
    renderPostCard(post) {
        const timeAgo = this.getTimeAgo(post.created_at);
        const isLiked = post.user_liked > 0;
        const isOwnPost = this.currentUser && this.currentUser.id == post.user_id;
        
        return `
            <div class="post-card" data-post-id="${post.id}">
                <div class="post-header">
                    <img src="${post.user_avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(post.user_name)}" 
                         alt="${post.user_name}" 
                         class="post-avatar">
                    <div class="post-user-info">
                        <h4><a href="./profile.html?id=${post.user_id}">${post.user_name}</a></h4>
                        <p>${post.trading_style || 'Trader'} • ${timeAgo}</p>
                    </div>
                    ${isOwnPost ? `
                        <div class="post-options-container">
                            <button class="post-options-btn" data-post-id="${post.id}" title="Post options">
                                <span>⋮</span>
                            </button>
                            <div class="post-options-menu" style="display: none;">
                                <button class="post-option-item edit-post-btn" data-post-id="${post.id}">✏️ Edit</button>
                                <button class="post-option-item save-post-btn" data-post-id="${post.id}">🔖 Save</button>
                                <button class="post-option-item pin-post-btn" data-post-id="${post.id}">📌 Pin to profile</button>
                                <button class="post-option-item audience-btn" data-post-id="${post.id}">👥 Edit Audience</button>
                                <button class="post-option-item archive-btn" data-post-id="${post.id}">📦 Archive</button>
                                <button class="post-option-item delete-btn" data-post-id="${post.id}" style="color: #ef4444;">🗑️ Delete</button>
                            </div>
                        </div>
                    ` : ''}
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
                this.showCommentsModal(postId);
            });
        });
        
        // Share buttons
        document.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const postId = btn.dataset.postId;
                this.sharePost(postId);
            });
        });
        
        // Post options menu toggle
        document.querySelectorAll('.post-options-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const menu = btn.nextElementSibling;
                if (menu) {
                    const isHidden = menu.style.display === 'none';
                    // Close all other menus
                    document.querySelectorAll('.post-options-menu').forEach(m => m.style.display = 'none');
                    // Toggle current menu
                    menu.style.display = isHidden ? 'block' : 'none';
                }
            });
        });
        
        // Delete post
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const postId = btn.dataset.postId;
                if (confirm('Are you sure you want to delete this post?')) {
                    await this.deletePost(postId);
                }
            });
        });
        
        // Save post
        document.querySelectorAll('.save-post-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const postId = btn.dataset.postId;
                await this.savePost(postId);
            });
        });
        
        // Pin post
        document.querySelectorAll('.pin-post-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const postId = btn.dataset.postId;
                await this.pinPost(postId);
            });
        });
        
        // Edit post
        document.querySelectorAll('.edit-post-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const postId = btn.dataset.postId;
                Auth.showMessage('Edit post feature coming soon!', 'info');
            });
        });
        
        // Edit audience
        document.querySelectorAll('.audience-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const postId = btn.dataset.postId;
                Auth.showMessage('Edit audience feature coming soon!', 'info');
            });
        });
        
        // Archive post
        document.querySelectorAll('.archive-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const postId = btn.dataset.postId;
                await this.archivePost(postId);
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', () => {
            document.querySelectorAll('.post-options-menu').forEach(menu => {
                menu.style.display = 'none';
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
     * Show comments modal
     */
    async showCommentsModal(postId) {
        const modal = document.getElementById('commentsModal');
        if (!modal) return;
        
        // Store current post ID
        this.currentCommentPostId = postId;
        
        // Show modal
        modal.style.display = 'flex';
        
        // Load comments
        await this.loadComments(postId);
    },
    
    /**
     * Close comments modal
     */
    closeCommentsModal() {
        const modal = document.getElementById('commentsModal');
        if (modal) {
            modal.style.display = 'none';
            // Clear form
            const form = document.getElementById('addCommentForm');
            if (form) form.reset();
        }
        this.currentCommentPostId = null;
    },
    
    /**
     * Load comments for a post
     */
    async loadComments(postId) {
        try {
            const container = document.getElementById('commentsContainer');
            if (!container) return;
            
            // Show loading
            container.innerHTML = `
                <div class="loading">
                    <div class="loading-spinner"></div>
                </div>
            `;
            
            // Get comments
            const data = await API.get(CONFIG.ENDPOINTS.POST_COMMENTS.replace(':postId', postId));
            
            // Check if comments array exists and has content
            if (!data || !data.comments || data.comments.length === 0) {
                container.innerHTML = `
                    <div class="empty-state" style="text-align: center; padding: var(--spacing-6);">
                        <p>💭 No comments yet. Be the first to comment!</p>
                    </div>
                `;
                return;
            }
            
            // Render comments
            container.innerHTML = data.comments.map(comment => this.renderComment(comment)).join('');
            
        } catch (error) {
            console.error('Load comments error:', error);
            const container = document.getElementById('commentsContainer');
            if (container) {
                container.innerHTML = `
                    <div class="empty-state" style="text-align: center; padding: var(--spacing-6);">
                        <p>⚠️ Failed to load comments</p>
                        <p style="font-size: var(--font-size-sm); color: var(--text-tertiary);">${error.message}</p>
                    </div>
                `;
            }
            Auth.showMessage('Failed to load comments', 'error');
        }
    },
    
    /**
     * Render single comment
     */
    renderComment(comment) {
        const timeAgo = this.getTimeAgo(comment.created_at);
        
        return `
            <div class="comment">
                <img src="${comment.user_avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(comment.user_name)}" 
                     alt="${comment.user_name}" 
                     class="comment-avatar">
                <div class="comment-content">
                    <div class="comment-header">
                        <strong>${comment.user_name}</strong>
                        <span class="comment-time">${timeAgo}</span>
                    </div>
                    <p class="comment-text">${this.escapeHtml(comment.content)}</p>
                </div>
            </div>
        `;
    },
    
    /**
     * Submit a new comment
     */
    async submitComment() {
        try {
            const input = document.getElementById('commentContent');
            const content = input.value.trim();
            
            if (!content) {
                Auth.showMessage('Please enter a comment', 'error');
                return;
            }
            
            if (!this.currentCommentPostId) {
                Auth.showMessage('No post selected', 'error');
                return;
            }
            
            // Submit comment
            const data = await API.post(CONFIG.ENDPOINTS.COMMENTS, {
                post_id: this.currentCommentPostId,
                content: content
            });
            
            // Clear input
            input.value = '';
            
            // Reload comments
            await this.loadComments(this.currentCommentPostId);
            
            Auth.showMessage('Comment posted!', 'success');
            
        } catch (error) {
            console.error('Submit comment error:', error);
            Auth.showMessage(error.message || 'Failed to post comment', 'error');
        }
    },
    
    
    /**
     * Setup load more button
     */
    setupLoadMoreButton() {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        
        if (!loadMoreBtn) return;
        
        loadMoreBtn.addEventListener('click', async () => {
            const originalText = loadMoreBtn.textContent;
            loadMoreBtn.disabled = true;
            loadMoreBtn.textContent = 'Loading...';
            
            try {
                await this.loadFeed(this.posts.length);
            } finally {
                loadMoreBtn.disabled = false;
                loadMoreBtn.textContent = originalText;
            }
        });
    },
    
    /**
     * Show loading indicator
     */
    showLoading() {
        const feedContainer = document.getElementById('postsContainer');
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
        
        // Hide loading state div
        const loadingState = document.getElementById('loadingState');
        if (loadingState) loadingState.style.display = 'none';
    },
    
    /**
     * Delete a post
     */
    async deletePost(postId) {
        try {
            // Call delete endpoint
            await API.delete(CONFIG.ENDPOINTS.POSTS + `/${postId}`);
            
            // Remove from array
            this.posts = this.posts.filter(p => p.id != postId);
            
            // Re-render
            this.renderPosts();
            
            Auth.showMessage('Post deleted successfully!', 'success');
        } catch (error) {
            console.error('Delete post error:', error);
            Auth.showMessage(error.message || 'Failed to delete post', 'error');
        }
    },
    
    /**
     * Save a post (for later)
     */
    async savePost(postId) {
        try {
            // For now, just show a message
            // TODO: Implement save to collection when backend supports it
            Auth.showMessage('Post saved! (Feature coming soon)', 'success');
        } catch (error) {
            console.error('Save post error:', error);
            Auth.showMessage('Failed to save post', 'error');
        }
    },
    
    /**
     * Pin post to profile
     */
    async pinPost(postId) {
        try {
            // For now, just show a message
            // TODO: Implement pin when backend supports it
            Auth.showMessage('Post pinned! (Feature coming soon)', 'success');
        } catch (error) {
            console.error('Pin post error:', error);
            Auth.showMessage('Failed to pin post', 'error');
        }
    },
    
    /**
     * Archive a post
     */
    async archivePost(postId) {
        try {
            // For now, just show a message
            // TODO: Implement archive when backend supports it
            Auth.showMessage('Post archived! (Feature coming soon)', 'success');
        } catch (error) {
            console.error('Archive post error:', error);
            Auth.showMessage('Failed to archive post', 'error');
        }
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


