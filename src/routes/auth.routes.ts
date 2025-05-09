import express from 'express';
import { getRepository } from 'typeorm';
import { User } from '../entity/User';
import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { config } from '../config';
import csrf from 'csurf';

const router = express.Router();

// CSRF protection middleware
const csrfProtection = csrf({ cookie: true });

// Register a new user
router.post('/register', csrfProtection, async (req, res) => {
  const { username, password, email } = req.body;
  
  try {
    const userRepository = getRepository(User);
    
    // Input validation
    if (!username || !password || !email) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }
    
    // Password complexity check
    if (password.length < config.security.passwordMinLength) {
      return res.status(400).json({
        success: false,
        error: `Password must be at least ${config.security.passwordMinLength} characters long`
      });
    }
    
    const user = new User();
    user.username = username;
    user.email = email;
    
    // Always hash passwords - no plaintext storage
    const salt = await bcrypt.genSalt(config.security.bcryptSaltRounds);
    user.passwordHash = await bcrypt.hash(password, salt);
    // Set password field to null - we don't store plaintext passwords anymore
    user.password = null;
    
    await userRepository.save(user);
    
    // Return JSON response instead of redirect
    res.status(201).json({ 
      success: true, 
      message: 'Registration successful' 
    });
  } catch (err) {
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
router.post('/login', csrfProtection, async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // Use repository pattern with TypeORM to prevent SQL injection
    const userRepository = getRepository(User);
    
    // Use safe TypeORM methods instead of raw SQL queries
    const user = await userRepository.findOne({ where: { username } });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    let isValidPassword = false;
    
    // Check if we have a passwordHash - all users should have this after migration
    if (user.passwordHash) {
      // Compare with hashed password
      isValidPassword = await bcrypt.compare(password, user.passwordHash);
    } else {
      // Temporary transition code for legacy users - should be removed after all users migrated
      // Immediately hash their password when they log in
      if (user.password === password) {
        isValidPassword = true;
        const salt = await bcrypt.genSalt(config.security.bcryptSaltRounds);
        user.passwordHash = await bcrypt.hash(password, salt);
        user.password = null;
        await userRepository.save(user);
      }
    }
    
    if (!isValidPassword) {
      // Rate limiting should be implemented in middleware
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Secure JWT implementation
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      config.jwt.secret,
      { expiresIn: '24h' }
    );
    
    // Set user in session
    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role
    };
    
    // Set JWT cookie with proper security flags
    res.cookie('auth_token', token, { 
      httpOnly: true,  // Not accessible via JavaScript
      secure: process.env.NODE_ENV === 'production', // HTTPS in production
      sameSite: 'strict' // CSRF protection
    });
    
    // Return user data and token
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email
      },
      csrfToken: req.csrfToken() // Send CSRF token for future requests
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'Login failed'
      // Removed stack trace exposure
    });
  }
});

// Password reset request
router.post('/forgot-password', csrfProtection, async (req, res) => {
  const { email } = req.body;
  
  try {
    const userRepository = getRepository(User);
    
    // IMPORTANT: Always return the same response whether or not the email exists
    // to prevent user enumeration
    
    // Generate cryptographically secure token
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now
    
    // Only proceed with updating if user exists (but don't change response)
    const user = await userRepository.findOne({ where: { email } });
    if (user) {
      user.resetToken = resetToken;
      user.resetTokenExpiry = resetTokenExpiry;
      await userRepository.save(user);
      
      // NOTE: In a real app, you would send an email with the reset link
      // Instead of exposing it in the API response
      console.log(`Reset token for ${email}: ${resetToken}`);
    }
    
    // Same response whether or not email exists
    res.json({ 
      message: 'If an account exists with that email, a password reset link has been sent.' 
    });
  } catch (err) {
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

export default router;