const sqlite3 = require('sqlite3').verbose();

// Import the seedUsers function
const seedUsers = require('./seed-users');

// Function to seed the database with example projects and tasks
function seedDatabase() {
  console.log('Preparing database for seeding...');
  
  // First seed users if needed
  seedUsers();
  
  const db = new sqlite3.Database('./vuln_app.sqlite');
  
  // Clear existing data and seed fresh data
  clearAndSeedData(db);
}

// Function to clear existing data and seed fresh data
function clearAndSeedData(db) {
  console.log('Checking if project and task tables exist...');
  
  // Check if project table exists
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='project'", (err, projectRow) => {
    if (err) {
      console.error('Error checking for project table:', err);
      db.close();
      return;
    }
    
    // Check if task table exists
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='task'", (err, taskRow) => {
      if (err) {
        console.error('Error checking for task table:', err);
        db.close();
        return;
      }
      
      let tasksCleared = false;
      let projectsCleared = false;
      
      // Function to proceed when both tables are cleared
      const proceedWithSampleData = () => {
        if (tasksCleared && projectsCleared) {
          console.log('All tables cleared. Creating fresh sample data...');
          createProjects(db);
        }
      };
      
      // Clear task table if it exists
      if (taskRow) {
        console.log('Clearing existing task data...');
        db.run('DELETE FROM task', (err) => {
          if (err) {
            console.error('Error clearing task table:', err);
            db.close();
            return;
          }
          console.log('Task table cleared successfully.');
          tasksCleared = true;
          proceedWithSampleData();
        });
      } else {
        console.log('Task table not found. It will be created on app start.');
        tasksCleared = true;
        proceedWithSampleData();
      }
      
      // Clear project table if it exists
      if (projectRow) {
        console.log('Clearing existing project data...');
        db.run('DELETE FROM project', (err) => {
          if (err) {
            console.error('Error clearing project table:', err);
            db.close();
            return;
          }
          console.log('Project table cleared successfully.');
          projectsCleared = true;
          proceedWithSampleData();
        });
      } else {
        console.log('Project table not found. It will be created on app start.');
        projectsCleared = true;
        proceedWithSampleData();
      }
    });
  });
}

