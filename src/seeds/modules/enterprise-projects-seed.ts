/**
 * Enterprise Projects Seed Module
 * 
 * Seeds enterprise DevSecOps projects
 * Consolidates previous additional-projects-tasks.ts functionality
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

// Enterprise project data
const enterpriseProjects: Project[] = [
  {
    name: 'Enterprise SAST/DAST Integration',
    description: 'Implement comprehensive Static and Dynamic Application Security Testing into our CI/CD pipeline to identify vulnerabilities earlier in the development lifecycle.',
    startDate: new Date(),
    endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
    status: 'In Progress',
    completionPercentage: 15
  },
  {
    name: 'Kubernetes Security Hardening',
    description: 'Implement enhanced security controls across our Kubernetes clusters to ensure compliance with CIS Benchmarks and protect against container-based threats.',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    status: 'In Progress',
    completionPercentage: 35
  },
  {
    name: 'Distributed Tracing Implementation',
    description: 'Implement OpenTelemetry-based distributed tracing across our microservices architecture to improve observability and troubleshooting capabilities for our 100+ services.',
    startDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000),
    status: 'Not Started',
    completionPercentage: 0
  },
  {
    name: 'Zero Trust Infrastructure Transition',
    description: 'Architect and implement a zero trust security model across our infrastructure to secure our enterprise applications and data against sophisticated threats.',
    startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    status: 'In Progress',
    completionPercentage: 20
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
 * Check if core projects exist
 * @param {sqlite3.Database} db - Database connection
 * @returns {Promise<boolean>} - Whether core projects exist
 */
async function checkCoreProjectsExist(db: sqlite3.Database): Promise<boolean> {
  return new Promise<boolean>((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM project', (err, row: { count: number }) => {
      if (err) return reject(err);
      resolve(row && row.count >= 3);
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
 * Seed enterprise projects
 * @param {sqlite3.Database} db - Database connection
 */
async function seed(db: sqlite3.Database): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      // First make sure core projects exist
      const coreProjectsExist = await checkCoreProjectsExist(db);
      if (!coreProjectsExist) {
        return reject(new Error('Core projects must be seeded before enterprise projects'));
      }
      
      // Check if enterprise projects already exist
      db.get("SELECT COUNT(*) as count FROM project WHERE name = ?", 
        [enterpriseProjects[0].name],
        async (err, row: { count: number }) => {
          if (err) return reject(err);
          
          // If enterprise projects exist, skip seeding
          if (row && row.count > 0) {
            console.log('Enterprise projects already exist, skipping');
            // Set seed count for metrics
            module.exports.seedCount = 0;
            return resolve();
          }
          
          // Get product managers to assign as owners
          const productManagers = await getProductManagers(db);
          
          try {
            // Insert each project (in sequence to avoid race conditions)
            for (let i = 0; i < enterpriseProjects.length; i++) {
              const project = enterpriseProjects[i];
              
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
                    console.log(`Created enterprise project: ${project.name} with ID ${this.lastID}, owner: ${owner.username}`);
                    resolveInsert();
                  }
                );
              });
            }
            
            // Set seed count for metrics
            module.exports.seedCount = enterpriseProjects.length;
            
            console.log(`${enterpriseProjects.length} enterprise projects seeded successfully`);
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
 * Refresh enterprise projects if needed
 * @param {sqlite3.Database} db - Database connection
 */
async function refresh(db: sqlite3.Database): Promise<void> {
  // For enterprise projects, we just check they exist and don't modify them
  // to preserve data integrity
  return new Promise<void>((resolve, reject) => {
    db.get("SELECT COUNT(*) as count FROM project WHERE name IN (?, ?, ?, ?)", 
      enterpriseProjects.map(p => p.name),
      (err, row: { count: number }) => {
        if (err) return reject(err);
        
        // If all enterprise projects exist, we're good
        if (row && row.count === 4) {
          console.log('All enterprise projects present, no refresh needed');
          module.exports.seedCount = 0;
          return resolve();
        }
        
        // If some are missing, log a warning but don't recreate
        // as this could disrupt existing relationships
        console.log(`Warning: Only ${row ? row.count : 0} of 4 enterprise projects found. Consider reinitializing the database.`);
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