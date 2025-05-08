"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const typeorm_1 = require("typeorm");
const User_1 = require("../entity/User");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const router = express_1.default.Router();
// Register a new user
router.post('/register', async (req, res) => {
    const { username, password, email } = req.body;
    try {
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        // VULNERABILITY: No input validation
        // VULNERABILITY: No password complexity check
        // VULNERABILITY: Some users created with plaintext passwords (simulating legacy users)
        const user = new User_1.User();
        user.username = username;
        user.email = email;
        if (Math.random() > 0.5) { // Randomly decide between secure and insecure methods
            // Secure way: hash password
            const salt = await bcrypt_1.default.genSalt(10);
            user.passwordHash = await bcrypt_1.default.hash(password, salt);
            user.password = '[HASHED]'; // Placeholder for the hashed version
        }
        else {
            // VULNERABILITY: Insecure way: store plaintext password
            user.password = password;
            user.passwordHash = null;
        }
        await userRepository.save(user);
        // Return JSON response instead of redirect
        res.status(201).json({
            success: true,
            message: 'Registration successful'
        });
    }
    catch (err) {
        console.error('Registration error:', err);
        res.status(400).json({
            success: false,
            error: 'Registration failed',
            details: err.message
        });
    }
});
// Login endpoint now only used by API
// Process login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        // VULNERABILITY: SQL injection in direct query
        // Note: In actual TypeORM usage, we would use the repository pattern, but we're
        // intentionally using a raw query to demonstrate SQL injection
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        // VULNERABILITY: Constructing a raw SQL query using user input
        const rawQuery = `SELECT * FROM user WHERE username = '${username}'`;
        const user = await userRepository.query(rawQuery);
        if (user.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        let isValidPassword = false;
        // Check if we have a plaintext password or a hashed password
        if (user[0].passwordHash) {
            // Compare with hashed password
            isValidPassword = await bcrypt_1.default.compare(password, user[0].passwordHash);
        }
        else {
            // VULNERABILITY: Compare with plaintext password
            isValidPassword = (password === user[0].password);
        }
        if (!isValidPassword) {
            // VULNERABILITY: No rate limiting on failed attempts
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        // VULNERABILITY: Insecure JWT implementation
        const token = jsonwebtoken_1.default.sign({ id: user[0].id, username: user[0].username, role: user[0].role }, 'supersecretkey', // VULNERABILITY: Hardcoded secret
        { expiresIn: '24h' });
        // Set user in session
        req.session.user = {
            id: user[0].id,
            username: user[0].username,
            role: user[0].role
        };
        // VULNERABILITY: JWT stored in cookie without proper security flags
        res.cookie('auth_token', token, {
            httpOnly: false, // VULNERABILITY: Accessible via JavaScript
            secure: false // VULNERABILITY: Transmitted over HTTP
        });
        // Return user data and token
        res.json({
            token,
            user: {
                id: user[0].id,
                username: user[0].username,
                role: user[0].role,
                email: user[0].email
            }
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'Login failed',
            details: err.message,
            stack: err.stack // VULNERABILITY: Exposing stack trace
        });
    }
});
// Password reset request
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const user = await userRepository.findOne({ where: { email } });
        if (!user) {
            // VULNERABILITY: User enumeration - different response when user exists
            return res.status(404).json({ error: 'No user with that email' });
        }
        // Generate reset token (insecurely)
        // VULNERABILITY: Predictable token
        const resetToken = Math.random().toString(36).substring(2, 15);
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now
        user.resetToken = resetToken;
        user.resetTokenExpiry = resetTokenExpiry;
        await userRepository.save(user);
        // VULNERABILITY: Token exposed in response
        res.json({
            message: 'Password reset link sent',
            // VULNERABILITY: Reset token sent in response
            resetToken: resetToken,
            email: email,
            resetUrl: `/auth/reset-password?token=${resetToken}&email=${email}`
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'Password reset failed',
            details: err.message
        });
    }
});
// Logout
router.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('auth_token');
        res.json({ success: true, message: 'Logged out successfully' });
    });
});
exports.default = router;