// Create sample projects
function createProjects(db) {
  // Sample project data
  const projects = [
    {
      name: 'API Gateway Migration',
      description: 'Migrate our legacy API gateway to a modern microservices architecture using Kong. This project involves documenting current APIs, selecting a new gateway technology, and implementing a phased migration strategy with minimal service disruption.',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'In Progress',
      completionPercentage: 25,
      ownerId: 3, // dev_lead
      managerId: 2 // project_manager
    },
    {
      name: 'Database Upgrade to PostgreSQL 14',
      description: 'Upgrade our production databases from PostgreSQL 12 to 14 with minimal downtime. This critical infrastructure project requires careful planning, extensive testing in staging environments, and a well-documented rollback strategy.',
      startDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Not Started',
      completionPercentage: 0,
      ownerId: 1, // admin_user
      managerId: 2 // project_manager
    },
    {
      name: 'Third-Party Payment Integration',
      description: 'Integrate our platform with Stripe, PayPal, and other payment providers to support multi-currency transactions. This project will enable our customers to accept payments in 15+ currencies and offer various payment methods including credit cards, digital wallets, and bank transfers.',
      startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'In Progress',
      completionPercentage: 40,
      ownerId: 2, // project_manager
      clientId: 5 // client_user
    }
  ];
  
  // Start a transaction for all the project and task creation
  db.run('BEGIN TRANSACTION');
  
  db.serialize(() => {
    // Prepare the statement outside the loop
    const projectStmt = db.prepare(
      'INSERT INTO project (name, description, startDate, endDate, status, completionPercentage, ownerId, managerId, clientId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    
    try {
      // Insert projects and collect their IDs
      projects.forEach((project, index) => {
        projectStmt.run(
          project.name,
          project.description,
          project.startDate,
          project.endDate,
          project.status,
          project.completionPercentage,
          project.ownerId || null,
          project.managerId || null,
          project.clientId || null,
          function(err) {
            if (err) {
              console.error(`Error creating project ${project.name}:`, err);
              return;
            }
            
            const projectId = this.lastID;
            console.log(`Created project: ${project.name} with ID ${projectId}`);
            
            // Create tasks for this project
            createTasksForProject(db, projectId, project.name, index === projects.length - 1);
          }
        );
      });
    } finally {
      projectStmt.finalize();
    }
  });
}

// Create tasks for a specific project
function createTasksForProject(db, projectId, projectName, isLast) {
  let tasks = [];
  
  // Task based on project type
  if (projectName.includes('API') || projectName.includes('Migration')) {
    tasks = [
      {
        title: 'Document Current API Architecture',
        description: 'Create comprehensive documentation of our current API architecture, including endpoints, authentication methods, and rate limiting. This documentation will serve as the foundation for our migration strategy.',
        status: 'Complete',
        priority: 'High',
        dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedHours: 20,
        actualHours: 24,
        isCompleted: true
      },
      {
        title: 'Evaluate Gateway Solutions',
        description: 'Research and compare Kong, AWS API Gateway, and Apigee. Prepare a report with pros/cons and cost analysis to determine the best solution for our specific needs and infrastructure.',
        status: 'Complete',
        priority: 'High',
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedHours: 16,
        actualHours: 12,
        isCompleted: true
      },
      {
        title: 'Develop Migration Strategy',
        description: 'Create a phased migration plan that minimizes disruption to existing services. This should include a timeline, resource allocation, and clear milestones for tracking progress.',
        status: 'In Progress',
        priority: 'Critical',
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedHours: 24,
        actualHours: 8,
        isCompleted: false
      },
      {
        title: 'Set Up Kong Development Environment',
        description: 'Configure Kong in development environment with Docker containers for testing. Ensure all developers can run a local version of the gateway for development and testing.',
        status: 'Not Started',
        priority: 'Medium',
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedHours: 12,
        actualHours: 0,
        isCompleted: false
      },
      {
        title: 'Implement Authentication Microservice',
        description: 'Develop a dedicated microservice for API key management and OAuth flows. This service will handle all authentication requests across our API ecosystem.',
        status: 'Not Started',
        priority: 'High',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedHours: 40,
        actualHours: 0,
        isCompleted: false
      }
    ];
  } else if (projectName.includes('Database') || projectName.includes('PostgreSQL')) {
    tasks = [
      {
        title: 'Perform Database Health Check',
        description: 'Run diagnostics on current databases to identify potential issues before upgrade. Generate a comprehensive report of current performance metrics, index usage, and query patterns.',
        status: 'Not Started',
        priority: 'Critical',
        dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedHours: 8,
        actualHours: 0,
        isCompleted: false
      },
      {
        title: 'Set Up Test Environment',
        description: 'Create a clone of production databases on PostgreSQL 14 for testing application compatibility. This environment should closely mirror production in terms of data volume and query patterns.',
        status: 'Not Started',
        priority: 'High',
        dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedHours: 16,
        actualHours: 0,
        isCompleted: false
      },
      {
        title: 'Identify Breaking Changes',
        description: 'Review PostgreSQL 14 release notes and identify potential breaking changes that may affect our applications. Develop test cases for each potential issue to verify compatibility.',
        status: 'Not Started',
        priority: 'High',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedHours: 12,
        actualHours: 0,
        isCompleted: false
      },
      {
        title: 'Develop Upgrade Runbook',
        description: 'Create a detailed runbook for the upgrade process, including rollback procedures. This document should be comprehensive enough that any DBA on the team could perform the upgrade.',
        status: 'Not Started',
        priority: 'Medium',
        dueDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedHours: 24,
        actualHours: 0,
        isCompleted: false
      },
      {
        title: 'Run Performance Benchmarks',
        description: 'Benchmark application performance before and after upgrade to identify optimizations. Compare query execution plans and response times to ensure the upgrade improves or maintains current performance.',
        status: 'Not Started',
        priority: 'Medium',
        dueDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedHours: 20,
        actualHours: 0,
        isCompleted: false
      }
    ];
  } else { // Payment Integration or other projects
    tasks = [
      {
        title: 'Finalize Payment Provider Requirements',
        description: 'Document specific requirements for each payment gateway integration, including supported currencies and payment methods. Create a compatibility matrix for all required features across providers.',
        status: 'Complete',
        priority: 'High',
        dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedHours: 16,
        actualHours: 14,
        isCompleted: true
      },
      {
        title: 'Implement Stripe Integration',
        description: 'Develop and test the Stripe payment processing flow, including webhook handlers for payment events. This integration should support one-time payments, subscriptions, and refunds.',
        status: 'In Progress',
        priority: 'Critical',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedHours: 32,
        actualHours: 20,
        isCompleted: false
      },
      {
        title: 'Implement PayPal Integration',
        description: 'Develop and test the PayPal payment flow, including Express Checkout and subscription billing. Ensure compliance with PayPal\'s security requirements and best practices.',
        status: 'Not Started',
        priority: 'High',
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedHours: 32,
        actualHours: 0,
        isCompleted: false
      },
      {
        title: 'Develop Payment Abstraction Layer',
        description: 'Create a unified API interface for all payment providers to simplify future integrations. This abstraction layer should handle the differences between payment gateways and present a consistent interface to our application.',
        status: 'In Progress',
        priority: 'Medium',
        dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedHours: 40,
        actualHours: 12,
        isCompleted: false
      },
      {
        title: 'Implement Fraud Detection System',
        description: 'Integrate with third-party fraud detection service to flag suspicious transactions. Develop rules and thresholds appropriate for our business model and customer base.',
        status: 'Not Started',
        priority: 'Medium',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedHours: 32,
        actualHours: 0,
        isCompleted: false
      }
    ];
  }
  
  // Create tasks for this project
  const taskStmt = db.prepare(
    'INSERT INTO task (title, description, projectId, status, priority, dueDate, estimatedHours, actualHours, isCompleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  
  try {
    tasks.forEach((task, index) => {
      taskStmt.run(
        task.title,
        task.description,
        projectId,
        task.status,
        task.priority,
        task.dueDate,
        task.estimatedHours,
        task.actualHours,
        task.isCompleted ? 1 : 0,
        function(err) {
          if (err) {
            console.error(`Error creating task ${task.title}:`, err);
          } else {
            console.log(`Created task: ${task.title} for project ${projectId}`);
          }
          
          // If this is the last task of the last project, signal completion
          if (isLast && index === tasks.length - 1) {
            console.log('Database seeding completed successfully!');
            
            // Commit the transaction and close the database
            db.run('COMMIT', (err) => {
              if (err) {
                console.error('Error committing transaction:', err);
                db.run('ROLLBACK', () => {
                  console.log('Transaction rolled back due to error.');
                  db.close();
                });
              } else {
                console.log('Transaction committed successfully!');
                db.close();
              }
            });
          }
        }
      );
    });
  } catch (err) {
    console.error('Error creating tasks:', err);
  } finally {
    taskStmt.finalize();
  }
}

// Export the seeding function so it can be called from server startup
module.exports = seedDatabase;

// If this script is run directly, execute the seeding
if (require.main === module) {
  seedDatabase();
}