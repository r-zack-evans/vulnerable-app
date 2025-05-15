#!/usr/bin/env ts-node

/**
 * Seeding Pipeline Manager
 * 
 * Enterprise-grade seeding system with:
 * - Domain-driven organization
 * - Dependency management
 * - Configurable profiles
 * - Observability
 * - Idempotent operations
 */

import * as path from 'path';
import * as fs from 'fs';
import sqlite3 from 'sqlite3';

// Module interfaces
interface SeedModule {
  seed: (db: sqlite3.Database) => Promise<void>;
  refresh?: (db: sqlite3.Database) => Promise<void>;
  seedCount: number;
}

// Configuration interface
interface SeedConfig {
  database: {
    path: string;
  };
  profiles: {
    [profileName: string]: string[];
  };
  activeProfile: string;
  dependencies?: {
    [moduleName: string]: string[];
  };
  seedModules?: {
    [moduleName: string]: SeedModule;
  };
}

// Metrics interface
interface SeedMetrics {
  totalSeeds: number;
  successfulSeeds: number;
  failedSeeds: number;
  duration: number;
  moduleMetrics: {
    [moduleName: string]: {
      executed: boolean;
      seeds: number;
      successful: number;
      failed: number;
      duration: number;
    };
  };
}

// Default configuration
const defaultConfig: SeedConfig = {
  // Database connection settings
  database: {
    path: process.env.DB_PATH || path.join(__dirname, '../../vuln_app.sqlite'),
  },
  
  // Seeding profiles
  profiles: {
    minimal: ['users', 'core-projects'],
    demo: ['users', 'core-projects', 'enterprise-projects', 'tasks'],
    full: ['users', 'core-projects', 'enterprise-projects', 'tasks', 'extended-data'],
  },
  
  // Active profile - defaults to demo if not specified
  activeProfile: process.env.SEED_PROFILE || 'demo',
  
  // Dependency graph for seed modules
  dependencies: {
    'core-projects': ['users'],
    'enterprise-projects': ['users', 'core-projects'],
    'tasks': ['users', 'core-projects', 'enterprise-projects'],
    'extended-data': ['users', 'core-projects', 'enterprise-projects', 'tasks'],
  },
  
  // Seed modules object needs to be initialized to prevent "Cannot read properties of undefined"
  seedModules: {},
};

/**
 * Seeding Pipeline Manager
 */
class SeedingPipeline {
  private config: SeedConfig;
  private db: sqlite3.Database | null;
  private executedModules: Set<string>;
  private startTime: number;
  private metrics: SeedMetrics;

  constructor(config: SeedConfig) {
    this.config = {
      ...defaultConfig,
      ...config,
      // We'll load modules when needed during execution
      seedModules: config.seedModules || {}
    };
    
    this.db = null;
    this.executedModules = new Set<string>();
    this.startTime = Date.now();
    this.metrics = {
      totalSeeds: 0,
      successfulSeeds: 0,
      failedSeeds: 0,
      duration: 0,
      moduleMetrics: {},
    };
  }

  /**
   * Initialize the database connection
   */
  async initialize(): Promise<void> {
    this.log('info', `Initializing seeding pipeline with profile: ${this.config.activeProfile}`);
    
    // Validate profile
    if (!this.config.profiles[this.config.activeProfile]) {
      throw new Error(`Invalid seed profile: ${this.config.activeProfile}`);
    }
    
    // Preload all seed modules
    await this._loadSeedModules();
    
    // Connect to the database
    this.db = new sqlite3.Database(this.config.database.path);
    
    // Enable foreign keys
    await this._runQuery('PRAGMA foreign_keys = ON');
    
    // Create seed tracking table if it doesn't exist
    await this._createSeedTrackingTable();
  }
  
  /**
   * Load all seed modules dynamically
   */
  private async _loadSeedModules(): Promise<void> {
    this.log('info', 'Loading seed modules...');
    
    // Define all required modules
    const requiredModules = [
      'users',
      'core-projects',
      'enterprise-projects',
      'tasks',
      'extended-data'
    ];
    
    // Initialize seedModules if it doesn't exist
    this.config.seedModules = this.config.seedModules || {};
    
    // Load modules one by one
    for (const moduleName of requiredModules) {
      try {
        // Use dynamic import to load the module
        const moduleImport = await import(`./modules/${moduleName}-seed`);
        this.config.seedModules[moduleName] = moduleImport.default;
        this.log('info', `Loaded module: ${moduleName}`);
      } catch (error) {
        this.log('warn', `Failed to load module ${moduleName}: ${error.message}`);
      }
    }
  }

