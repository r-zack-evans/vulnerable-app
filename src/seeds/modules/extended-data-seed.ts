/**
 * Extended Data Seed Module
 * 
 * Seeds additional data like reviews, audit logs, etc.
 */

import sqlite3 from 'sqlite3';

// Define interfaces
interface Review {
  feedback: string;
  rating: number;
  reviewType: string;
  daysAgo?: number;
}

interface AuditLogEntry {
  entityType: string;
  action: string;
  notes: string;
  daysAgo: number;
}

interface User {
  id: number;
  username: string;
}

// Sample review data
const reviews: Review[] = [
  {
    feedback: 'Great work on the authentication system!',
    rating: 5,
    reviewType: 'task'
  },
  {
    feedback: 'The API documentation could be improved.',
    rating: 3,
    reviewType: 'task'
  },
  {
    feedback: 'This project was completed on time and met all requirements.',
    rating: 4,
    reviewType: 'project'
  },
  {
    feedback: 'Excellent communication throughout the project.',
    rating: 5,
    reviewType: 'project'
  }
];

// Sample audit log entries
const auditLogTemplates: AuditLogEntry[] = [
  {
    entityType: 'project',
    action: 'create',
    notes: 'Project created by admin',
    daysAgo: 30
  },
  {
    entityType: 'project',
    action: 'update',
    notes: 'Project status updated from "Not Started" to "In Progress"',
    daysAgo: 20
  },
  {
    entityType: 'task',
    action: 'create',
    notes: 'Task created and assigned to team members',
    daysAgo: 25
  },
  {
    entityType: 'task',
    action: 'update',
    notes: 'Task status updated from "Not Started" to "In Progress"',
    daysAgo: 15
  },
  {
    entityType: 'user',
    action: 'login',
    notes: 'User logged in successfully',
    daysAgo: 2
  },
  {
    entityType: 'user', 
    action: 'failed_login',
    notes: 'Failed login attempt - incorrect password',
    daysAgo: 3
  }
];

/**
 * Get random user
 * @param {sqlite3.Database} db - Database connection
 * @returns {Promise<User>} - Random user object
 */
async function getRandomUser(db: sqlite3.Database): Promise<User> {
  return new Promise<User>((resolve, reject) => {
    db.get('SELECT id, username FROM user ORDER BY RANDOM() LIMIT 1', (err, user: User) => {
      if (err) return reject(err);
      if (!user) return reject(new Error('No users found'));
      resolve(user);
    });
  });
}

/**
 * Get random project
 * @param {sqlite3.Database} db - Database connection
 * @returns {Promise<{id: number}>} - Random project object
 */
async function getRandomProject(db: sqlite3.Database): Promise<{id: number}> {
  return new Promise<{id: number}>((resolve, reject) => {
    db.get('SELECT id FROM project ORDER BY RANDOM() LIMIT 1', (err, project: {id: number}) => {
      if (err) return reject(err);
      if (!project) return reject(new Error('No projects found'));
      resolve(project);
    });
  });
}

/**
 * Get random task
 * @param {sqlite3.Database} db - Database connection
 * @returns {Promise<{id: number}>} - Random task object
 */
async function getRandomTask(db: sqlite3.Database): Promise<{id: number}> {
  return new Promise<{id: number}>((resolve, reject) => {
    db.get('SELECT id FROM task ORDER BY RANDOM() LIMIT 1', (err, task: {id: number}) => {
      if (err) return reject(err);
      if (!task) return reject(new Error('No tasks found'));
      resolve(task);
    });
  });
}

/**
 * Create a review
 * @param {sqlite3.Database} db - Database connection
 * @param {Review} review - Review data
 * @returns {Promise<number>} - Created review ID
 */
