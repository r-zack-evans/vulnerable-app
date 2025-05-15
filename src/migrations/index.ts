/**
 * Database Migrations Framework
 * 
 * Enterprise-grade schema versioning and migration system
 */

import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';

interface Migration {
  version: number;
  name: string;
  file: string;
  path: string;
}

interface MigrationScript {
  up: (db: sqlite3.Database) => Promise<void>;
  down?: (db: sqlite3.Database) => Promise<void>;
}

class MigrationManager {
  private dbPath: string;
  private db: sqlite3.Database | null;
  private migrationsDir: string;
  private initialized: boolean;

  constructor(dbPath: string) {
    this.dbPath = dbPath || './vuln_app.sqlite';
    this.db = null;
    this.migrationsDir = path.join(__dirname, 'scripts');
    this.initialized = false;
  }

  /**
   * Initialize the migration manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    // Create database connection
    this.db = new sqlite3.Database(this.dbPath);
    
    // Enable foreign keys
    await this._runQuery('PRAGMA foreign_keys = ON');
    
    // Create migrations table if it doesn't exist
    await this._createMigrationsTable();
    
    this.initialized = true;
  }

  /**
   * Run all pending migrations
   */
  async runMigrations(): Promise<void> {
    await this.initialize();
    
    // Get current database version
    const currentVersion = await this._getCurrentVersion();
    console.log(`Current database version: ${currentVersion}`);
    
    // Get all migration scripts
    const migrations = this._getAvailableMigrations();
    
    // Filter pending migrations
    const pendingMigrations = migrations.filter(m => m.version > currentVersion);
    pendingMigrations.sort((a, b) => a.version - b.version);
    
    if (pendingMigrations.length === 0) {
      console.log('No pending migrations');
      return;
    }
    
    console.log(`Found ${pendingMigrations.length} pending migrations`);
    
    // Run each pending migration in a transaction
    for (const migration of pendingMigrations) {
      try {
        console.log(`Running migration: ${migration.name} (${migration.version})`);
        
        // Begin transaction
        await this._beginTransaction();
        
        // Execute migration
        await this._executeMigration(migration);
        
        // Update schema version
        await this._updateSchemaVersion(migration.version, migration.name);
        
        // Commit transaction
        await this._commitTransaction();
        
        console.log(`Migration ${migration.name} completed successfully`);
      } catch (error) {
        // Rollback on error
        await this._rollbackTransaction();
        console.error(`Migration ${migration.name} failed: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      }
    }
  }

  /**
   * Get the current database schema version
   */
  async _getCurrentVersion(): Promise<number> {
    try {
      const result = await this._runQuery('SELECT version FROM schema_version ORDER BY applied_at DESC LIMIT 1');
      return result ? (result as { version: number }).version : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Create migrations tracking table
   */
  async _createMigrationsTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS schema_version (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version INTEGER NOT NULL,
        name TEXT NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        success BOOLEAN NOT NULL DEFAULT 1
      )
    `;
    
    await this._runQuery(query);
  }

  /**
   * Get all available migration scripts
   */
  _getAvailableMigrations(): Migration[] {
    const migrations: Migration[] = [];
    
    // Create migrations directory if it doesn't exist
    if (!fs.existsSync(this.migrationsDir)) {
      fs.mkdirSync(this.migrationsDir, { recursive: true });
    }
    
    // Read migration scripts
    const files = fs.readdirSync(this.migrationsDir);
    
    for (const file of files) {
      if (!file.endsWith('.js') && !file.endsWith('.ts')) continue;
      
      // Parse version and name from filename (format: V1__Initial_schema.js)
      const match = file.match(/^V(\d+)__(.+)\.(js|ts)$/);
      if (!match) continue;
      
      const version = parseInt(match[1]);
      const name = match[2].replace(/_/g, ' ');
      
      migrations.push({
        version,
        name,
        file,
        path: path.join(this.migrationsDir, file)
      });
    }
    
    return migrations;
  }

  /**
   * Execute a migration script
   */
  async _executeMigration(migration: Migration): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    // Import and execute the migration script
    const script = require(migration.path) as MigrationScript;
    
    if (typeof script.up !== 'function') {
      throw new Error(`Migration ${migration.name} does not export an 'up' function`);
    }
    
    await script.up(this.db);
  }

  /**
   * Update the schema version in the database
   */
  async _updateSchemaVersion(version: number, name: string): Promise<void> {
    const query = `
      INSERT INTO schema_version (version, name, success)
      VALUES (?, ?, 1)
    `;
    
    await this._runQuery(query, [version, name]);
  }

  /**
   * Begin a transaction
   */
  async _beginTransaction(): Promise<void> {
    await this._runQuery('BEGIN TRANSACTION');
  }

  /**
   * Commit a transaction
   */
  async _commitTransaction(): Promise<void> {
    await this._runQuery('COMMIT');
  }

  /**
   * Rollback a transaction
   */
  async _rollbackTransaction(): Promise<void> {
    try {
      await this._runQuery('ROLLBACK');
    } catch (e) {
      console.error('Error rolling back transaction:', e);
    }
  }

  /**
   * Run a database query
   */
  _runQuery(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'));
      
      this.db.get(sql, params, (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }
}

export = MigrationManager;