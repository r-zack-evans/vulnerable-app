"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const typeorm_1 = require("typeorm");
const User_1 = require("../entity/User");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Set up multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path_1.default.join(__dirname, '../public/uploads/profiles'));
    },
    filename: (req, file, cb) => {
        // VULNERABILITY: Original filename used without sanitization
        cb(null, file.originalname);
    }
});
const upload = (0, multer_1.default)({ storage });
// Display user profile
router.get('/profile', auth_1.checkAuth, async (req, res) => {
    try {
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const user = await userRepository.findOne({ where: { id: req.session.user.id } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user });
    }
    catch (err) {
        res.status(500).json({ error: 'Server error', message: err.message, stack: err.stack });
    }
});
// Update user profile
router.post('/profile', auth_1.checkAuth, upload.single('profilePicture'), async (req, res) => {
    try {
        const { username, email, theme, notifications } = req.body;
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const user = await userRepository.findOne({ where: { id: req.session.user.id } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // VULNERABILITY: No validation on inputs
        user.username = username;
        user.email = email;
        // Update preferences
        user.preferences = {
            theme: theme || 'light',
            notifications: notifications === 'on',
            dashboardLayout: req.body.dashboardLayout || 'default'
        };
        // Update profile picture if uploaded
        if (req.file) {
            // VULNERABILITY: No file type validation
            user.profilePicture = `/uploads/profiles/${req.file.filename}`;
        }
        await userRepository.save(user);
        // Update session data
        req.session.user = {
            id: user.id,
            username: user.username,
            role: user.role
        };
        res.status(200).json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: 'Server error', message: err.message, stack: err.stack });
    }
});
// Display user settings
router.get('/settings', auth_1.checkAuth, (req, res) => {
    res.json({ user: req.session.user });
});
// Update user settings
router.post('/settings', auth_1.checkAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword, creditCardNumber } = req.body;
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const user = await userRepository.findOne({ where: { id: req.session.user.id } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // VULNERABILITY: Weak password requirements - no length or complexity check
        // VULNERABILITY: Credit card stored in plaintext
        if (creditCardNumber) {
            user.creditCardNumber = creditCardNumber;
        }
        if (currentPassword && newPassword) {
            // Check current password
            let passwordValid = false;
            if (user.passwordHash) {
                // Using hashed password
                const bcrypt = require('bcrypt');
                passwordValid = await bcrypt.compare(currentPassword, user.passwordHash);
            }
            else {
                // Using plaintext password
                passwordValid = (currentPassword === user.password);
            }
            if (!passwordValid) {
                return res.json({
                    user: req.session.user,
                    error: 'Current password is incorrect'
                });
            }
            // Update to new password
            const bcrypt = require('bcrypt');
            const salt = await bcrypt.genSalt(10);
            user.passwordHash = await bcrypt.hash(newPassword, salt);
            user.password = '[HASHED]'; // Placeholder for the hashed version
        }
        await userRepository.save(user);
        res.json({
            user: req.session.user,
            message: 'Settings updated successfully'
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Server error', message: err.message, stack: err.stack });
    }
});
// View other user profiles (IDOR vulnerability)
router.get('/view/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // VULNERABILITY: IDOR (Insecure Direct Object Reference)
        // No proper authorization, any user can view any other user's profile
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const user = await userRepository.findOne({ where: { id: parseInt(id) } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // VULNERABILITY: Exposing sensitive information
        res.json({ profile: user, currentUser: req.session.user });
    }
    catch (err) {
        res.status(500).json({ error: 'Server error', message: err.message, stack: err.stack });
    }
});
exports.default = router;
