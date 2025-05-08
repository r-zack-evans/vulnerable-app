const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./vuln_app.sqlite');

// Check if we have any projects to attach tasks to
db.serialize(() => {
  db.get("SELECT COUNT(*) as count FROM project", (err, row) => {
    if (err) {
      console.error('Error checking projects:', err);
      db.close();
      return;
    }
    
    if (row.count === 0) {
      // Create a few sample projects first
      createSampleProjects(() => {
        createTasks();
      });
    } else {
      // If projects exist, just create tasks
      createTasks();
    }
  });
});

function createSampleProjects(callback) {
  console.log('Creating sample projects...');
  
  const projects = [
    {
      name: 'API Gateway Migration',
      description: 'Migrate our legacy API gateway to a modern microservices architecture using Kong.',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'In Progress',
      completionPercentage: 25
    },
    {
      name: 'Database Upgrade to PostgreSQL 14',
      description: 'Upgrade our production databases from PostgreSQL 12 to 14 with minimal downtime.',
      startDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Not Started',
      completionPercentage: 0
    },
    {
      name: 'Third-Party Payment Integration',
      description: 'Integrate our platform with Stripe, PayPal, and other payment providers to support multi-currency transactions.',
      startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'In Progress',
      completionPercentage: 40
    }
  ];
  
  let completed = 0;
  
  projects.forEach(project => {
    db.run(
      'INSERT INTO project (name, description, startDate, endDate, status, completionPercentage) VALUES (?, ?, ?, ?, ?, ?)',
      [project.name, project.description, project.startDate, project.endDate, project.status, project.completionPercentage],
      function(err) {
        if (err) {
          console.error('Error creating project:', err);
        } else {
          console.log(`Created project: ${project.name} with ID ${this.lastID}`);
        }
        
        completed++;
        if (completed === projects.length) {
          callback();
        }
      }
    );
  });
}

function createTasks() {
  console.log('Creating project tasks...');
  
  // First, get all project IDs
  db.all("SELECT id, name FROM project", (err, projects) => {
    if (err) {
      console.error('Error fetching projects:', err);
      db.close();
      return;
    }
    
    if (projects.length === 0) {
      console.error('No projects found to attach tasks to');
      db.close();
      return;
    }
    
    // Create tasks for each project
    projects.forEach(project => {
      createTasksForProject(project.id, project.name);
    });
  });
}

