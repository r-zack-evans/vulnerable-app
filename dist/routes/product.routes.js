"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const typeorm_1 = require("typeorm");
const Product_1 = require("../entity/Product");
const Review_1 = require("../entity/Review");
const auth_1 = require("../middleware/auth");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const router = express_1.default.Router();
// Set up multer for product images
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path_1.default.join(__dirname, '../public/uploads/products'));
    },
    filename: (req, file, cb) => {
        // VULNERABILITY: Using original filename without sanitization
        cb(null, file.originalname);
    }
});
const upload = (0, multer_1.default)({ storage });
// List all products
router.get('/', async (req, res) => {
    try {
        const productRepository = (0, typeorm_1.getRepository)(Product_1.Product);
        const products = await productRepository.find({ where: { isPublished: true } });
        res.json({
            products,
            user: req.session.user ? {
                id: req.session.user.id,
                username: req.session.user.username,
                role: req.session.user.role
            } : null,
            query: req.query.q || ''
        });
    }
    catch (err) {
        res.status(500).json({ error: "Server error", message: err.message, stack: err.stack });
    }
});
// Search products
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        const productRepository = (0, typeorm_1.getRepository)(Product_1.Product);
        if (!q) {
            return res.json({ products: [], message: 'No search query provided' });
        }
        // VULNERABILITY: SQL injection in search query
        // VULNERABILITY: XSS in search results
        const products = await productRepository.query(`SELECT * FROM product WHERE name LIKE '%${q}%' OR description LIKE '%${q}%' AND isPublished = 1`);
        res.json({
            products,
            user: req.session.user ? {
                id: req.session.user.id,
                username: req.session.user.username,
                role: req.session.user.role
            } : null,
            query: q,
            // VULNERABILITY: Reflected XSS by directly passing query to response
            searchMessage: `Search results for: ${q}`
        });
    }
    catch (err) {
        res.status(500).json({ error: "Server error", message: err.message, stack: err.stack });
    }
});
// Show product details
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const productRepository = (0, typeorm_1.getRepository)(Product_1.Product);
        const reviewRepository = (0, typeorm_1.getRepository)(Review_1.Review);
        const product = await productRepository.findOne({ where: { id: parseInt(id) } });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        // Get product reviews
        const reviews = await reviewRepository.query(`SELECT r.*, u.username FROM review r 
       LEFT JOIN user u ON r.userId = u.id 
       WHERE r.productId = ${id}`);
        res.json({
            product,
            reviews,
            user: req.session.user ? {
                id: req.session.user.id,
                username: req.session.user.username,
                role: req.session.user.role
            } : null
        });
    }
    catch (err) {
        res.status(500).json({ error: "Server error", message: err.message, stack: err.stack });
    }
});
// Create product form (admin only)
router.get('/admin/create', auth_1.checkAuth, (req, res) => {
    // VULNERABILITY: No admin role verification, just checks for any login
    res.json({
        user: req.session.user ? {
            id: req.session.user.id,
            username: req.session.user.username,
            role: req.session.user.role
        } : null
    });
});
// Store new product (admin only)
router.post('/admin/create', auth_1.checkAuth, upload.single('image'), async (req, res) => {
    try {
        // VULNERABILITY: No admin role verification
        const { name, description, price, stock, tags } = req.body;
        const productRepository = (0, typeorm_1.getRepository)(Product_1.Product);
        const product = new Product_1.Product();
        // VULNERABILITY: No input validation or sanitization
        product.name = name;
        product.description = description; // VULNERABILITY: Stored XSS
        product.price = parseFloat(price);
        product.stock = parseInt(stock);
        product.isPublished = true;
        if (tags) {
            product.tags = tags.split(',').map((tag) => tag.trim());
        }
        if (req.file) {
            // VULNERABILITY: No image validation
            product.imageUrl = `/uploads/products/${req.file.filename}`;
        }
        await productRepository.save(product);
        res.status(201).json({ success: true, product });
    }
    catch (err) {
        res.status(500).json({ error: "Server error", message: err.message, stack: err.stack });
    }
});
// Add review
router.post('/:id/reviews', auth_1.checkAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { content, rating } = req.body;
        const reviewRepository = (0, typeorm_1.getRepository)(Review_1.Review);
        const review = new Review_1.Review();
        // VULNERABILITY: No validation of rating range
        // VULNERABILITY: No sanitization of review content (Stored XSS)
        review.productId = parseInt(id);
        review.userId = req.session.user.id;
        review.content = content; // VULNERABILITY: Stored XSS
        review.rating = parseInt(rating);
        await reviewRepository.save(review);
        res.status(201).json({ success: true, review });
    }
    catch (err) {
        res.status(500).json({ error: "Server error", message: err.message, stack: err.stack });
    }
});
exports.default = router;
