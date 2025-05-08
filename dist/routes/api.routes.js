"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const typeorm_1 = require("typeorm");
const User_1 = require("../entity/User");
const Product_1 = require("../entity/Product");
const Review_1 = require("../entity/Review");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const router = express_1.default.Router();
// VULNERABILITY: No file type validation, allows any file to be uploaded
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path_1.default.join(__dirname, '../public/uploads'));
    },
    filename: (req, file, cb) => {
        // VULNERABILITY: Doesn't sanitize filenames, allowing path traversal
        cb(null, file.originalname);
    }
});
const upload = (0, multer_1.default)({ storage });
// VULNERABILITY: No authentication required for API
// Get all users - sensitive information exposure
router.get('/users', async (req, res) => {
    try {
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const users = await userRepository.find();
        // VULNERABILITY: Exposing sensitive information
        res.json(users); // Includes passwords, credit card info, etc.
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Get user by ID with filter parameter for SQL Injection
router.get('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { filter } = req.query;
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        // VULNERABILITY: SQL Injection via filter parameter
        let query = `SELECT * FROM user WHERE id = ${id}`;
        if (filter) {
            // VULNERABILITY: Direct concatenation of unvalidated user input
            query += ` AND ${filter}`;
        }
        const user = await userRepository.query(query);
        res.json(user[0] || { error: 'User not found' });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Search products - Demonstrates XSS and data filtering vulnerabilities
router.get('/products/search', async (req, res) => {
    try {
        const { query } = req.query;
        const productRepository = (0, typeorm_1.getRepository)(Product_1.Product);
        // VULNERABILITY: Unescaped query could lead to SQL injection
        const products = await productRepository.query(`SELECT * FROM product WHERE name LIKE '%${query}%' OR description LIKE '%${query}%'`);
        res.json(products);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Add a new product - demonstrates CSRF vulnerability
router.post('/products', async (req, res) => {
    try {
        // VULNERABILITY: No CSRF token validation
        const { name, description, price, stock } = req.body;
        const productRepository = (0, typeorm_1.getRepository)(Product_1.Product);
        const product = new Product_1.Product();
        product.name = name;
        product.description = description; // VULNERABILITY: Unsanitized input stored (Stored XSS)
        product.price = price;
        product.stock = stock;
        product.isPublished = true;
        await productRepository.save(product);
        res.status(201).json(product);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Add a review - demonstrates stored XSS
router.post('/products/:id/reviews', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, content, rating } = req.body;
        // VULNERABILITY: No sanitization of user content (Stored XSS)
        const reviewRepository = (0, typeorm_1.getRepository)(Review_1.Review);
        const review = new Review_1.Review();
        review.userId = userId;
        review.productId = parseInt(id);
        review.content = content; // VULNERABILITY: Raw content stored without sanitization
        review.rating = rating;
        await reviewRepository.save(review);
        res.status(201).json(review);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// File upload endpoint - demonstrates file upload vulnerabilities
router.post('/upload', upload.single('file'), (req, res) => {
    try {
        // VULNERABILITY: Doesn't validate file type/content
        // VULNERABILITY: Doesn't limit file size
        // VULNERABILITY: Uses original filename without sanitization
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        // VULNERABILITY: Path traversal via manipulated filenames possible
        const fileUrl = `/uploads/${req.file.filename}`;
        res.json({
            success: true,
            file: fileUrl,
            message: 'File uploaded successfully'
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// VULNERABILITY: Insecure deserialization
router.post('/import-data', (req, res) => {
    try {
        const { data } = req.body;
        // VULNERABILITY: Unsafe eval of user input data
        // This could allow remote code execution
        const importedData = eval('(' + data + ')');
        res.json({
            success: true,
            message: 'Data imported',
            count: importedData.length
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Update user profile - IDOR vulnerability
router.put('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        // VULNERABILITY: IDOR (Insecure Direct Object Reference)
        // No verification that the logged-in user owns this profile
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        await userRepository.update(id, updates);
        const updatedUser = await userRepository.findOne({ where: { id: parseInt(id) } });
        res.json(updatedUser);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
