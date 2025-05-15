/**
 * Users Seed Module
 * 
 * Handles seeding of user data
 */

import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';

// Define interfaces
interface User {
  username: string;
  password?: string;
  passwordHash?: string;
  email: string;
  role: string;
  department: string;
  jobTitle: string;
  isVerified: boolean;
  preferences: { [key: string]: any };
}

// User data
const users: User[] = [
  // Admin user
  {
    username: 'admin',
    password: 'admin123',
    email: 'admin@example.com',
    role: 'admin',
    department: 'IT',
    jobTitle: 'System Administrator',
    isVerified: true,
    preferences: { theme: 'dark', notifications: true, dashboardLayout: 'compact' }
  },
  // Regular user
  {
    username: 'user',
    password: 'password123',
    email: 'user@example.com',
    role: 'user',
    department: 'Operations',
    jobTitle: 'General User',
    isVerified: true,
    preferences: { theme: 'light', notifications: true, dashboardLayout: 'simple' }
  },
  // Create 13 Engineers
  ...[
    { username: 'john_eng', jobTitle: 'Software Engineer' },
    { username: 'maria_eng', jobTitle: 'Frontend Developer' },
    { username: 'james_eng', jobTitle: 'Backend Developer' },
    { username: 'alex_eng', jobTitle: 'DevOps Engineer' },
    { username: 'sarah_eng', jobTitle: 'QA Engineer' },
    { username: 'david_eng', jobTitle: 'Security Engineer' },
    { username: 'lisa_eng', jobTitle: 'Database Engineer' },
    { username: 'michael_eng', jobTitle: 'Mobile Developer' },
    { username: 'emma_eng', jobTitle: 'Systems Engineer' },
    { username: 'ryan_eng', jobTitle: 'Network Engineer' },
    { username: 'olivia_eng', jobTitle: 'ML Engineer' },
    { username: 'charlie_eng', jobTitle: 'Data Engineer' },
    { username: 'sophia_eng', jobTitle: 'Embedded Systems Engineer' }
  ].map(user => ({
    username: user.username,
    password: 'engineer123',
    email: `${user.username.split('_')[0]}@example.com`,
    role: 'user',
    department: 'Engineering',
    jobTitle: user.jobTitle,
    isVerified: true,
    preferences: { 
      theme: Math.random() > 0.5 ? 'dark' : 'light', 
      notifications: Math.random() > 0.5, 
      dashboardLayout: Math.random() > 0.5 ? 'compact' : 'detailed' 
    }
  })),
  // Create 5 Project Managers
  ...[
    { username: 'robert_pm', jobTitle: 'Technical Project Manager' },
    { username: 'jennifer_pm', jobTitle: 'Agile Project Manager' },
    { username: 'william_pm', jobTitle: 'Program Manager' },
    { username: 'emily_pm', jobTitle: 'Project Owner' },
    { username: 'daniel_pm', jobTitle: 'Scrum Master' }
  ].map(user => ({
    username: user.username,
    password: 'manager123',
    email: `${user.username.split('_')[0]}@example.com`,
    role: 'product_manager',
    department: 'Project Management',
    jobTitle: user.jobTitle,
    isVerified: true,
    preferences: { 
      theme: Math.random() > 0.5 ? 'dark' : 'light', 
      notifications: Math.random() > 0.5, 
      dashboardLayout: Math.random() > 0.5 ? 'compact' : 'detailed' 
    }
  }))
];

/**
 * Hash a password using bcrypt
 * @param {string} password - The plaintext password
 * @returns {Promise<string>} - The hashed password
 */
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Seed user data
 * @param {sqlite3.Database} db - The database connection
 */
async function seed(db: sqlite3.Database): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    // Check if users already exist
    db.get('SELECT COUNT(*) as count FROM user', async (err, row: { count: number }) => {
      if (err) return reject(err);
      
      // If users already exist, skip seeding
      if (row && row.count > 0) {
        console.log(`Found ${row.count} existing users, skipping user seeding`);
        // Set seed count for metrics
        module.exports.seedCount = 0;
        return resolve();
      }
      
      // Clear user table to ensure clean state
      db.run('DELETE FROM user', async (err) => {
        if (err) return reject(err);
        console.log('User table cleared. Seeding fresh user data...');
        
        // Prepare insert statement
        const stmt = db.prepare(`
          INSERT INTO user (
            username, passwordHash, email, role, department, jobTitle, 
            isVerified, preferences
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        try {
          // Insert each user
          for (const user of users) {
            // Hash password
            const passwordHash = user.password ? await hashPassword(user.password) : user.passwordHash;
            
            // Insert user
            await new Promise<void>((resolveInsert, rejectInsert) => {
              stmt.run(
                user.username,
                passwordHash,
                user.email,
                user.role,
                user.department,
                user.jobTitle,
                user.isVerified ? 1 : 0,
                JSON.stringify(user.preferences),
                function(err: Error | null) {
                  if (err) return rejectInsert(err);
                  console.log(`Created user: ${user.username} with ID ${this.lastID}`);
                  resolveInsert();
                }
              );
            });
          }
          
          // Finalize statement
          stmt.finalize();
          
          // Set seed count for metrics
          module.exports.seedCount = users.length;
          
          console.log(`${users.length} users seeded successfully`);
          resolve();
        } catch (error) {
          stmt.finalize();
          reject(error);
        }
      });
    });
  });
}

/**
 * Optional refresh of seed data
 * @param {sqlite3.Database} db - The database connection
 */
async function refresh(db: sqlite3.Database): Promise<void> {
  // For the user module, we don't want to refresh existing users
  // to avoid disrupting existing data relationships
  console.log('User refresh not required, skipping');
  module.exports.seedCount = 0;
  return Promise.resolve();
}

// Export as a module with all required properties for the seeding pipeline
export default {
  seed,
  refresh,
  seedCount: 0
};