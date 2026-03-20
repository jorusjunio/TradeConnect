// Posts Routes
const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../middleware/auth');
const { query } = require('../config/database');
const { body, validationResult } = require('express-validator');

// Get all posts (feed) - with optional authentication for personalized feed
router.get('/', optionalAuth, async (req, res) => {
    try {
        const { limit = 50, offset = 0, market_tag, user_id } = req.query;

        let sql = `
            SELECT 
                p.*,
                u.name as user_name,
                u.avatar as user_avatar,
                u.trading_style,
                (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
                (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
        `;

        // If user is authenticated, include whether they liked the post
        if (req.user) {
            sql += `,
                (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ?) as user_liked
            `;
        }

        sql += `
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE 1=1
        `;

        const params = req.user ? [req.user.id] : [];

        // Filter by market tag
        if (market_tag) {
            sql += ' AND p.market_tag = ?';
            params.push(market_tag);
        }

        // Filter by user
        if (user_id) {
            sql += ' AND p.user_id = ?';
            params.push(user_id);
        }

        sql += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const posts = await query(sql, params);

        res.json({
            posts,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                total: posts.length
            }
        });
    } catch (error) {
        console.error('Get posts error:', error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

// Get feed from followed users
router.get('/feed', authenticate, async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;

        const posts = await query(`
            SELECT 
                p.*,
                u.name as user_name,
                u.avatar as user_avatar,
                u.trading_style,
                (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
                (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
                (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ?) as user_liked
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.user_id IN (
                SELECT following_id FROM follows WHERE follower_id = ?
            )
            OR p.user_id = ?
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
        `, [req.user.id, req.user.id, req.user.id, parseInt(limit), parseInt(offset)]);

        res.json({
            posts,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    } catch (error) {
        console.error('Get feed error:', error);
        res.status(500).json({ error: 'Failed to fetch feed' });
    }
});

// Get single post
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const { id } = req.params;

        let sql = `
            SELECT 
                p.*,
                u.name as user_name,
                u.avatar as user_avatar,
                u.trading_style,
                (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
                (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
        `;

        const params = [id];

        if (req.user) {
            sql += `,
                (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ?) as user_liked
            `;
            params.unshift(req.user.id);
        }

        sql += `
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.id = ?
        `;

        const posts = await query(sql, params);

        if (posts.length === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }

        res.json({ post: posts[0] });
    } catch (error) {
        console.error('Get post error:', error);
        res.status(500).json({ error: 'Failed to fetch post' });
    }
});

// Create new post
router.post('/', authenticate, [
    body('content').trim().notEmpty().withMessage('Content is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { content, image_url, market_tag, strategy_tag } = req.body;

        const result = await query(
            `INSERT INTO posts (user_id, content, image_url, market_tag, strategy_tag) 
             VALUES (?, ?, ?, ?, ?)`,
            [req.user.id, content, image_url || null, market_tag || null, strategy_tag || null]
        );

        // Get the created post
        const posts = await query(`
            SELECT 
                p.*,
                u.name as user_name,
                u.avatar as user_avatar,
                u.trading_style,
                0 as likes_count,
                0 as comments_count
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.id = ?
        `, [result.insertId]);

        res.status(201).json({
            message: 'Post created successfully',
            post: posts[0]
        });
    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// Update post
router.put('/:id', authenticate, [
    body('content').trim().notEmpty().withMessage('Content is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { content, image_url, market_tag, strategy_tag } = req.body;

        // Check if post exists and belongs to user
        const posts = await query('SELECT * FROM posts WHERE id = ?', [id]);
        if (posts.length === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }
        if (posts[0].user_id !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to update this post' });
        }

        // Update post
        await query(
            `UPDATE posts 
             SET content = ?, image_url = ?, market_tag = ?, strategy_tag = ?
             WHERE id = ?`,
            [content, image_url || null, market_tag || null, strategy_tag || null, id]
        );

        // Get updated post
        const updatedPosts = await query(`
            SELECT 
                p.*,
                u.name as user_name,
                u.avatar as user_avatar,
                (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
                (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.id = ?
        `, [id]);

        res.json({
            message: 'Post updated successfully',
            post: updatedPosts[0]
        });
    } catch (error) {
        console.error('Update post error:', error);
        res.status(500).json({ error: 'Failed to update post' });
    }
});

// Delete post
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if post exists and belongs to user
        const posts = await query('SELECT * FROM posts WHERE id = ?', [id]);
        if (posts.length === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }
        if (posts[0].user_id !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to delete this post' });
        }

        // Delete post (cascade will delete likes and comments)
        await query('DELETE FROM posts WHERE id = ?', [id]);

        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

// Like/Unlike post
router.post('/:id/like', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if post exists
        const posts = await query('SELECT id FROM posts WHERE id = ?', [id]);
        if (posts.length === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // Check if already liked
        const likes = await query(
            'SELECT id FROM likes WHERE user_id = ? AND post_id = ?',
            [req.user.id, id]
        );

        if (likes.length > 0) {
            // Unlike
            await query('DELETE FROM likes WHERE user_id = ? AND post_id = ?', [req.user.id, id]);
            res.json({ message: 'Post unliked', liked: false });
        } else {
            // Like
            await query('INSERT INTO likes (user_id, post_id) VALUES (?, ?)', [req.user.id, id]);
            res.json({ message: 'Post liked', liked: true });
        }
    } catch (error) {
        console.error('Like/unlike error:', error);
        res.status(500).json({ error: 'Failed to like/unlike post' });
    }
});

module.exports = router;
