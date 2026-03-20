// Authentication Routes
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user.id, 
            email: user.email, 
            name: user.name 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

// Register new user
router.post('/register', [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password, trading_style, experience_level } = req.body;

        // Check if user already exists
        const existingUser = await query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({
                error: 'Email already registered'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const result = await query(
            `INSERT INTO users (name, email, password, trading_style, experience_level) 
             VALUES (?, ?, ?, ?, ?)`,
            [name, email, hashedPassword, trading_style || null, experience_level || null]
        );

        // Generate token
        const user = {
            id: result.insertId,
            name,
            email
        };
        const token = generateToken(user);

        res.status(201).json({
            message: 'Registration successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            error: 'Registration failed'
        });
    }
});

// Login user
router.post('/login', [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Find user
        const users = await query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                error: 'Invalid email or password'
            });
        }

        const user = users[0];

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                error: 'Invalid email or password'
            });
        }

        // Generate token
        const token = generateToken(user);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                trading_style: user.trading_style,
                experience_level: user.experience_level
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Login failed'
        });
    }
});

// Google OAuth login (simplified - implement passport-google-oauth20 later)
router.post('/google', async (req, res) => {
    try {
        const { google_id, email, name, avatar } = req.body;

        if (!google_id || !email || !name) {
            return res.status(400).json({
                error: 'Missing required Google OAuth data'
            });
        }

        // Check if user exists
        let users = await query(
            'SELECT * FROM users WHERE google_id = ? OR email = ?',
            [google_id, email]
        );

        let user;

        if (users.length === 0) {
            // Create new user
            const result = await query(
                `INSERT INTO users (name, email, google_id, avatar) 
                 VALUES (?, ?, ?, ?)`,
                [name, email, google_id, avatar || null]
            );
            user = {
                id: result.insertId,
                name,
                email,
                google_id,
                avatar
            };
        } else {
            user = users[0];
            // Update google_id if not set
            if (!user.google_id) {
                await query(
                    'UPDATE users SET google_id = ? WHERE id = ?',
                    [google_id, user.id]
                );
            }
        }

        // Generate token
        const token = generateToken(user);

        res.json({
            message: 'Google login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar
            }
        });
    } catch (error) {
        console.error('Google OAuth error:', error);
        res.status(500).json({
            error: 'Google authentication failed'
        });
    }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database
        const users = await query(
            'SELECT id, name, email, avatar, trading_style, experience_level FROM users WHERE id = ?',
            [decoded.id]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }

        res.json({
            valid: true,
            user: users[0]
        });
    } catch (error) {
        res.status(401).json({
            valid: false,
            error: 'Invalid token'
        });
    }
});

module.exports = router;
