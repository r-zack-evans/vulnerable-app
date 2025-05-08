"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const typeorm_1 = require("typeorm");
const User_1 = require("../entity/User");
const Product_1 = require("../entity/Product");
const Project_1 = require("../entity/Project");
const Task_1 = require("../entity/Task");
const router = express_1.default.Router();
// VULNERABILITY: Hardcoded JWT secret
const JWT_SECRET = 'insecure_jwt_secret_for_demo_app';
// Authentication API
router.post('/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        // VULNERABILITY: SQL Injection via direct concatenation if typeORM didn't protect us
        // In a real world app, this would be vulnerable
        const user = await userRepository.findOne({ where: { username } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        // VULNERABILITY: Simplified auth (in a real app, we'd use proper password verification)
        // In a production app, we would use bcrypt.compare(password, user.passwordHash)
        // but for the demo, we're accepting any password
        // Generate JWT token
        // VULNERABILITY: Token has no expiration, and includes sensitive data
        const token = jsonwebtoken_1.default.sign({
            id: user.id,
            username: user.username,
            role: user.role,
            // VULNERABILITY: Including sensitive data in token
            email: user.email,
            creditCardNumber: user.creditCardNumber // Sensitive information
        }, JWT_SECRET);
        // Set session data as well (dual auth mechanism)
        req.session.user = {
            id: user.id,
            username: user.username,
            role: user.role
        };
        // VULNERABILITY: Exposing all user data including sensitive fields
        return res.json({
            id: user.id,
            username: user.username,
            role: user.role,
            email: user.email,
            token,
            // VULNERABILITY: Information disclosure
            creditCardNumber: user.creditCardNumber,
            passwordHash: user.passwordHash // Exposing password hash
        });
    }
    catch (err) {
        console.error(err);
        // VULNERABILITY: Detailed error exposure
        return res.status(500).json({
            error: 'An error occurred during login',
            details: err.message, // Exposing detailed error info
            stack: err.stack // Exposing stack trace
        });
    }
});
// User Registration
router.post('/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        // VULNERABILITY: No input validation
        // Missing checks for username uniqueness, email format, password strength
        const newUser = new User_1.User();
        newUser.username = username;
        newUser.email = email;
        // VULNERABILITY: Storing plaintext password in db
        newUser.password = password;
        // VULNERABILITY: Weak hashing (in a real implementation, this would use a higher cost factor)
        newUser.passwordHash = await bcrypt_1.default.hash(password, 5);
        newUser.role = 'user';
        await userRepository.save(newUser);
        const token = jsonwebtoken_1.default.sign({ id: newUser.id, username: newUser.username, role: newUser.role }, JWT_SECRET);
        return res.status(201).json({
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            token
        });
    }
    catch (err) {
        console.error(err);
        // VULNERABILITY: Detailed error exposure
        return res.status(500).json({
            error: 'Registration failed',
            details: err.message,
            stack: err.stack
        });
    }
});
// Projects API
// Get all projects
router.get('/projects', async (req, res) => {
    try {
        const projectRepository = (0, typeorm_1.getRepository)(Project_1.Project);
        // Add proper ordering to always show most recently created projects first
        const projects = await projectRepository.find({
            order: {
                id: 'DESC' // Newest projects first
            }
        });
        console.log(`Fetched ${projects.length} projects from database`);
        return res.json(projects);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            error: 'An error occurred fetching projects',
            details: err.message,
            stack: err.stack
        });
    }
});
// Debug route to help diagnose API issues
router.get('/debug/routes', (req, res) => {
    const routes = [];
    // Extract all routes from the Express app
    function print(path, layer) {
        if (layer.route) {
            layer.route.stack.forEach(print.bind(null, path.concat(split(layer.route.path))));
        }
        else if (layer.name === 'router' && layer.handle.stack) {
            layer.handle.stack.forEach(print.bind(null, path.concat(split(layer.regexp))));
        }
        else if (layer.method) {
            routes.push(`${layer.method.toUpperCase()} ${path.concat(split(layer.regexp)).filter(Boolean).join('/')}`);
        }
    }
    function split(thing) {
        if (typeof thing === 'string')
            return thing.split('/');
        else if (thing.fast_slash)
            return '';
        else
            return thing.toString()
                .replace('\\/?', '')
                .replace('(?=\\/|$)', '$')
                .split('/');
    }
    require('express')()._router.stack.forEach(print.bind(null, []));
    return res.json({
        routeCount: routes.length,
        routes: routes
    });
});
// Get project by ID
router.get('/projects/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const projectRepository = (0, typeorm_1.getRepository)(Project_1.Project);
        // VULNERABILITY: No validation on id parameter
        const project = await projectRepository.findOne({ where: { id: Number(id) } });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        return res.json(project);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            error: 'An error occurred fetching the project',
            details: err.message,
            stack: err.stack
        });
    }
});
// Create project
router.post('/projects', async (req, res) => {
    try {
        const projectRepository = (0, typeorm_1.getRepository)(Project_1.Project);
        const newProject = projectRepository.create(req.body);
        await projectRepository.save(newProject);
        return res.status(201).json(newProject);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            error: 'An error occurred creating the project',
            details: err.message,
            stack: err.stack
        });
    }
});
// Update project with PUT
router.put('/projects/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const projectRepository = (0, typeorm_1.getRepository)(Project_1.Project);
        const project = await projectRepository.findOne({ where: { id: Number(id) } });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        // Update project with new data
        projectRepository.merge(project, req.body);
        const updatedProject = await projectRepository.save(project);
        console.log(`Updated project ID ${id}:`, updatedProject);
        return res.json(updatedProject);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            error: 'An error occurred updating the project',
            details: err.message,
            stack: err.stack
        });
    }
});
// Update project with PATCH (alternative to PUT)
router.patch('/projects/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const projectRepository = (0, typeorm_1.getRepository)(Project_1.Project);
        const project = await projectRepository.findOne({ where: { id: Number(id) } });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        // Update project with new data
        projectRepository.merge(project, req.body);
        const updatedProject = await projectRepository.save(project);
        console.log(`Updated project ID ${id} with PATCH:`, updatedProject);
        return res.json(updatedProject);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            error: 'An error occurred updating the project',
            details: err.message,
            stack: err.stack
        });
    }
});
// Delete project
router.delete('/projects/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const projectRepository = (0, typeorm_1.getRepository)(Project_1.Project);
        const project = await projectRepository.findOne({ where: { id: Number(id) } });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        await projectRepository.remove(project);
        return res.status(204).send();
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            error: 'An error occurred deleting the project',
            details: err.message,
            stack: err.stack
        });
    }
});
// Get project tasks
router.get('/projects/:id/tasks', async (req, res) => {
    try {
        const { id } = req.params;
        const taskRepository = (0, typeorm_1.getRepository)(Task_1.Task);
        // VULNERABILITY: No validation on id parameter
        const tasks = await taskRepository.find({ where: { projectId: Number(id) } });
        return res.json(tasks);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            error: 'An error occurred fetching project tasks',
            details: err.message,
            stack: err.stack
        });
    }
});
// Create task for project
router.post('/projects/:id/tasks', async (req, res) => {
    try {
        const { id } = req.params;
        const projectRepository = (0, typeorm_1.getRepository)(Project_1.Project);
        const taskRepository = (0, typeorm_1.getRepository)(Task_1.Task);
        // VULNERABILITY: No validation on id parameter
        const project = await projectRepository.findOne({ where: { id: Number(id) } });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        // VULNERABILITY: Mass assignment, no validation
        const newTask = taskRepository.create({
            ...req.body,
            projectId: Number(id)
        });
        await taskRepository.save(newTask);
        return res.status(201).json(newTask);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            error: 'An error occurred creating the task',
            details: err.message,
            stack: err.stack
        });
    }
});
// Update task
router.put('/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const taskRepository = (0, typeorm_1.getRepository)(Task_1.Task);
        // VULNERABILITY: No validation on id parameter
        const task = await taskRepository.findOne({ where: { id: Number(id) } });
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        // VULNERABILITY: Mass assignment, no validation
        taskRepository.merge(task, req.body);
        const updatedTask = await taskRepository.save(task);
        return res.json(updatedTask);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            error: 'An error occurred updating the task',
            details: err.message,
            stack: err.stack
        });
    }
});
// Delete task
router.delete('/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const taskRepository = (0, typeorm_1.getRepository)(Task_1.Task);
        // VULNERABILITY: No validation on id parameter
        const task = await taskRepository.findOne({ where: { id: Number(id) } });
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        await taskRepository.remove(task);
        return res.status(204).send();
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            error: 'An error occurred deleting the task',
            details: err.message,
            stack: err.stack
        });
    }
});
// Tasks API
router.get('/tasks', async (req, res) => {
    try {
        const taskRepository = (0, typeorm_1.getRepository)(Task_1.Task);
        // VULNERABILITY: Missing pagination could lead to DOS in large datasets
        // VULNERABILITY: Not joining with Project to get project details
        const tasks = await taskRepository.find({
            order: {
                id: 'DESC' // Newest tasks first
            }
        });
        return res.json(tasks);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            error: 'An error occurred fetching tasks',
            details: err.message,
            stack: err.stack
        });
    }
});
// Get task by ID
router.get('/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const taskRepository = (0, typeorm_1.getRepository)(Task_1.Task);
        // VULNERABILITY: No validation on id parameter
        const task = await taskRepository.findOne({ where: { id: Number(id) } });
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        return res.json(task);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            error: 'An error occurred fetching the task',
            details: err.message,
            stack: err.stack
        });
    }
});
// Products API
router.get('/products', async (req, res) => {
    try {
        const productRepository = (0, typeorm_1.getRepository)(Product_1.Product);
        // VULNERABILITY: Missing pagination could lead to DOS in large datasets
        const products = await productRepository.find();
        return res.json(products);
    }
    catch (err) {
        console.error(err);
        // VULNERABILITY: Detailed error exposure
        return res.status(500).json({
            error: 'An error occurred fetching products',
            details: err.message,
            stack: err.stack
        });
    }
});
// Get single product
router.get('/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const productRepository = (0, typeorm_1.getRepository)(Product_1.Product);
        // VULNERABILITY: No validation on id parameter
        const product = await productRepository.findOne({ where: { id: Number(id) } });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        return res.json(product);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            error: 'An error occurred fetching the product',
            details: err.message,
            stack: err.stack
        });
    }
});
// Search products - vulnerable to injection
router.get('/products/search', async (req, res) => {
    try {
        const { query } = req.query;
        const productRepository = (0, typeorm_1.getRepository)(Product_1.Product);
        // VULNERABILITY: Potential SQL injection through direct query parameter usage
        // In a real app with raw queries this would be vulnerable
        const products = await productRepository
            .createQueryBuilder('product')
            .where('product.name LIKE :query OR product.description LIKE :query', { query: `%${query}%` }) // Vulnerable pattern in raw SQL
            .getMany();
        return res.json(products);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            error: 'An error occurred during search',
            details: err.message,
            stack: err.stack
        });
    }
});
// User Profile API
router.get('/users/profile', async (req, res) => {
    try {
        // VULNERABILITY: Not properly validating token, accepting both JWT and session
        const token = req.headers.authorization?.split(' ')[1];
        let userId;
        if (token) {
            // VULNERABILITY: No try/catch for token verification
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            userId = decoded.id;
        }
        else if (req.session.user) {
            userId = req.session.user.id;
        }
        else {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const user = await userRepository.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // VULNERABILITY: Information disclosure - returning all user data
        return res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            creditCardNumber: user.creditCardNumber, // Sensitive information
            resetToken: user.resetToken, // Sensitive information
            preferences: user.preferences // Possibly sensitive
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            error: 'An error occurred fetching user profile',
            details: err.message,
            stack: err.stack
        });
    }
});
// User Profile Update
router.put('/users/profile', async (req, res) => {
    try {
        // Get user ID from token or session
        const token = req.headers.authorization?.split(' ')[1];
        let userId;
        if (token) {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            userId = decoded.id;
        }
        else if (req.session.user) {
            userId = req.session.user.id;
        }
        else {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const user = await userRepository.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // VULNERABILITY: Mass assignment, allowing any field to be updated
        // including role, which could lead to privilege escalation
        Object.assign(user, req.body);
        await userRepository.save(user);
        return res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            error: 'An error occurred updating profile',
            details: err.message,
            stack: err.stack
        });
    }
});
// Admin API - Get all users
router.get('/admin/users', async (req, res) => {
    try {
        // VULNERABILITY: Weak authorization check
        // Only checking the role in JWT but not validating the JWT properly
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // VULNERABILITY: Not checking role properly, not validating against database
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        // VULNERABILITY: No pagination, potential DOS
        const users = await userRepository.find();
        // VULNERABILITY: Returning all user data including sensitive information
        return res.json(users);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            error: 'An error occurred fetching users',
            details: err.message,
            stack: err.stack
        });
    }
});
// Admin API - Delete user
router.delete('/admin/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // VULNERABILITY: Weak authorization check
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const user = await userRepository.findOne({ where: { id: Number(id) } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // VULNERABILITY: No confirmation, no audit logging, no additional security checks
        await userRepository.remove(user);
        return res.status(204).send();
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            error: 'An error occurred deleting the user',
            details: err.message,
            stack: err.stack
        });
    }
});
exports.default = router;
