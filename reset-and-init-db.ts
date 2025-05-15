// Simple script to reset the database and rebuild the schema
import fs from 'fs';
import sqlite3 from 'sqlite3';
import path from 'path';

// Path to the database file
const dbPath = path.join(__dirname, 'vuln_app.sqlite');

// Remove existing database file if it exists
if (fs.existsSync(dbPath)) {
  console.log('Removing existing database file...');
  fs.unlinkSync(dbPath);
}

// Create a new database connection
const db = new sqlite3.Database(dbPath);

console.log('Creating user table with nullable password field...');

// Create the user table with nullable password
db.serialize(() => {
  db.run(`
    CREATE TABLE user (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
  `);

  console.log('Creating project table...');
  db.run(`
    CREATE TABLE project (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      startDate TEXT,
      endDate TEXT,
      status TEXT DEFAULT 'Not Started',
      completionPercentage INTEGER DEFAULT 0,
      ownerId INTEGER,
      managerId INTEGER,
      clientId INTEGER,
      FOREIGN KEY (ownerId) REFERENCES user(id),
      FOREIGN KEY (managerId) REFERENCES user(id),
      FOREIGN KEY (clientId) REFERENCES user(id)
    )
  `);

  console.log('Creating task table...');
  db.run(`
    CREATE TABLE task (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      projectId INTEGER,
      status TEXT DEFAULT 'Not Started',
      priority TEXT DEFAULT 'Medium',
      dueDate TEXT,
      estimatedHours REAL DEFAULT 0,
      actualHours REAL DEFAULT 0,
      isCompleted INTEGER DEFAULT 0,
      FOREIGN KEY (projectId) REFERENCES project(id)
    )
  `);

  console.log('Creating task_assignment table...');
  db.run(`
    CREATE TABLE task_assignment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      taskId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (taskId) REFERENCES task(id),
      FOREIGN KEY (userId) REFERENCES user(id)
    )
  `);
});

// Close the database connection
db.close((err) => {
  if (err) {
    console.error('Error closing database:', err.message);
  } else {
    console.log('Database initialization completed successfully!');
    console.log('You can now run the seed script to populate the database with example data.');
  }
});