const sqlite3 = require('sqlite3').verbose();

// Function to seed the database with example users
function seedUsers() {
  console.log('Preparing to seed users...');
  
  const db = new sqlite3.Database('./vuln_app.sqlite');
  
  // Check if table exists, then clear it
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='user'", (err, row) => {
    if (err) {
      console.error('Error checking for user table:', err);
      db.close();
      return;
    }
    
    // If table exists, delete all entries
    if (row) {
      console.log('Clearing existing user data...');
      db.run('DELETE FROM user', (err) => {
        if (err) {
          console.error('Error clearing user table:', err);
          db.close();
          return;
        }
        console.log('User table cleared. Seeding fresh user data...');
        createUsers(db);
      });
    } else {
      // Table doesn't exist yet, TypeORM will create it
      console.log('User table not found. It will be created on app start.');
      createUsers(db);
    }
  });
}

// Create sample users
function createUsers(db) {
  // Sample user data
  const users = [
    // Keep admin user
    {
      username: 'admin',
      password: 'admin123', // This would be hashed in production
      passwordHash: '$2b$10$rQkWM5CwWDYS1j/dCRY1KuHfz4NFq4HEGirxy7TmQTTWDn9lkLZXO', // hash for 'admin123'
      email: 'admin@example.com',
      role: 'admin',
      department: 'IT',
      jobTitle: 'System Administrator',
      isVerified: true,
      preferences: JSON.stringify({ theme: 'dark', notifications: true, dashboardLayout: 'compact' })
    },
    // Keep regular user
    {
      username: 'user',
      password: 'password123',
      passwordHash: '$2b$10$jDW2skBHRjH9JwumTaY72O8d0FOYaYiCNR74KFnULvQZK.JWEPQwa', // hash for 'password123'
      email: 'user@example.com',
      role: 'user',
      department: 'Operations',
      jobTitle: 'General User',
      isVerified: true,
      preferences: JSON.stringify({ theme: 'light', notifications: true, dashboardLayout: 'simple' })
    },
    // 13 Engineers with _eng suffix
    {
      username: 'john_eng',
      password: 'pass123',
      passwordHash: '$2b$10$dUG.KQltgFmUyfUZ5fQcsu/ROXGy45YcBZ9XNYiF5CKC0CnCy5RZW',
      email: 'john@example.com',
      role: 'user',
      department: 'Engineering',
      jobTitle: 'Software Engineer',
      isVerified: true,
      preferences: JSON.stringify({ theme: 'dark', notifications: false, dashboardLayout: 'compact' })
    },
    {
      username: 'maria_eng',
      password: 'pass123',
      passwordHash: '$2b$10$dUG.KQltgFmUyfUZ5fQcsu/ROXGy45YcBZ9XNYiF5CKC0CnCy5RZW',
      email: 'maria@example.com',
      role: 'user',
      department: 'Engineering',
      jobTitle: 'Frontend Developer',
      isVerified: true,
      preferences: JSON.stringify({ theme: 'light', notifications: true, dashboardLayout: 'detailed' })
    },
    {
      username: 'james_eng',
      password: 'pass123',
      passwordHash: '$2b$10$dUG.KQltgFmUyfUZ5fQcsu/ROXGy45YcBZ9XNYiF5CKC0CnCy5RZW',
      email: 'james@example.com',
      role: 'user',
      department: 'Engineering',
      jobTitle: 'Backend Developer',
      isVerified: true,
      preferences: JSON.stringify({ theme: 'dark', notifications: false, dashboardLayout: 'compact' })
    },
    {
      username: 'alex_eng',
      password: 'pass123',
      passwordHash: '$2b$10$dUG.KQltgFmUyfUZ5fQcsu/ROXGy45YcBZ9XNYiF5CKC0CnCy5RZW',
      email: 'alex@example.com',
      role: 'user',
      department: 'Engineering',
      jobTitle: 'DevOps Engineer',
      isVerified: true,
      preferences: JSON.stringify({ theme: 'dark', notifications: true, dashboardLayout: 'compact' })
    },
    {
      username: 'sarah_eng',
      password: 'pass123',
      passwordHash: '$2b$10$dUG.KQltgFmUyfUZ5fQcsu/ROXGy45YcBZ9XNYiF5CKC0CnCy5RZW',
      email: 'sarah@example.com',
      role: 'user',
      department: 'Engineering',
      jobTitle: 'QA Engineer',
      isVerified: true,
      preferences: JSON.stringify({ theme: 'light', notifications: true, dashboardLayout: 'detailed' })
    },
    {
      username: 'david_eng',
      password: 'pass123',
      passwordHash: '$2b$10$dUG.KQltgFmUyfUZ5fQcsu/ROXGy45YcBZ9XNYiF5CKC0CnCy5RZW',
      email: 'david@example.com',
      role: 'user',
      department: 'Engineering',
      jobTitle: 'Security Engineer',
      isVerified: true,
      preferences: JSON.stringify({ theme: 'dark', notifications: true, dashboardLayout: 'compact' })
    },
    {
      username: 'lisa_eng',
      password: 'pass123',
      passwordHash: '$2b$10$dUG.KQltgFmUyfUZ5fQcsu/ROXGy45YcBZ9XNYiF5CKC0CnCy5RZW',
      email: 'lisa@example.com',
      role: 'user',
      department: 'Engineering',
      jobTitle: 'Database Engineer',
      isVerified: true,
      preferences: JSON.stringify({ theme: 'light', notifications: false, dashboardLayout: 'detailed' })
    },
    {
      username: 'michael_eng',
      password: 'pass123',
      passwordHash: '$2b$10$dUG.KQltgFmUyfUZ5fQcsu/ROXGy45YcBZ9XNYiF5CKC0CnCy5RZW',
      email: 'michael@example.com',
      role: 'user',
      department: 'Engineering',
      jobTitle: 'Mobile Developer',
      isVerified: true,
      preferences: JSON.stringify({ theme: 'dark', notifications: true, dashboardLayout: 'compact' })
    },
    {
      username: 'emma_eng',
      password: 'pass123',
      passwordHash: '$2b$10$dUG.KQltgFmUyfUZ5fQcsu/ROXGy45YcBZ9XNYiF5CKC0CnCy5RZW',
      email: 'emma@example.com',
      role: 'user',
      department: 'Engineering',
      jobTitle: 'Systems Engineer',
      isVerified: true,
      preferences: JSON.stringify({ theme: 'light', notifications: true, dashboardLayout: 'detailed' })
    },
    {
      username: 'ryan_eng',
      password: 'pass123',
      passwordHash: '$2b$10$dUG.KQltgFmUyfUZ5fQcsu/ROXGy45YcBZ9XNYiF5CKC0CnCy5RZW',
      email: 'ryan@example.com',
      role: 'user',
      department: 'Engineering',
      jobTitle: 'Network Engineer',
      isVerified: true,
      preferences: JSON.stringify({ theme: 'dark', notifications: false, dashboardLayout: 'compact' })
    },
    {
      username: 'olivia_eng',
      password: 'pass123',
      passwordHash: '$2b$10$dUG.KQltgFmUyfUZ5fQcsu/ROXGy45YcBZ9XNYiF5CKC0CnCy5RZW',
      email: 'olivia@example.com',
      role: 'user',
      department: 'Engineering',
      jobTitle: 'ML Engineer',
      isVerified: true,
      preferences: JSON.stringify({ theme: 'light', notifications: true, dashboardLayout: 'detailed' })
    },
    {
      username: 'charlie_eng',
      password: 'pass123',
      passwordHash: '$2b$10$dUG.KQltgFmUyfUZ5fQcsu/ROXGy45YcBZ9XNYiF5CKC0CnCy5RZW',
      email: 'charlie@example.com',
      role: 'user',
      department: 'Engineering',
      jobTitle: 'Data Engineer',
      isVerified: true,
      preferences: JSON.stringify({ theme: 'dark', notifications: true, dashboardLayout: 'compact' })
    },
    {
      username: 'sophia_eng',
      password: 'pass123',
      passwordHash: '$2b$10$dUG.KQltgFmUyfUZ5fQcsu/ROXGy45YcBZ9XNYiF5CKC0CnCy5RZW',
      email: 'sophia@example.com',
      role: 'user',
      department: 'Engineering',
      jobTitle: 'Embedded Systems Engineer',
      isVerified: true,
      preferences: JSON.stringify({ theme: 'light', notifications: false, dashboardLayout: 'detailed' })
    },
    // 5 Project Managers with _pm suffix
    {
      username: 'robert_pm',
      password: 'manager123',
      passwordHash: '$2b$10$rBtRG.joMIfVKKWKPmwkJ.d0JD3bRnVJG9k5UHRqfJ2eb9y5H9BZG',
      email: 'robert@example.com',
      role: 'manager',
      department: 'Project Management',
      jobTitle: 'Technical Project Manager',
      isVerified: true,
      preferences: JSON.stringify({ theme: 'light', notifications: true, dashboardLayout: 'detailed' })
    },
    {
      username: 'jennifer_pm',
      password: 'manager123',
      passwordHash: '$2b$10$rBtRG.joMIfVKKWKPmwkJ.d0JD3bRnVJG9k5UHRqfJ2eb9y5H9BZG',
      email: 'jennifer@example.com',
      role: 'manager',
      department: 'Project Management',
      jobTitle: 'Agile Project Manager',
      isVerified: true,
      preferences: JSON.stringify({ theme: 'dark', notifications: true, dashboardLayout: 'compact' })
    },
    {
      username: 'william_pm',
      password: 'manager123',
      passwordHash: '$2b$10$rBtRG.joMIfVKKWKPmwkJ.d0JD3bRnVJG9k5UHRqfJ2eb9y5H9BZG',
      email: 'william@example.com',
      role: 'manager',
      department: 'Project Management',
      jobTitle: 'Program Manager',
      isVerified: true,
      preferences: JSON.stringify({ theme: 'light', notifications: true, dashboardLayout: 'detailed' })
    },
    {
      username: 'emily_pm',
      password: 'manager123',
      passwordHash: '$2b$10$rBtRG.joMIfVKKWKPmwkJ.d0JD3bRnVJG9k5UHRqfJ2eb9y5H9BZG',
      email: 'emily@example.com',
      role: 'manager',
      department: 'Project Management',
      jobTitle: 'Product Owner',
      isVerified: true,
      preferences: JSON.stringify({ theme: 'dark', notifications: false, dashboardLayout: 'compact' })
    },
    {
      username: 'daniel_pm',
      password: 'manager123',
      passwordHash: '$2b$10$rBtRG.joMIfVKKWKPmwkJ.d0JD3bRnVJG9k5UHRqfJ2eb9y5H9BZG',
      email: 'daniel@example.com',
      role: 'manager',
      department: 'Project Management',
      jobTitle: 'Scrum Master',
      isVerified: true,
      preferences: JSON.stringify({ theme: 'light', notifications: true, dashboardLayout: 'detailed' })
    }
  ];
  
  db.serialize(() => {
    // Use a transaction for all inserts
    db.run('BEGIN TRANSACTION');
    
    // Prepare the statement outside the loop
    const userStmt = db.prepare(
      'INSERT INTO user (username, password, passwordHash, email, role, department, jobTitle, isVerified, preferences) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    
    try {
      // Insert users and collect their IDs
      users.forEach((user, index) => {
        userStmt.run(
          user.username,
          user.password,
          user.passwordHash,
          user.email,
          user.role,
          user.department,
          user.jobTitle,
          user.isVerified ? 1 : 0,
          user.preferences,
          function(err) {
            if (err) {
              console.error(`Error creating user ${user.username}:`, err);
              return;
            }
            
            const userId = this.lastID;
            console.log(`Created user: ${user.username} with ID ${userId}`);
            
            // If this is the last user, commit and close
            if (index === users.length - 1) {
              db.run('COMMIT', (err) => {
                if (err) {
                  console.error('Error committing transaction:', err);
                } else {
                  console.log('User seeding completed successfully!');
                }
                db.close();
              });
            }
          }
        );
      });
    } finally {
      userStmt.finalize();
    }
  });
}

// Export the seeding function so it can be called from server startup
module.exports = seedUsers;

// If this script is run directly, execute the seeding
if (require.main === module) {
  seedUsers();
}