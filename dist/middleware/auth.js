"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.checkAdmin = exports.checkAuth = void 0;
// Middleware to check if user is authenticated
const checkAuth = async (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/auth/login?message=You must be logged in');
    }
    // VULNERABILITY: No session validation against database
    // This means if a user is deleted or role is changed, the session still works
    // We're not verifying that the user in the session still exists or has the same role
    next();
};
exports.checkAuth = checkAuth;
// Middleware to check if user is an admin
const checkAdmin = async (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/auth/login?message=You must be logged in');
    }
    // VULNERABILITY: Weak role check
    // VULNERABILITY: No validation against database
    if (req.session.user.role !== 'admin') {
        // VULNERABILITY: Information disclosure in error message
        return res.status(403).render('error', {
            message: 'Access denied. You need admin privileges.',
            // This error reveals that an admin route exists
            error: new Error('Route /admin/* requires admin role')
        });
    }
    next();
};
exports.checkAdmin = checkAdmin;
// VULNERABILITY: Missing CSRF protection middleware
// VULNERABILITY: Missing rate limiting middleware
// VULNERABILITY: Missing XSS protection middleware
// JWT verification middleware - demonstrates weak JWT implementation
const verifyToken = (req, res, next) => {
    const token = req.cookies.auth_token;
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    try {
        // VULNERABILITY: Using hardcoded secret
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, 'supersecretkey');
        // VULNERABILITY: Not checking token expiration
        // VULNERABILITY: Not validating user still exists
        req.user = decoded;
        next();
    }
    catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};
exports.verifyToken = verifyToken;