async function createReview(db: sqlite3.Database, review: Review): Promise<number> {
  return new Promise<number>(async (resolve, reject) => {
    try {
      // Get random user
      const user = await getRandomUser(db);
      
      // Get target entity based on review type
      let projectId: number | null = null;
      let taskId: number | null = null;
      
      if (review.reviewType === 'project') {
        const project = await getRandomProject(db);
        projectId = project.id;
      } else if (review.reviewType === 'task') {
        const task = await getRandomTask(db);
        taskId = task.id;
      }
      
      // Random days ago for review (up to 30)
      const daysAgo = review.daysAgo ?? Math.floor(Math.random() * 30);
      
      // Insert review
      db.run(
        'INSERT INTO review (userId, projectId, taskId, feedback, rating, reviewType, createdAt) VALUES (?, ?, ?, ?, ?, ?, datetime("now", "-" || ? || " days"))',
        [
          user.id,
          projectId,
          taskId,
          review.feedback,
          review.rating,
          review.reviewType,
          daysAgo
        ],
        function(this: sqlite3.RunResult, err: Error | null) {
          if (err) return reject(err);
          console.log(`Created ${review.reviewType} review by ${user.username}`);
          resolve(this.lastID);
        }
      );
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Create an audit log entry
 * @param {sqlite3.Database} db - Database connection
 * @param {AuditLogEntry} logEntry - Audit log data
 * @returns {Promise<number>} - Created audit log ID
 */
async function createAuditLogEntry(db: sqlite3.Database, logEntry: AuditLogEntry): Promise<number> {
  return new Promise<number>(async (resolve, reject) => {
    try {
      // Get random user
      const user = await getRandomUser(db);
      
      // Get target entity
      let entityId: number;
      
      if (logEntry.entityType === 'project') {
        const project = await getRandomProject(db);
        entityId = project.id;
      } else if (logEntry.entityType === 'task') {
        const task = await getRandomTask(db);
        entityId = task.id;
      } else {
        // For user entities
        entityId = user.id;
      }
      
      // Insert audit log entry
      db.run(
        'INSERT INTO audit_log (entityType, entityId, action, userId, username, notes, timestamp) VALUES (?, ?, ?, ?, ?, ?, datetime("now", "-" || ? || " days"))',
        [
          logEntry.entityType,
          entityId,
          logEntry.action,
          user.id,
          user.username,
          logEntry.notes,
          logEntry.daysAgo
        ],
        function(this: sqlite3.RunResult, err: Error | null) {
          if (err) return reject(err);
          console.log(`Created audit log entry: ${logEntry.action} ${logEntry.entityType}`);
          resolve(this.lastID);
        }
      );
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Seed extended data (reviews, audit logs, etc.)
 * @param {sqlite3.Database} db - Database connection
 */
async function seed(db: sqlite3.Database): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      // Check if extended data already exists
      db.get('SELECT COUNT(*) as count FROM review', async (err, row: { count: number }) => {
        if (err) return reject(err);
        
        // If reviews exist, skip seeding
        if (row && row.count > 0) {
          console.log(`Found ${row.count} existing reviews, skipping extended data seeding`);
          // Set seed count for metrics
          module.exports.seedCount = 0;
          return resolve();
        }
        
        try {
          let itemsCreated = 0;
          
          // Create reviews
          for (const review of reviews) {
            await createReview(db, review);
            itemsCreated++;
          }
          
          // Create audit log entries
          for (const logTemplate of auditLogTemplates) {
            // Create multiple entries per template for realistic data
            const numEntries = Math.floor(Math.random() * 5) + 1; // 1-5 entries per template
            
            for (let i = 0; i < numEntries; i++) {
              await createAuditLogEntry(db, logTemplate);
              itemsCreated++;
            }
          }
          
          // Set seed count for metrics
          module.exports.seedCount = itemsCreated;
          
          console.log(`${itemsCreated} extended data items seeded successfully`);
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
 * Refresh extended data if needed
 * @param {sqlite3.Database} db - Database connection
 */
async function refresh(db: sqlite3.Database): Promise<void> {
  // For extended data, we can add more items even if some already exist
  return new Promise<void>(async (resolve, reject) => {
    try {
      // Only add a few new items during refresh
      const newReviews = reviews.slice(0, 2); // Just add 2 new reviews
      const newAuditLogs = auditLogTemplates.slice(0, 3); // Just add 3 new audit logs
      
      let itemsCreated = 0;
      
      // Create a few new reviews
      for (const review of newReviews) {
        await createReview(db, review);
        itemsCreated++;
      }
      
      // Create a few new audit log entries
      for (const logTemplate of newAuditLogs) {
        await createAuditLogEntry(db, logTemplate);
        itemsCreated++;
      }
      
      // Set seed count for metrics
      module.exports.seedCount = itemsCreated;
      
      console.log(`${itemsCreated} additional extended data items added during refresh`);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  seed,
  refresh,
  seedCount: 0
};

export { seed, refresh };