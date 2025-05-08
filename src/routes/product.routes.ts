import express from 'express';
import { getRepository } from 'typeorm';
import { Product } from '../entity/Product';
import { Review } from '../entity/Review';
import { checkAuth } from '../middleware/auth';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Set up multer for product images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/uploads/products'));
  },
  filename: (req, file, cb) => {
    // VULNERABILITY: Using original filename without sanitization
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

// List all products
router.get('/', async (req, res) => {
  try {
    const productRepository = getRepository(Product);
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
  } catch (err) {
    res.status(500).json({ error: "Server error", message: err.message, stack: err.stack });
  }
});

// Search products
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    const productRepository = getRepository(Product);
    
    if (!q) {
      return res.json({ products: [], message: 'No search query provided' });
    }
    
    // VULNERABILITY: SQL injection in search query
    // VULNERABILITY: XSS in search results
    const products = await productRepository.query(
      `SELECT * FROM product WHERE name LIKE '%${q}%' OR description LIKE '%${q}%' AND isPublished = 1`
    );
    
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
  } catch (err) {
    res.status(500).json({ error: "Server error", message: err.message, stack: err.stack });
  }
});

// Show product details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const productRepository = getRepository(Product);
    const reviewRepository = getRepository(Review);
    
    const product = await productRepository.findOne({ where: { id: parseInt(id) } });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Get product reviews
    const reviews = await reviewRepository.query(
      `SELECT r.*, u.username FROM review r 
       LEFT JOIN user u ON r.userId = u.id 
       WHERE r.productId = ${id}`
    );
    
    res.json({ 
      product, 
      reviews,
      user: req.session.user ? {
        id: req.session.user.id,
        username: req.session.user.username,
        role: req.session.user.role
      } : null 
    });
  } catch (err) {
    res.status(500).json({ error: "Server error", message: err.message, stack: err.stack });
  }
});

// Create product form (admin only)
router.get('/admin/create', checkAuth, (req, res) => {
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
router.post('/admin/create', checkAuth, upload.single('image'), async (req, res) => {
  try {
    // VULNERABILITY: No admin role verification
    const { name, description, price, stock, tags } = req.body;
    
    const productRepository = getRepository(Product);
    const product = new Product();
    
    // VULNERABILITY: No input validation or sanitization
    product.name = name;
    product.description = description; // VULNERABILITY: Stored XSS
    product.price = parseFloat(price);
    product.stock = parseInt(stock);
    product.isPublished = true;
    
    if (tags) {
      product.tags = tags.split(',').map((tag: string) => tag.trim());
    }
    
    if (req.file) {
      // VULNERABILITY: No image validation
      product.imageUrl = `/uploads/products/${req.file.filename}`;
    }
    
    await productRepository.save(product);
    
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(500).json({ error: "Server error", message: err.message, stack: err.stack });
  }
});

// Add review
router.post('/:id/reviews', checkAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, rating } = req.body;
    
    const reviewRepository = getRepository(Review);
    const review = new Review();
    
    // VULNERABILITY: No validation of rating range
    // VULNERABILITY: No sanitization of review content (Stored XSS)
    review.productId = parseInt(id);
    review.userId = req.session.user.id;
    review.content = content; // VULNERABILITY: Stored XSS
    review.rating = parseInt(rating);
    
    await reviewRepository.save(review);
    
    res.status(201).json({ success: true, review });
  } catch (err) {
    res.status(500).json({ error: "Server error", message: err.message, stack: err.stack });
  }
});

export default router;