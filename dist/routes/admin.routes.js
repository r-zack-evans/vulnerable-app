"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const typeorm_1 = require("typeorm");
const User_1 = require("../entity/User");
const Product_1 = require("../entity/Product");
const auth_1 = require("../middleware/auth");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const router = express_1.default.Router();
// Admin dashboard
router.get('/dashboard', auth_1.checkAdmin, async (req, res) => {
    try {
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const productRepository = (0, typeorm_1.getRepository)(Product_1.Product);
        const users = await userRepository.find();
        const products = await productRepository.find();
        res.json({
            user: req.session.user,
            users,
            products,
            totalUsers: users.length,
            totalProducts: products.length
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Server error', message: err.message, stack: err.stack });
    }
});
// Manage users
router.get('/users', auth_1.checkAdmin, async (req, res) => {
    try {
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const users = await userRepository.find();
        res.json({
            user: req.session.user,
            users
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Server error', message: err.message, stack: err.stack });
    }
});
// Edit user form
router.get('/users/:id/edit', auth_1.checkAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const user = await userRepository.findOne({ where: { id: parseInt(id) } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            user: req.session.user,
            editUser: user
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Server error', message: err.message, stack: err.stack });
    }
});
// Update user
router.post('/users/:id', auth_1.checkAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, role } = req.body;
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const user = await userRepository.findOne({ where: { id: parseInt(id) } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // VULNERABILITY: No input validation
        user.username = username;
        user.email = email;
        user.role = role;
        await userRepository.save(user);
        res.status(200).json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: 'Server error', message: err.message, stack: err.stack });
    }
});
// Delete user
router.post('/users/:id/delete', auth_1.checkAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        await userRepository.delete(id);
        res.status(200).json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: 'Server error', message: err.message, stack: err.stack });
    }
});
// File browser - dangerous functionality
router.get('/files', auth_1.checkAdmin, (req, res) => {
    try {
        const dirPath = req.query.path ? String(req.query.path) : '/';
        // VULNERABILITY: Directory traversal
        // This allows browsing any directory on the server
        const actualPath = path_1.default.resolve(dirPath);
        const files = fs_1.default.readdirSync(actualPath).map(file => {
            const filePath = path_1.default.join(actualPath, file);
            const stats = fs_1.default.statSync(filePath);
            return {
                name: file,
                path: filePath,
                isDirectory: stats.isDirectory(),
                size: stats.size,
                modified: stats.mtime
            };
        });
        res.json({
            user: req.session.user,
            files,
            currentPath: actualPath
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Server error', message: err.message, stack: err.stack });
    }
});
// Execute system commands - dangerous
router.post('/execute', auth_1.checkAdmin, (req, res) => {
    try {
        const { command } = req.body;
        // VULNERABILITY: Command injection
        // This executes arbitrary system commands
        const { execSync } = require('child_process');
        const output = execSync(command).toString();
        res.json({
            user: req.session.user,
            command,
            output
        });
    }
    catch (err) {
        res.json({
            user: req.session.user,
            command: req.body.command,
            error: err.message
        });
    }
});
// View system info - dangerous
router.get('/execute', auth_1.checkAdmin, (req, res) => {
    res.json({ user: req.session.user });
});
// Config editor - dangerous
router.get('/config', auth_1.checkAdmin, (req, res) => {
    try {
        // VULNERABILITY: Hardcoded path to a sensitive file
        const configPath = path_1.default.join(__dirname, '../../config.json');
        // Create config file if it doesn't exist
        if (!fs_1.default.existsSync(configPath)) {
            const defaultConfig = {
                app: {
                    name: 'Vulnerable Demo App',
                    debug: true
                },
                database: {
                    host: 'localhost',
                    username: 'admin',
                    password: 'password123' // VULNERABILITY: Hardcoded credentials
                },
                smtp: {
                    host: 'smtp.example.com',
                    port: 587,
                    username: 'user@example.com',
                    password: 'emailpassword' // VULNERABILITY: Hardcoded credentials
                }
            };
            fs_1.default.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
        }
        const configContent = fs_1.default.readFileSync(configPath, 'utf8');
        res.json({
            user: req.session.user,
            config: configContent
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Server error', message: err.message, stack: err.stack });
    }
});
// Save config
router.post('/config', auth_1.checkAdmin, (req, res) => {
    try {
        const { config } = req.body;
        // VULNERABILITY: No validation of config JSON
        // VULNERABILITY: Writing user input directly to a file
        const configPath = path_1.default.join(__dirname, '../../config.json');
        fs_1.default.writeFileSync(configPath, config);
        res.json({
            user: req.session.user,
            config,
            message: 'Configuration saved successfully'
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Server error', message: err.message, stack: err.stack });
    }
});
exports.default = router;
