import 'reflect-metadata';
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import bodyParser from 'body-parser';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { createConnection } from 'typeorm';
import helmet from 'helmet';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { config } from './config';

// Import security middleware
import { xssProtection, loginRateLimiter } from './middleware/auth';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import productRoutes from './routes/product.routes';
import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.routes';
import adminRoutes from './routes/admin.routes';
import apiRoutes from './routes/api.routes';
import vueApiRoutes from './routes/vue-api.routes';
import healthRoutes from './routes/health.routes';

// Load environment variables
dotenv.config();

// Initialize database connection
const dbPath = process.env.DB_PATH || 'vuln_app.sqlite';

createConnection({
  type: 'sqlite',
  database: dbPath,
  entities: [path.join(__dirname, 'entity/**/*.{js,ts}')],
  synchronize: false, // We use migrations instead of synchronize
}).then(async () => {
  console.log('Database connected');
  
  // Check for migrations and schema version
  try {
    // Get the database schema version
    const getSchemaVersion = async () => {
      try {
        const db = new sqlite3.Database(dbPath);
        return new Promise((resolve, reject) => {
          db.get('SELECT version FROM schema_version ORDER BY applied_at DESC LIMIT 1', (err, row: any) => {
            db.close();
            if (err) return resolve(0);
            resolve(row ? row.version : 0);
          });
        });
      } catch (error) {
        console.error('Error checking schema version:', error);
        return 0;
      }
    };
    
    const schemaVersion = await getSchemaVersion();
    
    if (schemaVersion === 0) {
      console.log('No schema version found, running migrations');
      
      // Import and run migrations
      const MigrationManager = require('./migrations/index');
      const migrationManager = new MigrationManager(dbPath);
      
      try {
        await migrationManager.runMigrations();
        console.log('Migrations completed successfully');
      } catch (migrationError) {
        console.error('Error running migrations:', migrationError);
      } finally {
        migrationManager.close();
      }
    } else {
      console.log(`Database schema is at version ${schemaVersion}`);
    }
    
    // Import dynamically - will be compiled correctly by TypeScript
    // We're in an async context, so use dynamic import
    const { SeedingPipeline } = await import('./seeds/index');
    const config = {
      database: { path: dbPath },
      profiles: {
        minimal: ['users', 'core-projects'],
        demo: ['users', 'core-projects', 'enterprise-projects'],
        full: ['users', 'core-projects', 'enterprise-projects', 'extended-data'],
      },
      // Use profile from environment or default to demo
      activeProfile: process.env.SEED_PROFILE || 'demo',
      // Dependencies and modules are defined in the seeds/index.js file
    };
    
    const pipeline = new SeedingPipeline(config);
    
    try {
      await pipeline.run();
    } catch (seedError) {
      console.error('Error running seed pipeline:', seedError);
    }
  } catch (setupError) {
    console.error('Error in database setup:', setupError);
  }
}).catch(error => console.log('Database connection error: ', error));

const app = express();
const PORT = process.env.PORT || 3001;

// Vue frontend handles all views

// Middleware - serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Log static file paths for debugging
console.log('Static file paths:');
console.log('- Main path:', path.join(__dirname, 'public'));
console.log('- Exists:', require('fs').existsSync(path.join(__dirname, 'public')));
if (require('fs').existsSync(path.join(__dirname, 'public'))) {
  console.log('- Contents:', require('fs').readdirSync(path.join(__dirname, 'public')));
}

// Catch-all route to serve the Vue SPA
app.get(['/app/*', '/login', '/register', '/admin', '/products*', '/projects*', '/tasks*', '/dashboard'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// Configure secure session
app.use(session({
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false, // Only save session when data exists
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // HTTPS in production
    httpOnly: true, // Not accessible via JavaScript
    sameSite: 'strict' // CSRF protection
  }
}));

// Apply security middleware
app.use(helmet()); // Set security headers
app.use(xssProtection); // Additional XSS protection

// Configure CORS properly
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:3000',
  credentials: true
}));

// Apply rate limiting to authentication routes
app.use('/auth/login', loginRateLimiter);

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/products', productRoutes);
app.use('/projects', projectRoutes);
app.use('/tasks', taskRoutes);
app.use('/admin', adminRoutes);
app.use('/api', apiRoutes);
app.use('/api/vue', vueApiRoutes);
app.use('/health', healthRoutes);

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

// Secure error handling - don't expose sensitive details
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  
  // API requests return JSON errors with limited information
  if (req.path.startsWith('/api')) {
    // Send generic error without exposing stack traces or details
    return res.status(500).json({
      error: 'Server Error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
    });
  }
  
  // For all other requests, send the Vue app to handle error display
  res.status(500).sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});