#!/usr/bin/env ts-node

/**
 * Database Verification Script
 * 
 * Verifies that the database file exists and is accessible
 */

import * as fs from 'fs';
import * as path from 'path';
import sqlite3 from 'sqlite3';

// Get database path from environment or use default
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../vuln_app.sqlite');

// Check if database file exists
if (!fs.existsSync(dbPath)) {
  console.error(`Database file not found at ${dbPath}`);
  process.exit(1);
}

// Try to open the database
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error(`Failed to open database: ${err.message}`);
    process.exit(1);
  }
  
  // Try to run a simple query
  db.get('SELECT 1', (err) => {
    db.close();
    
    if (err) {
      console.error(`Failed to query database: ${err.message}`);
      process.exit(1);
    }
    
    console.log('Database verification successful');
    process.exit(0);
  });
});