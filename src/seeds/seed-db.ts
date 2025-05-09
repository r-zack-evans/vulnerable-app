import * as sqlite3 from 'sqlite3';
const { Database } = sqlite3.verbose();

// Import the seedUsers function
import seedUsers from './seed-users';

// Define types for project and task data
interface Project {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  completionPercentage: number;
  ownerId?: number;
  managerId?: number;
  clientId?: number;
}

interface Task {
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  estimatedHours: number;
  actualHours: number;
  isCompleted: boolean;
}

// Function to seed the database with example projects and tasks
function seedDatabase(): void {
  console.log('Preparing database for seeding...');
  
  // First seed users if needed, then proceed with other data
  try {
    // Use a setTimeout to ensure user seed process has closed its connection
    seedUsers();
    
    // Wait a moment to avoid database locking issues
    setTimeout(() => {
      const db = new Database('./vuln_app.sqlite');
      // Clear existing data and seed fresh data
      clearAndSeedData(db);
    }, 1000);
  } catch (error) {
    console.error('Error in database seeding:', error);
  }
}

// Function to clear existing data and seed fresh data
function clearAndSeedData(db: sqlite3.Database): void {
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
      const proceedWithSampleData = (): void => {
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
function createProjects(db: sqlite3.Database): void {
  // Sample project data
  const projects: Project[] = [
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
  
  // Create task_assignment table if it doesn't exist
  db.run(`
  CREATE TABLE IF NOT EXISTS task_assignment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    taskId INTEGER NOT NULL,
    userId INTEGER NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (taskId) REFERENCES task(id),
    FOREIGN KEY (userId) REFERENCES user(id)
  )`);

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
          function(this: sqlite3.RunResult, err: Error | null) {
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

// Get engineers by job title, returns a list of user IDs
function getEngineersByJobTitle(db: sqlite3.Database, jobTitle: string, callback: (userIds: number[]) => void): void {
  const query = "SELECT id FROM user WHERE jobTitle LIKE ? AND department = 'Engineering'";
  db.all(query, [`%${jobTitle}%`], (err, rows: {id: number}[]) => {
    if (err) {
      console.error(`Error fetching engineers with job title ${jobTitle}:`, err);
      callback([]);
      return;
    }
    callback(rows.map(row => row.id));
  });
}

// Get all engineers
function getAllEngineers(db: sqlite3.Database, callback: (userIds: {id: number, jobTitle: string}[]) => void): void {
  const query = "SELECT id, jobTitle FROM user WHERE department = 'Engineering' AND (jobTitle LIKE '%Engineer%' OR jobTitle LIKE '%Developer%')";
  db.all(query, [], (err, rows: {id: number, jobTitle: string}[]) => {
    if (err) {
      console.error('Error fetching all engineers:', err);
      callback([]);
      return;
    }
    callback(rows);
  });
}

// Function to assign engineers to a task based on task description and engineer specialties
function assignEngineersToTask(db: sqlite3.Database, taskId: number, task: Task): void {
  // Get all engineers
  getAllEngineers(db, (engineers) => {
    if (engineers.length === 0) {
      console.log('No engineers available to assign to tasks');
      return;
    }
    
    let assignedEngineers: number[] = [];
    
    // Match engineers based on task content and their job title
    if (task.title.includes('API') || task.description.includes('API')) {
      // Find backend developers or software engineers
      const backendDevs = engineers.filter(eng => 
        eng.jobTitle.includes('Backend') || 
        eng.jobTitle === 'Software Engineer');
      
      if (backendDevs.length > 0) {
        assignedEngineers.push(backendDevs[Math.floor(Math.random() * backendDevs.length)].id);
      }
    } else if (task.title.includes('Database') || task.description.includes('Database')) {
      // Find database engineers
      const dbEngineers = engineers.filter(eng => eng.jobTitle.includes('Database'));
      
      if (dbEngineers.length > 0) {
        assignedEngineers.push(dbEngineers[Math.floor(Math.random() * dbEngineers.length)].id);
      } else {
        // If no database engineers, assign backend developers
        const backendDevs = engineers.filter(eng => eng.jobTitle.includes('Backend'));
        if (backendDevs.length > 0) {
          assignedEngineers.push(backendDevs[Math.floor(Math.random() * backendDevs.length)].id);
        }
      }
    } else if (task.title.includes('Security') || task.description.includes('Security') || task.description.includes('Authentication')) {
      // Find security engineers
      const securityEngineers = engineers.filter(eng => eng.jobTitle.includes('Security'));
      
      if (securityEngineers.length > 0) {
        assignedEngineers.push(securityEngineers[Math.floor(Math.random() * securityEngineers.length)].id);
      }
    } else if (task.title.includes('Frontend') || task.description.includes('UI') || task.description.includes('UX')) {
      // Find frontend developers
      const frontendDevs = engineers.filter(eng => eng.jobTitle.includes('Frontend'));
      
      if (frontendDevs.length > 0) {
        assignedEngineers.push(frontendDevs[Math.floor(Math.random() * frontendDevs.length)].id);
      }
    } else if (task.title.includes('Test') || task.description.includes('Test') || task.description.includes('QA')) {
      // Find QA engineers
      const qaEngineers = engineers.filter(eng => eng.jobTitle.includes('QA'));
      
      if (qaEngineers.length > 0) {
        assignedEngineers.push(qaEngineers[Math.floor(Math.random() * qaEngineers.length)].id);
      }
    }
    
    // If no specific engineer was assigned, assign a random engineer
    if (assignedEngineers.length === 0) {
      assignedEngineers.push(engineers[Math.floor(Math.random() * engineers.length)].id);
    }
    
    // Create task assignments for each assigned engineer
    assignedEngineers.forEach(engId => {
      db.run(
        'INSERT INTO task_assignment (taskId, userId) VALUES (?, ?)',
        [taskId, engId],
        (err) => {
          if (err) {
            console.error(`Error assigning engineer ${engId} to task ${taskId}:`, err);
          } else {
            console.log(`Assigned engineer ${engId} to task ${taskId}`);
          }
        }
      );
    });
  });
}

// Create tasks for a specific project
function createTasksForProject(db: sqlite3.Database, projectId: number, projectName: string, isLast: boolean): void {
  let tasks: Task[] = [];
  
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
        function(this: sqlite3.RunResult, err: Error | null) {
          if (err) {
            console.error(`Error creating task ${task.title}:`, err);
          } else {
            console.log(`Created task: ${task.title} for project ${projectId}`);
            
            // Get the task ID
            const taskId = this.lastID;
            
            // Assign at least one engineer to the task
            assignEngineersToTask(db, taskId, task);
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
export default seedDatabase;

// If this script is run directly, execute the seeding
if (require.main === module) {
  seedDatabase();
}