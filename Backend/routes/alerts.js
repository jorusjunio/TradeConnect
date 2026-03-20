// Trade Alerts Routes (Optional Feature)
const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../middleware/auth');
const { query } = require('../config/database');
const { body, validationResult } = require('express-validator');

// Get all alerts (public)
router.get('/', optionalAuth, async (req, res) => {
    try {
        const { market, status, limit = 50, offset = 0 } = req.query;

        let sql = `
            SELECT 
                a.*,
                u.name as user_name,
                u.avatar as user_avatar,
                u.trading_style
            FROM trade_alerts a
            JOIN users u ON a.user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (market) {
            sql += ' AND a.market = ?';
            params.push(market);
        }

        if (status) {
            sql += ' AND a.status = ?';
            params.push(status);
        } else {
            // Default to active alerts
            sql += ' AND a.status = ?';
            params.push('active');
        }

        sql += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const alerts = await query(sql, params);

        res.json({ alerts });
    } catch (error) {
        console.error('Get alerts error:', error);
        res.status(500).json({ error: 'Failed to fetch alerts' });
    }
});

// Get user's alerts
router.get('/me', authenticate, async (req, res) => {
    try {
        const { status, limit = 50, offset = 0 } = req.query;

        let sql = `
            SELECT * FROM trade_alerts 
            WHERE user_id = ?
        `;
        const params = [req.user.id];

        if (status) {
            sql += ' AND status = ?';
            params.push(status);
        }

        sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const alerts = await query(sql, params);

        res.json({ alerts });
    } catch (error) {
        console.error('Get my alerts error:', error);
        res.status(500).json({ error: 'Failed to fetch your alerts' });
    }
});

// Get single alert
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const alerts = await query(`
            SELECT 
                a.*,
                u.name as user_name,
                u.avatar as user_avatar,
                u.trading_style
            FROM trade_alerts a
            JOIN users u ON a.user_id = u.id
            WHERE a.id = ?
        `, [id]);

        if (alerts.length === 0) {
            return res.status(404).json({ error: 'Alert not found' });
        }

        res.json({ alert: alerts[0] });
    } catch (error) {
        console.error('Get alert error:', error);
        res.status(500).json({ error: 'Failed to fetch alert' });
    }
});

// Create alert
router.post('/', authenticate, [
    body('market').trim().notEmpty().withMessage('Market is required'),
    body('alert_type').trim().notEmpty().withMessage('Alert type is required'),
    body('description').trim().notEmpty().withMessage('Description is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { market, alert_type, description } = req.body;

        const result = await query(
            `INSERT INTO trade_alerts (user_id, market, alert_type, description, status) 
             VALUES (?, ?, ?, ?, ?)`,
            [req.user.id, market, alert_type, description, 'active']
        );

        // Get created alert
        const alerts = await query(`
            SELECT 
                a.*,
                u.name as user_name,
                u.avatar as user_avatar
            FROM trade_alerts a
            JOIN users u ON a.user_id = u.id
            WHERE a.id = ?
        `, [result.insertId]);

        res.status(201).json({
            message: 'Alert created successfully',
            alert: alerts[0]
        });
    } catch (error) {
        console.error('Create alert error:', error);
        res.status(500).json({ error: 'Failed to create alert' });
    }
});

// Update alert
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { market, alert_type, description, status } = req.body;

        // Check if alert exists and belongs to user
        const alerts = await query('SELECT * FROM trade_alerts WHERE id = ?', [id]);
        if (alerts.length === 0) {
            return res.status(404).json({ error: 'Alert not found' });
        }
        if (alerts[0].user_id !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to update this alert' });
        }

        // Update alert
        await query(
            `UPDATE trade_alerts 
             SET market = COALESCE(?, market),
                 alert_type = COALESCE(?, alert_type),
                 description = COALESCE(?, description),
                 status = COALESCE(?, status)
             WHERE id = ?`,
            [market, alert_type, description, status, id]
        );

        // Get updated alert
        const updatedAlerts = await query(`
            SELECT 
                a.*,
                u.name as user_name,
                u.avatar as user_avatar
            FROM trade_alerts a
            JOIN users u ON a.user_id = u.id
            WHERE a.id = ?
        `, [id]);

        res.json({
            message: 'Alert updated successfully',
            alert: updatedAlerts[0]
        });
    } catch (error) {
        console.error('Update alert error:', error);
        res.status(500).json({ error: 'Failed to update alert' });
    }
});

// Delete alert
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if alert exists and belongs to user
        const alerts = await query('SELECT * FROM trade_alerts WHERE id = ?', [id]);
        if (alerts.length === 0) {
            return res.status(404).json({ error: 'Alert not found' });
        }
        if (alerts[0].user_id !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to delete this alert' });
        }

        // Delete alert
        await query('DELETE FROM trade_alerts WHERE id = ?', [id]);

        res.json({ message: 'Alert deleted successfully' });
    } catch (error) {
        console.error('Delete alert error:', error);
        res.status(500).json({ error: 'Failed to delete alert' });
    }
});

module.exports = router;
