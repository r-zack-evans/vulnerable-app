import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { getRepository } from 'typeorm';
import { User } from '../entity/User';
import { Product } from '../entity/Product';

const router = express.Router();

// VULNERABILITY: Hardcoded JWT secret
const JWT_SECRET = 'insecure_jwt_secret_for_demo_app';

// Authentication API
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const userRepository = getRepository(User);
    
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
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        // VULNERABILITY: Including sensitive data in token
        email: user.email,
        creditCardNumber: user.creditCardNumber  // Sensitive information
      }, 
      JWT_SECRET
    );
    
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
      passwordHash: user.passwordHash  // Exposing password hash
    });
  } catch (err) {
    console.error(err);
    // VULNERABILITY: Detailed error exposure
    return res.status(500).json({ 
      error: 'An error occurred during login',
      details: err.message, // Exposing detailed error info
      stack: err.stack     // Exposing stack trace
    });
  }
});

// User Registration
router.post('/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const userRepository = getRepository(User);
    
    // VULNERABILITY: No input validation
    // Missing checks for username uniqueness, email format, password strength
    
    const newUser = new User();
    newUser.username = username;
    newUser.email = email;
    // VULNERABILITY: Storing plaintext password in db
    newUser.password = password;
    // VULNERABILITY: Weak hashing (in a real implementation, this would use a higher cost factor)
    newUser.passwordHash = await bcrypt.hash(password, 5);
    newUser.role = 'user';
    
    await userRepository.save(newUser);
    
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, role: newUser.role }, 
      JWT_SECRET
    );
    
    return res.status(201).json({
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      token
    });
  } catch (err) {
    console.error(err);
    // VULNERABILITY: Detailed error exposure
    return res.status(500).json({ 
      error: 'Registration failed', 
      details: err.message,
      stack: err.stack 
    });
  }
});

// Products API
router.get('/products', async (req, res) => {
  try {
    const productRepository = getRepository(Product);
    
    // VULNERABILITY: Missing pagination could lead to DOS in large datasets
    const products = await productRepository.find();
    
    return res.json(products);
  } catch (err) {
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
    const productRepository = getRepository(Product);
    
    // VULNERABILITY: No validation on id parameter
    const product = await productRepository.findOne({ where: { id: Number(id) } });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    return res.json(product);
  } catch (err) {
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
    const productRepository = getRepository(Product);
    
    // VULNERABILITY: Potential SQL injection through direct query parameter usage
    // In a real app with raw queries this would be vulnerable
    const products = await productRepository
      .createQueryBuilder('product')
      .where('product.name LIKE :query OR product.description LIKE :query', 
             { query: `%${query}%` }) // Vulnerable pattern in raw SQL
      .getMany();
    
    return res.json(products);
  } catch (err) {
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
      const decoded = jwt.verify(token, JWT_SECRET) as { id: number, role: string };
      userId = decoded.id;
    } else if (req.session.user) {
      userId = req.session.user.id;
    } else {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userRepository = getRepository(User);
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
      creditCardNumber: user.creditCardNumber,  // Sensitive information
      resetToken: user.resetToken,              // Sensitive information
      preferences: user.preferences             // Possibly sensitive
    });
  } catch (err) {
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
      const decoded = jwt.verify(token, JWT_SECRET) as { id: number, role: string };
      userId = decoded.id;
    } else if (req.session.user) {
      userId = req.session.user.id;
    } else {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userRepository = getRepository(User);
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
  } catch (err) {
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
    
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number, role: string };
    
    // VULNERABILITY: Not checking role properly, not validating against database
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const userRepository = getRepository(User);
    // VULNERABILITY: No pagination, potential DOS
    const users = await userRepository.find();
    
    // VULNERABILITY: Returning all user data including sensitive information
    return res.json(users);
  } catch (err) {
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
    
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number, role: string };
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const userRepository = getRepository(User);
    const user = await userRepository.findOne({ where: { id: Number(id) } });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // VULNERABILITY: No confirmation, no audit logging, no additional security checks
    await userRepository.remove(user);
    
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ 
      error: 'An error occurred deleting the user',
      details: err.message,
      stack: err.stack
    });
  }
});

export default router;