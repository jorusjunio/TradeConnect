// Users Routes
const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../middleware/auth');
const { query } = require('../config/database');
const { body, validationResult } = require('express-validator');

// Get all users / search users
router.get('/', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        const { search, trading_style, experience_level } = req.query;

        let sql = 'SELECT id, name, email, avatar, bio, trading_style, experience_level, portfolio_link, created_at FROM users WHERE 1=1';
        const params = [];

        if (search) {
            sql += ' AND (name LIKE ? OR email LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        if (trading_style) {
            sql += ' AND trading_style = ?';
            params.push(trading_style);
        }

        if (experience_level) {
            sql += ' AND experience_level = ?';
            params.push(experience_level);
        }

        sql += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

        const users = await query(sql, params);

        res.json({
            users,
            pagination: {
                limit,
                offset
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Get user profile
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const { id } = req.params;

        let sql = `
            SELECT 
                id, name, email, avatar, bio, trading_style, experience_level, portfolio_link, created_at,
                (SELECT COUNT(*) FROM posts WHERE user_id = ?) as posts_count,
                (SELECT COUNT(*) FROM follows WHERE following_id = ?) as followers_count,
                (SELECT COUNT(*) FROM follows WHERE follower_id = ?) as following_count
        `;

        const params = [id, id, id];

        // If user is authenticated, check if they follow this user
        if (req.user) {
            sql += `,
                (SELECT COUNT(*) FROM follows WHERE follower_id = ? AND following_id = ?) as is_following
            `;
            params.push(req.user.id, id);
        }

        sql += ' FROM users WHERE id = ?';
        params.push(id);

        const users = await query(sql, params);

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: users[0] });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// Get current user profile
router.get('/me/profile', authenticate, async (req, res) => {
    try {
        const users = await query(`
            SELECT 
                id, name, email, avatar, bio, trading_style, experience_level, portfolio_link, created_at,
                (SELECT COUNT(*) FROM posts WHERE user_id = ?) as posts_count,
                (SELECT COUNT(*) FROM follows WHERE following_id = ?) as followers_count,
                (SELECT COUNT(*) FROM follows WHERE follower_id = ?) as following_count
            FROM users 
            WHERE id = ?
        `, [req.user.id, req.user.id, req.user.id, req.user.id]);

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: users[0] });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Update user profile
router.put('/me/profile', authenticate, async (req, res) => {
    try {
        const { name, bio, trading_style, experience_level, portfolio_link, avatar } = req.body;

        await query(
            `UPDATE users 
             SET name = COALESCE(?, name),
                 bio = COALESCE(?, bio),
                 trading_style = COALESCE(?, trading_style),
                 experience_level = COALESCE(?, experience_level),
                 portfolio_link = COALESCE(?, portfolio_link),
                 avatar = COALESCE(?, avatar)
             WHERE id = ?`,
            [name, bio, trading_style, experience_level, portfolio_link, avatar, req.user.id]
        );

        // Get updated user
        const users = await query(
            'SELECT id, name, email, avatar, bio, trading_style, experience_level, portfolio_link FROM users WHERE id = ?',
            [req.user.id]
        );

        res.json({
            message: 'Profile updated successfully',
            user: users[0]
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Get user's posts
router.get('/:id/posts', async (req, res) => {
    try {
        const { id } = req.params;
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;

        const posts = await query(`
            SELECT 
                p.*,
                u.name as user_name,
                u.avatar as user_avatar,
                (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
                (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.user_id = ?
            ORDER BY p.created_at DESC
            LIMIT ${limit} OFFSET ${offset}
        `, [id]);

        res.json({ posts });
    } catch (error) {
        console.error('Get user posts error:', error);
        res.status(500).json({ error: 'Failed to fetch user posts' });
    }
});

// Get user's followers
router.get('/:id/followers', async (req, res) => {
    try {
        const { id } = req.params;
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;

        const followers = await query(`
            SELECT 
                u.id, u.name, u.email, u.avatar, u.trading_style, u.experience_level,
                f.created_at as followed_at
            FROM follows f
            JOIN users u ON f.follower_id = u.id
            WHERE f.following_id = ?
            ORDER BY f.created_at DESC
            LIMIT ${limit} OFFSET ${offset}
        `, [id]);

        res.json({ followers });
    } catch (error) {
        console.error('Get followers error:', error);
        res.status(500).json({ error: 'Failed to fetch followers' });
    }
});

// Get user's following
router.get('/:id/following', async (req, res) => {
    try {
        const { id } = req.params;
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;

        const following = await query(`
            SELECT 
                u.id, u.name, u.email, u.avatar, u.trading_style, u.experience_level,
                f.created_at as followed_at
            FROM follows f
            JOIN users u ON f.following_id = u.id
            WHERE f.follower_id = ?
            ORDER BY f.created_at DESC
            LIMIT ${limit} OFFSET ${offset}
        `, [id]);

        res.json({ following });
    } catch (error) {
        console.error('Get following error:', error);
        res.status(500).json({ error: 'Failed to fetch following' });
    }
});

module.exports = router;