  /**
   * Run the seeding pipeline
   */
  async run(): Promise<SeedMetrics> {
    try {
      await this.initialize();
      
      // Get modules for active profile
      const profileModules = this.config.profiles[this.config.activeProfile];
      
      // Build execution plan (resolving dependencies)
      const executionPlan = this._buildExecutionPlan(profileModules);
      
      this.log('info', `Execution plan: ${executionPlan.join(' → ')}`);
      
      // Execute each module in order
      for (const moduleName of executionPlan) {
        await this._executeModule(moduleName);
      }
      
      // Calculate final metrics
      this.metrics.duration = Date.now() - this.startTime;
      
      this.log('success', `Seeding completed successfully in ${this.metrics.duration}ms`);
      this.log('info', `Seeds executed: ${this.metrics.totalSeeds} (${this.metrics.successfulSeeds} successful, ${this.metrics.failedSeeds} failed)`);
      
      return this.metrics;
    } catch (error) {
      this.log('error', `Seeding failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    } finally {
      // Close database connection
      if (this.db) {
        this.db.close();
      }
    }
  }

  /**
   * Execute a seed module
   */
  private async _executeModule(moduleName: string): Promise<void> {
    // Skip if already executed
    if (this.executedModules.has(moduleName)) {
      this.log('info', `Module ${moduleName} already executed, skipping`);
      return;
    }
    
    const moduleStartTime = Date.now();
    this.log('info', `Executing seed module: ${moduleName}`);
    
    // Get module implementation
    const module = this.config.seedModules?.[moduleName];
    if (!module) {
      throw new Error(`Seed module not found: ${moduleName}`);
    }
    
    // Check if module has been executed before
    const isModuleExecuted = await this._isModuleExecuted(moduleName);
    
    // Module metrics initialization
    this.metrics.moduleMetrics[moduleName] = {
      executed: false,
      seeds: 0,
      successful: 0,
      failed: 0,
      duration: 0,
    };
    
    try {
      // Execute module
      if (isModuleExecuted) {
        this.log('info', `Module ${moduleName} was previously executed, checking if refresh is needed`);
        
        // If the module supports idempotent refresh, call it
        if (typeof module.refresh === 'function') {
          this.log('info', `Refreshing module: ${moduleName}`);
          await module.refresh(this.db!);
          this.metrics.moduleMetrics[moduleName].executed = true;
        } else {
          this.log('info', `Module ${moduleName} does not support refresh, skipping`);
        }
      } else {
        // Execute the module for the first time
        this.log('info', `Executing module for first time: ${moduleName}`);
        await module.seed(this.db!);
        
        // Record the execution in tracking table
        await this._recordModuleExecution(moduleName);
        this.metrics.moduleMetrics[moduleName].executed = true;
      }
      
      // Update module metrics
      this.metrics.moduleMetrics[moduleName].seeds = module.seedCount || 0;
      this.metrics.moduleMetrics[moduleName].successful = module.seedCount || 0;
      this.metrics.moduleMetrics[moduleName].duration = Date.now() - moduleStartTime;
      
      // Update global metrics
      this.metrics.totalSeeds += module.seedCount || 0;
      this.metrics.successfulSeeds += module.seedCount || 0;
      
      // Mark as executed
      this.executedModules.add(moduleName);
      
      this.log('success', `Module ${moduleName} executed successfully in ${this.metrics.moduleMetrics[moduleName].duration}ms`);
    } catch (error) {
      // Update metrics on failure
      this.metrics.moduleMetrics[moduleName].failed = 1;
      this.metrics.moduleMetrics[moduleName].duration = Date.now() - moduleStartTime;
      this.metrics.failedSeeds++;
      
      this.log('error', `Module ${moduleName} failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Build the execution plan, resolving all dependencies
   */
  private _buildExecutionPlan(modules: string[]): string[] {
    const visited = new Set<string>();
    const plan: string[] = [];
    
    // Topological sort using depth-first search
    const visit = (moduleName: string): void => {
      // Skip if already visited
      if (visited.has(moduleName)) return;
      
      // Mark as visited
      visited.add(moduleName);
      
      // Visit dependencies first
      const deps = this.config.dependencies || {};
      const dependencies = deps[moduleName] || [];
      for (const dependency of dependencies) {
        visit(dependency);
      }
      
      // Add to execution plan
      plan.push(moduleName);
    };
    
    // Visit each module
    for (const moduleName of modules) {
      visit(moduleName);
    }
    
    return plan;
  }

  /**
   * Create the seed tracking table
   */
  private async _createSeedTrackingTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS seed_execution (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        module TEXT NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        success BOOLEAN NOT NULL DEFAULT 1
      )
    `;
    
    await this._runQuery(query);
  }

  /**
   * Check if a module has been executed before
   */
  private async _isModuleExecuted(moduleName: string): Promise<boolean> {
    const query = 'SELECT COUNT(*) as count FROM seed_execution WHERE module = ?';
    const result = await this._runQuery(query, [moduleName]);
    return result && result.count > 0;
  }

  /**
   * Record a module execution in the tracking table
   */
  private async _recordModuleExecution(moduleName: string, success = true): Promise<void> {
    const query = 'INSERT INTO seed_execution (module, success) VALUES (?, ?)';
    await this._runQuery(query, [moduleName, success ? 1 : 0]);
  }

  /**
   * Run a database query
   */
  private _runQuery(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        return reject(new Error('Database not initialized'));
      }
      
      this.db.get(sql, params, (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  /**
   * Log a message
   */
  private log(level: 'info' | 'success' | 'warn' | 'error', message: string): void {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '\x1b[36m[INFO]\x1b[0m',      // Cyan
      success: '\x1b[32m[SUCCESS]\x1b[0m',  // Green
      warn: '\x1b[33m[WARN]\x1b[0m',       // Yellow
      error: '\x1b[31m[ERROR]\x1b[0m',     // Red
    }[level] || '[LOG]';
    
    console.log(`${timestamp} ${prefix} ${message}`);
  }
}

// If this script is run directly, execute the seeding pipeline
if (require.main === module) {
  const pipeline = new SeedingPipeline(defaultConfig);
  
  pipeline.run()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

// Export the class using standard TypeScript export
export { SeedingPipeline };