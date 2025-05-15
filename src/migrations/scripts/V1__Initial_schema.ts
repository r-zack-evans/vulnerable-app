/**
 * V1 - Initial schema migration
 * 
 * Creates the initial database schema
 */

import sqlite3 from 'sqlite3';

/**
 * Apply migration
 * @param {sqlite3.Database} db - The database connection
 */
function up(db: sqlite3.Database): Promise<void> {
  return new Promise((resolve, reject) => {
    // Run all schema creation statements in sequence
    db.serialize(() => {
      // Create user table
      db.run(`
        CREATE TABLE IF NOT EXISTS user (
          id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
          username TEXT NOT NULL UNIQUE,
          password TEXT NULL,
          passwordHash TEXT NULL, 
          email TEXT NOT NULL,
          role TEXT DEFAULT 'user',
          resetToken TEXT NULL,
          resetTokenExpiry TEXT NULL,
          apiKey TEXT NULL,
          creditCardNumber TEXT NULL,
          department TEXT NULL,
          jobTitle TEXT NULL,
          profilePicture TEXT NULL,
          isVerified INTEGER DEFAULT 0,
          preferences TEXT NULL
        )
      `, (err) => {
        if (err) return reject(err);
      });

      // Create project table
      db.run(`
        CREATE TABLE IF NOT EXISTS project (
          id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          startDate TEXT,
          endDate TEXT,
          status TEXT DEFAULT 'Not Started',
          completionPercentage INTEGER DEFAULT 0,
          ownerId INTEGER,
          managerId INTEGER,
          clientId INTEGER,
          teamMembers TEXT,
          isArchived INTEGER DEFAULT 0,
          metadata TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (ownerId) REFERENCES user(id),
          FOREIGN KEY (managerId) REFERENCES user(id),
          FOREIGN KEY (clientId) REFERENCES user(id)
        )
      `, (err) => {
        if (err) return reject(err);
      });

      // Create task table
      db.run(`
        CREATE TABLE IF NOT EXISTS task (
          id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          projectId INTEGER NOT NULL,
          status TEXT DEFAULT 'Not Started',
          priority TEXT,
          dueDate TEXT,
          estimatedHours INTEGER,
          actualHours INTEGER,
          isCompleted INTEGER DEFAULT 0,
          parentTaskId INTEGER,
          "order" INTEGER DEFAULT 0,
          dependsOn TEXT,
          FOREIGN KEY (projectId) REFERENCES project(id),
          FOREIGN KEY (parentTaskId) REFERENCES task(id)
        )
      `, (err) => {
        if (err) return reject(err);
      });

      // Create task_assignment table
      db.run(`
        CREATE TABLE IF NOT EXISTS task_assignment (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          taskId INTEGER NOT NULL,
          userId INTEGER NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (taskId) REFERENCES task(id),
          FOREIGN KEY (userId) REFERENCES user(id)
        )
      `, (err) => {
        if (err) return reject(err);
      });

      // Create product table
      db.run(`
        CREATE TABLE IF NOT EXISTS product (
          id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          status TEXT DEFAULT 'Not Started',
          dueDate TEXT,
          assignedTo INTEGER,
          priority TEXT,
          categoryId INTEGER,
          isPublished INTEGER DEFAULT 0,
          tags TEXT,
          price REAL DEFAULT 0,
          stock INTEGER DEFAULT 0,
          imageUrl TEXT,
          FOREIGN KEY (assignedTo) REFERENCES user(id)
        )
      `, (err) => {
        if (err) return reject(err);
      });

      // Create review table
      db.run(`
        CREATE TABLE IF NOT EXISTS review (
          id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
          userId INTEGER NOT NULL,
          projectId INTEGER,
          taskId INTEGER,
          productId INTEGER,
          feedback TEXT NOT NULL,
          content TEXT,
          rating INTEGER NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          reviewType TEXT,
          FOREIGN KEY (userId) REFERENCES user(id),
          FOREIGN KEY (projectId) REFERENCES project(id),
          FOREIGN KEY (taskId) REFERENCES task(id),
          FOREIGN KEY (productId) REFERENCES product(id)
        )
      `, (err) => {
        if (err) return reject(err);
      });

      // Create audit_log table
      db.run(`
        CREATE TABLE IF NOT EXISTS audit_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
          entityType TEXT NOT NULL,
          entityId INTEGER NOT NULL,
          action TEXT NOT NULL,
          userId INTEGER NOT NULL,
          username TEXT,
          oldValues TEXT,
          newValues TEXT,
          notes TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) return reject(err);
      });

      // All tables created successfully
      resolve();
    });
  });
}

/**
 * Revert migration
 * @param {sqlite3.Database} db - The database connection
 */
function down(db: sqlite3.Database): Promise<void> {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Drop tables in reverse order of creation (respecting foreign keys)
      db.run('DROP TABLE IF EXISTS audit_log', (err) => {
        if (err) return reject(err);
      });
      db.run('DROP TABLE IF EXISTS review', (err) => {
        if (err) return reject(err);
      });
      db.run('DROP TABLE IF EXISTS product', (err) => {
        if (err) return reject(err);
      });
      db.run('DROP TABLE IF EXISTS task_assignment', (err) => {
        if (err) return reject(err);
      });
      db.run('DROP TABLE IF EXISTS task', (err) => {
        if (err) return reject(err);
      });
      db.run('DROP TABLE IF EXISTS project', (err) => {
        if (err) return reject(err);
      });
      db.run('DROP TABLE IF EXISTS user', (err) => {
        if (err) return reject(err);
      });
      
      resolve();
    });
  });
}

export = { up, down };