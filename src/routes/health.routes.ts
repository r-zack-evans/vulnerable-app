import express from 'express';
import { getRepository } from 'typeorm';

const router = express.Router();

/**
 * Health check API endpoint
 * Used by Docker health checks and other systems to verify the application is running
 */
router.get('/', async (req, res) => {
  try {
    // Check if database is connected
    const isDbConnected = await checkDatabaseConnection();
    
    // Return health status
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || 'unknown',
      database: {
        connected: isDbConnected
      }
    });
  } catch (error) {
    // Return unhealthy status if any checks fail
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Service temporarily unavailable'
    });
  }
});

/**
 * Check if database connection is working
 */
async function checkDatabaseConnection() {
  try {
    // Run a simple query to verify database connection
    const userRepo = getRepository('user');
    await userRepo.createQueryBuilder().select('COUNT(*)', 'count').getRawOne();
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}

export default router;