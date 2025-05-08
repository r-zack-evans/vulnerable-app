import { Request, Response, NextFunction } from 'express';

// Extend Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}
import { getRepository } from 'typeorm';
import { User } from '../entity/User';

declare module 'express-session' {
  interface SessionData {
    user?: {
      id: number;
      username: string;
      role: string;
    };
  }
}

// Middleware to check if user is authenticated
export const checkAuth = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.user) {
    return res.redirect('/auth/login?message=You must be logged in');
  }
  
  // VULNERABILITY: No session validation against database
  // This means if a user is deleted or role is changed, the session still works
  // We're not verifying that the user in the session still exists or has the same role
  
  next();
};

// Middleware to check if user is an admin
export const checkAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.user) {
    return res.redirect('/auth/login?message=You must be logged in');
  }
  
  // VULNERABILITY: Weak role check
  // VULNERABILITY: No validation against database
  if (req.session.user.role !== 'admin') {
    // VULNERABILITY: Information disclosure in error message
    return res.status(403).render('error', { 
      message: 'Access denied. You need admin privileges.',
      // This error reveals that an admin route exists
      error: new Error('Route /admin/* requires admin role')
    });
  }
  
  next();
};

// VULNERABILITY: Missing CSRF protection middleware

// VULNERABILITY: Missing rate limiting middleware

// VULNERABILITY: Missing XSS protection middleware

// JWT verification middleware - demonstrates weak JWT implementation
export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.auth_token;
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    // VULNERABILITY: Using hardcoded secret
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, 'supersecretkey');
    
    // VULNERABILITY: Not checking token expiration
    // VULNERABILITY: Not validating user still exists
    
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};