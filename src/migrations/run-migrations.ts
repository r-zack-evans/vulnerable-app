#!/usr/bin/env node

/**
 * Migration Runner
 * 
 * Runs all pending database migrations
 */

import path from 'path';
import MigrationManager from './index';

// Get database path from environment or use default
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../vuln_app.sqlite');

// Create migration manager
const migrationManager = new MigrationManager(dbPath);

// Run migrations
migrationManager.runMigrations()
  .then(() => {
    console.log('Migrations completed successfully');
    migrationManager.close();
    process.exit(0);
  })
  .catch(error => {
    console.error(`Migration failed: ${error instanceof Error ? error.message : String(error)}`);
    migrationManager.close();
    process.exit(1);
  });