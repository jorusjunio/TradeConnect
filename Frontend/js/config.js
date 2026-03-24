// TradeConnect - Configuration
// API URLs and Constants

const CONFIG = {
    // API Base URL - change this when deploying
    API_URL: 'https://tradeconnect-backend-84vf.onrender.com/api',
    
    // Local Storage Keys
    STORAGE_KEYS: {
        TOKEN: 'tradeconnect_token',
        USER: 'tradeconnect_user'
    },
    
    // API Endpoints
    ENDPOINTS: {
        // Auth
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        GOOGLE_AUTH: '/auth/google',
        VERIFY_TOKEN: '/auth/verify',
        
        // Users
        USERS: '/users',
        USER_PROFILE: '/users/me/profile',
        USER_POSTS: '/users/:id/posts',
        USER_FOLLOWERS: '/users/:id/followers',
        USER_FOLLOWING: '/users/:id/following',
        
        // Posts
        POSTS: '/posts',
        FEED: '/posts/feed',
        POST_LIKE: '/posts/:id/like',
        
        // Comments
        COMMENTS: '/comments',
        POST_COMMENTS: '/comments/post/:postId',
        
        // Follows
        FOLLOW: '/follows/:userId',
        CHECK_FOLLOW: '/follows/check/:userId',
        
        // Alerts
        ALERTS: '/alerts',
        MY_ALERTS: '/alerts/me'
    },
    
    // Market Tags
    MARKETS: ['Forex', 'Crypto', 'Stocks', 'Commodities'],
    
    // Trading Styles
    TRADING_STYLES: ['Day Trading', 'Swing Trading', 'Scalping', 'Position Trading'],
    
    // Experience Levels
    EXPERIENCE_LEVELS: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    
    // Alert Types
    ALERT_TYPES: ['Buy', 'Sell', 'Watch', 'Entry', 'Exit'],
    
    // Pagination
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
};

// Helper to build full API URL
CONFIG.buildUrl = (endpoint, params = {}) => {
    let url = CONFIG.API_URL + endpoint;
    
    // Replace URL parameters (e.g., :id)
    Object.keys(params).forEach(key => {
        url = url.replace(`:${key}`, params[key]);
    });
    
    return url;
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
