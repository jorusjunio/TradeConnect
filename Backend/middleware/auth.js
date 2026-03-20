// Authentication Middleware
const jwt = require('jsonwebtoken');

// Verify JWT token
const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'No token provided. Authorization header must be in format: Bearer [token]'
            });
        }

        // Extract token
        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Attach user info to request
        req.user = {
            id: decoded.id,
            email: decoded.email,
            name: decoded.name
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Invalid token'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expired. Please login again'
            });
        }
        return res.status(500).json({
            error: 'Authentication error'
        });
    }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            req.user = {
                id: decoded.id,
                email: decoded.email,
                name: decoded.name
            };
        }
        
        next();
    } catch (error) {
        // If token is invalid, continue without user info
        next();
    }
};

module.exports = {
    authenticate,
    optionalAuth
};
