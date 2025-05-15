#!/usr/bin/env node

/**
 * Health check script for Docker
 * Checks if the application and database are ready
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';

// Check if database exists and is accessible
const checkDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const dbPath = process.env.DB_PATH || path.join(__dirname, 'vuln_app.sqlite');
    
    // Check if database file exists
    if (!fs.existsSync(dbPath)) {
      return reject(new Error(`Database file not found at ${dbPath}`));
    }
    
    // Check if we can open and query the database
    const db = new sqlite3.Database(dbPath);
    
    db.get('SELECT name FROM sqlite_master WHERE type="table" AND name="schema_version"', (err, row) => {
      db.close();
      
      if (err) {
        return reject(new Error(`Database error: ${err.message}`));
      }
      
      if (!row) {
        return reject(new Error('Schema version table not found, database not properly initialized'));
      }
      
      resolve();
    });
  });
};

// Check if application server is responding
const checkServer = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const options = {
      host: 'localhost',
      port: process.env.PORT || 3001,
      path: '/health',
      timeout: 2000
    };

    const req = http.request(options, (res) => {
      if (res.statusCode === 200) {
        resolve();
      } else {
        reject(new Error(`HTTP status code: ${res.statusCode}`));
      }
    });

    req.on('error', (err) => {
      reject(new Error(`Server connection error: ${err.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Server connection timeout'));
    });

    req.end();
  });
};

// Run all checks
Promise.all([
  checkDatabase(),
  checkServer()
])
  .then(() => {
    console.log('Health check passed');
    process.exit(0);
  })
  .catch((err) => {
    console.error(`Health check failed: ${err.message}`);
    process.exit(1);
  });