function createTasksForProject(projectId, projectName) {
  // Generate tasks based on project type
  let tasks = [];
  
  if (projectName.includes('API') || projectName.includes('Migration')) {
    tasks = [
      {
        title: 'Document Current API Architecture',
        description: 'Create comprehensive documentation of our current API architecture, including endpoints, authentication methods, and rate limiting.',
        status: 'Complete',
        priority: 'High',
        dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedHours: 20,
        actualHours: 24
      },
      {
        title: 'Evaluate Gateway Solutions',
        description: 'Research and compare Kong, AWS API Gateway, and Apigee. Prepare a report with pros/cons and cost analysis.',
        status: 'Complete',
        priority: 'High',
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedHours: 16,
        actualHours: 12
      },
      {
        title: 'Develop Migration Strategy',
        description: 'Create a phased migration plan that minimizes disruption to existing services.',
        status: 'In Progress',
        priority: 'Critical',
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedHours: 24,
        actualHours: 8
      },
      {
        title: 'Set Up Kong Development Environment',
        description: 'Configure Kong in development environment with Docker containers for testing.',
        status: 'Not Started',
        priority: 'Medium',
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedHours: 12,
        actualHours: 0
      },
      {
        title: 'Implement Authentication Microservice',
        description: 'Develop a dedicated microservice for API key management and OAuth flows.',
        status: 'Not Started',
        priority: 'High',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedHours: 40,
        actualHours: 0
      }
    ];
  } else if (projectName.includes('Database') || projectName.includes('PostgreSQL')) {
    tasks = [
      {
        title: 'Perform Database Health Check',
        description: 'Run diagnostics on current databases to identify potential issues before upgrade.',
        status: 'Not Started',
        priority: 'Critical',
        dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedHours: 8,
        actualHours: 0
      },
      {
        title: 'Set Up Test Environment',
        description: 'Create a clone of production databases on PostgreSQL 14 for testing application compatibility.',
        status: 'Not Started',
        priority: 'High',
        dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedHours: 16,
        actualHours: 0
      },
      {
        title: 'Identify Breaking Changes',
        description: 'Review PostgreSQL 14 release notes and identify potential breaking changes that may affect our applications.',
        status: 'Not Started',
        priority: 'High',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedHours: 12,
        actualHours: 0
      },
      {
        title: 'Develop Upgrade Runbook',
        description: 'Create a detailed runbook for the upgrade process, including rollback procedures.',
        status: 'Not Started',
        priority: 'Medium',
        dueDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedHours: 24,
        actualHours: 0
      },
      {
        title: 'Run Performance Benchmarks',
        description: 'Benchmark application performance before and after upgrade to identify optimizations.',
        status: 'Not Started',
        priority: 'Medium',
        dueDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedHours: 20,
        actualHours: 0
      }
    ];
  } else if (projectName.includes('Payment') || projectName.includes('Integration')) {
    tasks = [
      {
        title: 'Finalize Payment Provider Requirements',
        description: 'Document specific requirements for each payment gateway integration, including supported currencies and payment methods.',
        status: 'Complete',
        priority: 'High',
        dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedHours: 16,
        actualHours: 14
      },
      {
        title: 'Implement Stripe Integration',
        description: 'Develop and test the Stripe payment processing flow, including webhook handlers for payment events.',
        status: 'In Progress',
        priority: 'Critical',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedHours: 32,
        actualHours: 20
      },
      {
        title: 'Implement PayPal Integration',
        description: 'Develop and test the PayPal payment flow, including Express Checkout and subscription billing.',
        status: 'Not Started',
        priority: 'High',
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedHours: 32,
        actualHours: 0
      },
      {
        title: 'Develop Payment Abstraction Layer',
        description: 'Create a unified API interface for all payment providers to simplify future integrations.',
        status: 'In Progress',
        priority: 'Medium',
        dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedHours: 40,
        actualHours: 12
      },
      {
        title: 'Implement Fraud Detection System',
        description: 'Integrate with third-party fraud detection service to flag suspicious transactions.',
        status: 'Not Started',
        priority: 'Medium',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedHours: 32,
        actualHours: 0
      }
    ];
  } else {
    // Generic tasks for any other project type
    tasks = [
      {
        title: 'Technical Requirements Gathering',
        description: 'Document all technical requirements and dependencies for the project.',
        status: 'In Progress',
        priority: 'High',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedHours: 20,
        actualHours: 8
      },
      {
        title: 'Architecture Design',
        description: 'Create high-level and detailed architecture diagrams for the implementation.',
        status: 'Not Started',
        priority: 'Critical',
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedHours: 24,
        actualHours: 0
      },
      {
        title: 'Development Sprint 1',
        description: 'Implement core functionality according to sprint planning.',
        status: 'Not Started',
        priority: 'High',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedHours: 80,
        actualHours: 0
      },
      {
        title: 'QA Test Plan Development',
        description: 'Create comprehensive test plans covering all aspects of the implementation.',
        status: 'Not Started',
        priority: 'Medium',
        dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedHours: 16,
        actualHours: 0
      },
      {
        title: 'Documentation',
        description: 'Create user and developer documentation for all implemented features.',
        status: 'Not Started',
        priority: 'Medium',
        dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedHours: 32,
        actualHours: 0
      }
    ];
  }
  
  // Insert tasks into database
  const insertPromises = tasks.map(task => {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO task (title, description, projectId, status, priority, dueDate, estimatedHours, actualHours) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          task.title,
          task.description,
          projectId,
          task.status,
          task.priority,
          task.dueDate,
          task.estimatedHours,
          task.actualHours
        ],
        function(err) {
          if (err) {
            console.error(`Error creating task: ${task.title}`, err);
            reject(err);
          } else {
            console.log(`Created task: ${task.title} for project ${projectId}`);
            resolve(this.lastID);
          }
        }
      );
    });
  });
  
  Promise.all(insertPromises)
    .then(() => {
      console.log(`All tasks created for project ${projectId}`);
    })
    .catch(err => {
      console.error('Error creating tasks:', err);
    })
    .finally(() => {
      // Don't close the database here, as we might have multiple projects
    });
}