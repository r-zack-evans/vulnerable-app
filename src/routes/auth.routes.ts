import express from 'express';
import { getRepository } from 'typeorm';
import { User } from '../entity/User';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  const { username, password, email } = req.body;
  
  try {
    const userRepository = getRepository(User);
    
    // VULNERABILITY: No input validation
    // VULNERABILITY: No password complexity check
    
    // VULNERABILITY: Some users created with plaintext passwords (simulating legacy users)
    const user = new User();
    user.username = username;
    user.email = email;
    
    if (Math.random() > 0.5) { // Randomly decide between secure and insecure methods
      // Secure way: hash password
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(password, salt);
      user.password = '[HASHED]'; // Placeholder for the hashed version
    } else {
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
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // VULNERABILITY: SQL injection in direct query
    // Note: In actual TypeORM usage, we would use the repository pattern, but we're
    // intentionally using a raw query to demonstrate SQL injection
    const userRepository = getRepository(User);
    
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
      isValidPassword = await bcrypt.compare(password, user[0].passwordHash);
    } else {
      // VULNERABILITY: Compare with plaintext password
      isValidPassword = (password === user[0].password);
    }
    
    if (!isValidPassword) {
      // VULNERABILITY: No rate limiting on failed attempts
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // VULNERABILITY: Insecure JWT implementation
    const token = jwt.sign(
      { id: user[0].id, username: user[0].username, role: user[0].role },
      'supersecretkey', // VULNERABILITY: Hardcoded secret
      { expiresIn: '24h' }
    );
    
    // Set user in session
    req.session.user = {
      id: user[0].id,
      username: user[0].username,
      role: user[0].role
    };
    
    // VULNERABILITY: JWT stored in cookie without proper security flags
    res.cookie('auth_token', token, { 
      httpOnly: false,  // VULNERABILITY: Accessible via JavaScript
      secure: false     // VULNERABILITY: Transmitted over HTTP
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
  } catch (err) {
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
    const userRepository = getRepository(User);
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