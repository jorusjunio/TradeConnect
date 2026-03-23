// Comments Routes
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { query } = require('../config/database');
const { body, validationResult } = require('express-validator');

// Get comments for a post
router.get('/post/:postId', async (req, res) => {
    try {
        const { postId } = req.params;
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;

        const comments = await query(`
            SELECT 
                c.*,
                u.name as user_name,
                u.avatar as user_avatar,
                u.trading_style
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.post_id = ?
            ORDER BY c.created_at DESC
            LIMIT ${limit} OFFSET ${offset}
        `, [postId]);

        res.json({ comments });
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

// Create comment
router.post('/', authenticate, [
    body('post_id').isInt().withMessage('Valid post ID is required'),
    body('content').trim().notEmpty().withMessage('Content is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { post_id, content } = req.body;

        // Check if post exists
        const posts = await query('SELECT id FROM posts WHERE id = ?', [post_id]);
        if (posts.length === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // Create comment
        const result = await query(
            'INSERT INTO comments (user_id, post_id, content) VALUES (?, ?, ?)',
            [req.user.id, post_id, content]
        );

        // Get created comment with user info
        const comments = await query(`
            SELECT 
                c.*,
                u.name as user_name,
                u.avatar as user_avatar,
                u.trading_style
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = ?
        `, [result.insertId]);

        res.status(201).json({
            message: 'Comment created successfully',
            comment: comments[0]
        });
    } catch (error) {
        console.error('Create comment error:', error);
        res.status(500).json({ error: 'Failed to create comment' });
    }
});

// Update comment
router.put('/:id', authenticate, [
    body('content').trim().notEmpty().withMessage('Content is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { content } = req.body;

        // Check if comment exists and belongs to user
        const comments = await query('SELECT * FROM comments WHERE id = ?', [id]);
        if (comments.length === 0) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        if (comments[0].user_id !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to update this comment' });
        }

        // Update comment
        await query('UPDATE comments SET content = ? WHERE id = ?', [content, id]);

        // Get updated comment
        const updatedComments = await query(`
            SELECT 
                c.*,
                u.name as user_name,
                u.avatar as user_avatar
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = ?
        `, [id]);

        res.json({
            message: 'Comment updated successfully',
            comment: updatedComments[0]
        });
    } catch (error) {
        console.error('Update comment error:', error);
        res.status(500).json({ error: 'Failed to update comment' });
    }
});

// Delete comment
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if comment exists and belongs to user
        const comments = await query('SELECT * FROM comments WHERE id = ?', [id]);
        if (comments.length === 0) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        if (comments[0].user_id !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to delete this comment' });
        }

        // Delete comment
        await query('DELETE FROM comments WHERE id = ?', [id]);

        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ error: 'Failed to delete comment' });
    }
});

module.exports = router;
