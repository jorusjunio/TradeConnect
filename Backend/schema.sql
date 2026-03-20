-- TradeConnect Database Schema
-- MySQL/TiDB Compatible

-- Drop existing tables if they exist (for fresh setup)
DROP TABLE IF EXISTS trade_alerts;
DROP TABLE IF EXISTS likes;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS follows;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS users;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    google_id VARCHAR(255) UNIQUE,
    avatar VARCHAR(500) DEFAULT 'https://ui-avatars.com/api/?name=User',
    bio TEXT,
    trading_style VARCHAR(50),  -- swing, day, scalping
    experience_level VARCHAR(50),  -- beginner, intermediate, advanced, expert
    portfolio_link VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_google_id (google_id)
);

-- Posts table
CREATE TABLE posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    image_url VARCHAR(500),
    market_tag VARCHAR(50),  -- Forex, Crypto, Stocks, Commodities
    strategy_tag VARCHAR(100),  -- Technical Analysis, Fundamental, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_market_tag (market_tag),
    INDEX idx_created_at (created_at)
);

-- Comments table
CREATE TABLE comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    post_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    INDEX idx_post_id (post_id),
    INDEX idx_user_id (user_id)
);

-- Likes table
CREATE TABLE likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    post_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_like (user_id, post_id),
    INDEX idx_post_id (post_id),
    INDEX idx_user_id (user_id)
);

-- Follows table (social connections)
CREATE TABLE follows (
    id INT AUTO_INCREMENT PRIMARY KEY,
    follower_id INT NOT NULL,  -- The user who is following
    following_id INT NOT NULL,  -- The user being followed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_follow (follower_id, following_id),
    INDEX idx_follower (follower_id),
    INDEX idx_following (following_id)
);

-- Trade Alerts table (optional feature)
CREATE TABLE trade_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    market VARCHAR(50) NOT NULL,  -- Forex, Crypto, Stocks
    alert_type VARCHAR(50) NOT NULL,  -- Buy, Sell, Watch
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'active',  -- active, triggered, expired
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_market (market)
);

-- Insert sample data for testing (optional)
INSERT INTO users (name, email, password, trading_style, experience_level, bio) VALUES
('John Trader', 'john@example.com', '$2a$10$XQVKz5zXJ5X5ZqX5ZqX5ZqX5ZqX5ZqX5ZqX5ZqX5ZqX5Z', 'day', 'advanced', 'Day trader focused on forex and crypto'),
('Sarah Investor', 'sarah@example.com', '$2a$10$XQVKz5zXJ5X5ZqX5ZqX5ZqX5ZqX5ZqX5ZqX5ZqX5ZqX5Z', 'swing', 'intermediate', 'Swing trader specializing in stocks');

-- Verification queries
SELECT 'Database schema created successfully!' as status;
SELECT COUNT(*) as user_count FROM users;
