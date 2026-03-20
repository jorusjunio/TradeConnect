// Follows Routes
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { query } = require('../config/database');

// Follow a user
router.post('/:userId', authenticate, async (req, res) => {
    try {
        const { userId } = req.params;
        const followerId = req.user.id;

        // Can't follow yourself
        if (parseInt(userId) === followerId) {
            return res.status(400).json({ error: 'Cannot follow yourself' });
        }

        // Check if user exists
        const users = await query('SELECT id FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if already following
        const existing = await query(
            'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
            [followerId, userId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Already following this user' });
        }

        // Create follow
        await query(
            'INSERT INTO follows (follower_id, following_id) VALUES (?, ?)',
            [followerId, userId]
        );

        res.status(201).json({
            message: 'Successfully followed user',
            following: true
        });
    } catch (error) {
        console.error('Follow error:', error);
        res.status(500).json({ error: 'Failed to follow user' });
    }
});

// Unfollow a user
router.delete('/:userId', authenticate, async (req, res) => {
    try {
        const { userId } = req.params;
        const followerId = req.user.id;

        // Check if follow exists
        const follows = await query(
            'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
            [followerId, userId]
        );

        if (follows.length === 0) {
            return res.status(404).json({ error: 'Not following this user' });
        }

        // Delete follow
        await query(
            'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
            [followerId, userId]
        );

        res.json({
            message: 'Successfully unfollowed user',
            following: false
        });
    } catch (error) {
        console.error('Unfollow error:', error);
        res.status(500).json({ error: 'Failed to unfollow user' });
    }
});

// Check if following a user
router.get('/check/:userId', authenticate, async (req, res) => {
    try {
        const { userId } = req.params;
        const followerId = req.user.id;

        const follows = await query(
            'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
            [followerId, userId]
        );

        res.json({
            following: follows.length > 0
        });
    } catch (error) {
        console.error('Check follow error:', error);
        res.status(500).json({ error: 'Failed to check follow status' });
    }
});

module.exports = router;
