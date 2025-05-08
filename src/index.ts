import 'reflect-metadata';
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import bodyParser from 'body-parser';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { createConnection } from 'typeorm';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import productRoutes from './routes/product.routes';
import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.routes';
import adminRoutes from './routes/admin.routes';
import apiRoutes from './routes/api.routes';
import vueApiRoutes from './routes/vue-api.routes';

// Load environment variables
dotenv.config();

// Initialize database connection
createConnection({
  type: 'sqlite',
  database: 'vuln_app.sqlite',
  entities: [path.join(__dirname, 'entity/**/*.{js,ts}')],
  synchronize: true, // VULNERABILITY: Automatic schema synchronization in production is a security risk
}).then(() => {
  console.log('Database connected');
  
  // Seed the database with example data
  try {
    const seedDatabase = require('../seed-db');
    seedDatabase();
  } catch (seedError) {
    console.log('Error seeding database:', seedError);
  }
}).catch(error => console.log('Database connection error: ', error));

const app = express();
const PORT = process.env.PORT || 3001;

// Vue frontend handles all views

// Middleware
app.use(express.static(path.join(__dirname, 'public')));

// Serve Vue app from the public directory as main application
app.use(express.static(path.join(__dirname, 'public')));

// Catch-all route to serve the Vue SPA
app.get(['/app/*', '/login', '/register', '/admin', '/products*', '/projects*', '/tasks*', '/dashboard'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// VULNERABILITY: Session secret hardcoded and not secure
app.use(session({
  secret: 'supersecretkey', // VULNERABILITY: Hardcoded secret
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: false, // VULNERABILITY: Insecure cookies in production
    httpOnly: false // VULNERABILITY: Cookies accessible via JavaScript
  }
}));

// VULNERABILITY: No CORS configuration
// VULNERABILITY: No helmet for security headers

// Global variable to track login attempts (VULNERABILITY: Should use a proper rate limiter)
const loginAttempts: Record<string, number> = {};
global.loginAttempts = loginAttempts;

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/products', productRoutes);
app.use('/projects', projectRoutes);
app.use('/tasks', taskRoutes);
app.use('/admin', adminRoutes);
app.use('/api', apiRoutes);
app.use('/api/vue', vueApiRoutes);

// Root route - redirect to Vue app
app.get('/', (req, res) => {
  res.redirect('/app');
});

// Legacy route - now redirects to Vue
app.get('/try-vue', (req, res) => {
  res.redirect('/app');
});

// Serve Vue SPA for any non-API routes
app.get('*', (req, res, next) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/auth')) {
    return res.sendFile(path.join(__dirname, 'public/index.html'));
  }
  next();
});

// VULNERABILITY: Detailed error exposure
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  
  // API requests return JSON errors
  if (req.path.startsWith('/api')) {
    // VULNERABILITY: Exposing detailed error information in JSON
    return res.status(500).json({
      error: 'Server Error',
      message: err.message,
      stack: err.stack, // VULNERABILITY: Exposing stack trace
      details: err
    });
  }
  
  // For all other requests, send the Vue app to handle error display
  res.status(500).sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});