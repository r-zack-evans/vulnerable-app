import { Request, Response, NextFunction } from 'express';
import { getRepository } from 'typeorm';
import { User } from '../entity/User';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { config } from '../config';
import rateLimit from 'express-rate-limit';
import csrf from 'csurf';

// Extend Request type to include user property and csrfToken
declare global {
  namespace Express {
    interface Request {
      user?: any;
      csrfToken(): string;
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    user?: {
      id: number;
      username: string;
      role: string;
    };
  }
}

// Rate limiting for login attempts - prevents brute force attacks
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { error: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware to check if user is authenticated
export const checkAuth = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.user) {
    return res.redirect('/auth/login?message=You must be logged in');
  }
  
  // Validate session against database
  try {
    const userRepository = getRepository(User);
    const user = await userRepository.findOne({ where: { id: req.session.user.id } });
    
    // If user doesn't exist or role has changed, invalidate session
    if (!user || user.role !== req.session.user.role) {
      req.session.destroy(() => {
        res.clearCookie('auth_token');
        return res.redirect('/auth/login?message=Session expired');
      });
      return;
    }
    
    next();
  } catch (err) {
    console.error('Session validation error:', err);
    return res.status(500).redirect('/auth/login?message=Internal server error');
  }
};

// Middleware to check if user is an admin
export const checkAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.user) {
    return res.redirect('/auth/login?message=You must be logged in');
  }
  
  // Validate against database
  try {
    const userRepository = getRepository(User);
    const user = await userRepository.findOne({ where: { id: req.session.user.id } });
    
    // If user doesn't exist or isn't an admin, deny access
    if (!user || user.role !== 'admin') {
      // Generic error message that doesn't reveal specific routes
      return res.status(403).render('error', { 
        message: 'Access denied.',
        error: new Error('Insufficient permissions')
      });
    }
    
    next();
  } catch (err) {
    console.error('Admin check error:', err);
    return res.status(500).render('error', { message: 'Internal server error' });
  }
};

// CSRF protection middleware - import csrf from 'csurf' at the top of the file
export const csrfProtection = csrf({ cookie: true });

// XSS protection middleware
export const xssProtection = (req: Request, res: Response, next: NextFunction) => {
  // Set security headers
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  next();
};

// Define custom JWT payload interface
interface JwtCustomPayload extends JwtPayload {
  id: number;
  username: string;
  role: string;
}

// JWT verification middleware - secure implementation
export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.auth_token;
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    // Use imported JWT and config secret
    const decoded = jwt.verify(token, config.jwt.secret.toString()) as JwtCustomPayload;
    
    // Validate that user still exists in database
    const userRepository = getRepository(User);
    const user = await userRepository.findOne({ where: { id: decoded.id } });
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication invalid' });
    }
    
    // Check if user role matches token role
    if (user.role !== decoded.role) {
      return res.status(401).json({ error: 'Authentication invalid' });
    }
    
    req.user = decoded;
    next();
  } catch (err) {
    // Don't expose detailed JWT errors to client
    return res.status(401).json({ error: 'Authentication invalid' });
  }
};