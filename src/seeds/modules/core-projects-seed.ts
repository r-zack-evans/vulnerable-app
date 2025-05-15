/**
 * Core Projects Seed Module
 * 
 * Seeds the basic project data
 */

import sqlite3 from 'sqlite3';

// Define interfaces
interface Project {
  name: string;
  description: string;
  startDate: Date | string;
  endDate: Date | string;
  status: string;
  completionPercentage: number;
  ownerId?: number;
}

interface User {
  id: number;
  username: string;
  jobTitle: string;
}

// Core project data
const coreProjects: Project[] = [
  {
    name: 'API Gateway Migration',
    description: 'Migrate our legacy API gateway to a modern microservices architecture using Kong. This project involves documenting current APIs, selecting a new gateway technology, and implementing a phased migration strategy with minimal service disruption.',
    startDate: new Date(),
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    status: 'In Progress',
    completionPercentage: 25
  },
  {
    name: 'Database Upgrade to PostgreSQL 14',
    description: 'Upgrade our production databases from PostgreSQL 12 to 14 with minimal downtime. This critical infrastructure project requires careful planning, extensive testing in staging environments, and a well-documented rollback strategy.',
    startDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
    endDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000), // 75 days from now
    status: 'Not Started',
    completionPercentage: 0
  },
  {
    name: 'Third-Party Payment Integration',
    description: 'Integrate our platform with Stripe, PayPal, and other payment providers to support multi-currency transactions. This project will enable our customers to accept payments in 15+ currencies and offer various payment methods including credit cards, digital wallets, and bank transfers.',
    startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
    endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
    status: 'In Progress',
    completionPercentage: 40
  }
];

/**
 * Get product managers for project assignment
 * @param {sqlite3.Database} db - Database connection
 * @returns {Promise<Array<User>>} - Array of product managers
 */
async function getProductManagers(db: sqlite3.Database): Promise<User[]> {
  return new Promise<User[]>((resolve, reject) => {
    db.all("SELECT id, username, jobTitle FROM user WHERE role = 'product_manager'", (err, managers: User[]) => {
      if (err) return reject(err);
      if (!managers || managers.length === 0) {
        return reject(new Error('No product managers found for project assignment'));
      }
      resolve(managers);
    });
  });
}

/**
 * Format date for database storage
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date string
 */
function formatDateForDb(date: Date | string): string {
  if (typeof date === 'string') return date;
  return date.toISOString().split('T')[0];
}

/**
 * Seed core projects
 * @param {sqlite3.Database} db - Database connection
 */
async function seed(db: sqlite3.Database): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      // Check if projects already exist
      db.get('SELECT COUNT(*) as count FROM project', async (err, row: { count: number }) => {
        if (err) return reject(err);
        
        // If projects exist, skip seeding
        if (row && row.count > 0) {
          console.log(`Found ${row.count} existing projects, skipping core projects seeding`);
          // Set seed count for metrics
          module.exports.seedCount = 0;
          return resolve();
        }
        
        // Get product managers to assign as owners
        let productManagers: User[];
        try {
          productManagers = await getProductManagers(db);
        } catch (error) {
          console.error('Error getting product managers:', error);
          return reject(error);
        }
        
        try {
          // Insert each project (in sequence to avoid race conditions)
          for (let i = 0; i < coreProjects.length; i++) {
            const project = coreProjects[i];
            
            // Assign a project manager as owner (round-robin assignment)
            const ownerIndex = i % productManagers.length;
            const owner = productManagers[ownerIndex];
            
            // Format dates for database
            const startDate = formatDateForDb(project.startDate);
            const endDate = formatDateForDb(project.endDate);
            
            await new Promise<void>((resolveInsert, rejectInsert) => {
              db.run(
                'INSERT INTO project (name, description, startDate, endDate, status, completionPercentage, ownerId) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [
                  project.name, 
                  project.description, 
                  startDate, 
                  endDate, 
                  project.status, 
                  project.completionPercentage,
                  owner.id
                ],
                function(this: sqlite3.RunResult, err: Error | null) {
                  if (err) return rejectInsert(err);
                  console.log(`Created project: ${project.name} with ID ${this.lastID}, owner: ${owner.username}`);
                  resolveInsert();
                }
              );
            });
          }
          
          // Set seed count for metrics
          module.exports.seedCount = coreProjects.length;
          
          console.log(`${coreProjects.length} core projects seeded successfully`);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Refresh core projects if needed
 * @param {sqlite3.Database} db - Database connection
 */
async function refresh(db: sqlite3.Database): Promise<void> {
  // For core projects, we just check they exist and don't modify them
  // to preserve data integrity
  return new Promise<void>((resolve, reject) => {
    db.get("SELECT COUNT(*) as count FROM project WHERE name IN (?, ?, ?)", 
      [coreProjects[0].name, coreProjects[1].name, coreProjects[2].name],
      (err, row: { count: number }) => {
        if (err) return reject(err);
        
        // If all core projects exist, we're good
        if (row && row.count === 3) {
          console.log('All core projects present, no refresh needed');
          module.exports.seedCount = 0;
          return resolve();
        }
        
        // If some are missing, log a warning but don't recreate
        // as this could disrupt existing relationships
        console.log(`Warning: Only ${row ? row.count : 0} of 3 core projects found. Consider reinitializing the database.`);
        module.exports.seedCount = 0;
        resolve();
      });
  });
}

module.exports = {
  seed,
  refresh,
  seedCount: 0
};

export { seed, refresh };