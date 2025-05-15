import * as sqlite3 from 'sqlite3';
const { Database } = sqlite3.verbose();

interface Project {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  completionPercentage: number;
  ownerId?: number; // Add ownerId field for project manager assignment
}

interface Task {
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  estimatedHours: number;
  actualHours: number;
}

const db = new Database('./vuln_app.sqlite');

// Check if we have any projects to attach tasks to
db.serialize(() => {
  db.get("SELECT COUNT(*) as count FROM project", (err, row: { count: number }) => {
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

// Function to get user IDs by role
function getUsersByRole(role: string, callback: (users: {id: number, username: string, jobTitle: string}[]) => void): void {
  db.all("SELECT id, username, jobTitle FROM user WHERE role = ?", [role], (err, users: any[]) => {
    if (err) {
      console.error(`Error fetching ${role} users:`, err);
      callback([]);
      return;
    }
    callback(users || []);
  });
}

function createSampleProjects(callback: () => void): void {
  console.log('Creating sample projects...');
  
  // Get product managers to assign as project owners
  getUsersByRole('product_manager', (projectManagers) => {
    if (projectManagers.length === 0) {
      console.error('No product managers found to assign as project owners');
      callback();
      return;
    }
    
    const projects: Project[] = [
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
  
  projects.forEach((project, index) => {
    // Assign a project manager as project owner (round-robin assignment)
    const ownerIndex = index % projectManagers.length;
    const owner = projectManagers[ownerIndex];
    
    db.run(
      'INSERT INTO project (name, description, startDate, endDate, status, completionPercentage, ownerId) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        project.name, 
        project.description, 
        project.startDate, 
        project.endDate, 
        project.status, 
        project.completionPercentage,
        owner.id  // Assign project manager as owner
      ],
      function(this: sqlite3.RunResult, err: Error | null) {
        if (err) {
          console.error('Error creating project:', err);
        } else {
          console.log(`Created project: ${project.name} with ID ${this.lastID}, owner: ${owner.username}`);
        }
        
        completed++;
        if (completed === projects.length) {
          callback();
        }
      }
    );
  });
});
}

function createTasks(): void {
  console.log('Creating project tasks...');
  
  // First, get all project IDs
  db.all("SELECT id, name FROM project", (err, projects: { id: number, name: string }[]) => {
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

function createTasksForProject(projectId: number, projectName: string): void {
  // Get all engineers to assign to tasks
  getUsersByRole('user', (engineers) => {
    // Filter to only include actual engineers (from Engineering department)
    const actualEngineers = engineers.filter(user => user.jobTitle.includes('Engineer') || 
                                                 user.jobTitle.includes('Developer'));
    
    if (actualEngineers.length === 0) {
      console.error('No engineers found to assign to tasks');
      return;
    }
  // Generate tasks based on project type
  let tasks: Task[] = [];
  
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
  
  // Function to assign appropriate engineers to tasks based on task content and engineer specialty
  function assignEngineersToTask(task: Task): number[] {
    const assignedEngineers: number[] = [];
    let additionalEngineers: number[] = [];
    
    // Match engineers based on task title/description and their job title
    if (task.title.includes('API') || task.description.includes('API')) {
      // Find backend developers or general software engineers
      const backendDevs = actualEngineers.filter(eng => 
        eng.jobTitle.includes('Backend') || 
        eng.jobTitle === 'Software Engineer');
      
      if (backendDevs.length > 0) {
        // Assign at least one backend developer
        assignedEngineers.push(backendDevs[Math.floor(Math.random() * backendDevs.length)].id);
        
        // For complex API tasks, add another backend developer
        if ((task.estimatedHours >= 24 || task.priority === 'Critical') && backendDevs.length > 1) {
          // Get a different backend developer
          let secondDev;
          do {
            secondDev = backendDevs[Math.floor(Math.random() * backendDevs.length)].id;
          } while (assignedEngineers.includes(secondDev));
          additionalEngineers.push(secondDev);
        }
      }
    } else if (task.title.includes('Database') || task.description.includes('Database')) {
      // Find database engineers
      const dbEngineers = actualEngineers.filter(eng => eng.jobTitle.includes('Database'));
      
      if (dbEngineers.length > 0) {
        assignedEngineers.push(dbEngineers[Math.floor(Math.random() * dbEngineers.length)].id);
        
        // For complex database tasks, add a backend developer as well
        if (task.estimatedHours >= 20 || task.priority === 'Critical' || task.priority === 'High') {
          const backendDevs = actualEngineers.filter(eng => eng.jobTitle.includes('Backend'));
          if (backendDevs.length > 0) {
            additionalEngineers.push(backendDevs[Math.floor(Math.random() * backendDevs.length)].id);
          }
        }
      } else {
        // If no database engineers, assign backend developers
        const backendDevs = actualEngineers.filter(eng => eng.jobTitle.includes('Backend'));
        if (backendDevs.length > 0) {
          assignedEngineers.push(backendDevs[Math.floor(Math.random() * backendDevs.length)].id);
        }
      }
    } else if (task.title.includes('Security') || task.description.includes('Security') || task.description.includes('Authentication')) {
      // Find security engineers
      const securityEngineers = actualEngineers.filter(eng => eng.jobTitle.includes('Security'));
      
      if (securityEngineers.length > 0) {
        assignedEngineers.push(securityEngineers[Math.floor(Math.random() * securityEngineers.length)].id);
        
        // For authentication tasks, also add a backend developer
        if (task.description.includes('Authentication')) {
          const backendDevs = actualEngineers.filter(eng => eng.jobTitle.includes('Backend'));
          if (backendDevs.length > 0) {
            additionalEngineers.push(backendDevs[Math.floor(Math.random() * backendDevs.length)].id);
          }
        }
      }
    } else if (task.title.includes('Frontend') || task.description.includes('UI') || task.description.includes('UX')) {
      // Find frontend developers
      const frontendDevs = actualEngineers.filter(eng => eng.jobTitle.includes('Frontend'));
      
      if (frontendDevs.length > 0) {
        assignedEngineers.push(frontendDevs[Math.floor(Math.random() * frontendDevs.length)].id);
        
        // For larger UI tasks, add another frontend developer
        if (task.estimatedHours >= 30 && frontendDevs.length > 1) {
          let secondDev;
          do {
            secondDev = frontendDevs[Math.floor(Math.random() * frontendDevs.length)].id;
          } while (assignedEngineers.includes(secondDev));
          additionalEngineers.push(secondDev);
        }
      }
    } else if (task.title.includes('Test') || task.description.includes('Test') || task.description.includes('QA')) {
      // Find QA engineers
      const qaEngineers = actualEngineers.filter(eng => eng.jobTitle.includes('QA'));
      
      if (qaEngineers.length > 0) {
        assignedEngineers.push(qaEngineers[Math.floor(Math.random() * qaEngineers.length)].id);
      }
    } else if (task.title.includes('Architecture') || task.description.includes('Architecture')) {
      // Assign System Engineers or Software Engineers for architecture tasks
      const sysEngineers = actualEngineers.filter(eng => 
        eng.jobTitle.includes('Systems Engineer') || 
        eng.jobTitle === 'Software Engineer');
      
      if (sysEngineers.length > 0) {
        assignedEngineers.push(sysEngineers[Math.floor(Math.random() * sysEngineers.length)].id);
      }
    } else if (task.title.includes('Documentation') || task.description.includes('Documentation')) {
      // Assign a mix of engineers for documentation tasks
      // Pick one engineer with expertise in the domain and one general engineer
      const randomEngineer = actualEngineers[Math.floor(Math.random() * actualEngineers.length)].id;
      assignedEngineers.push(randomEngineer);
    }
    
    // If no specific engineer was assigned, assign a random engineer
    if (assignedEngineers.length === 0) {
      assignedEngineers.push(actualEngineers[Math.floor(Math.random() * actualEngineers.length)].id);
    }
    
    // For high priority or complex tasks, ensure we have at least one more engineer
    if (additionalEngineers.length === 0 && 
        (task.priority === 'Critical' || task.estimatedHours >= 40)) {
      const availableEngineers = actualEngineers.filter(eng => 
        !assignedEngineers.includes(eng.id));
      
      if (availableEngineers.length > 0) {
        additionalEngineers.push(availableEngineers[Math.floor(Math.random() * availableEngineers.length)].id);
      }
    }
    
    // Combine assigned engineers and remove duplicates
    return [...new Set([...assignedEngineers, ...additionalEngineers])];
  }
  
  // Insert tasks into database
  const insertPromises: Promise<number>[] = tasks.map(task => {
    return new Promise<number>((resolve, reject) => {
      // Get assigned engineers for this task
      const assignedEngineers = assignEngineersToTask(task);
      
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
        function(this: sqlite3.RunResult, err: Error | null) {
          if (err) {
            console.error(`Error creating task: ${task.title}`, err);
            reject(err);
          } else {
            console.log(`Created task: ${task.title} for project ${projectId}`);
            
            // Now add task assignments for each assigned engineer
            const taskId = this.lastID;
            
            // Create an array of insertion promises for each assignment
            const assignmentPromises = assignedEngineers.map(engId => {
              return new Promise<void>((resolveAssignment, rejectAssignment) => {
                db.run(
                  'INSERT INTO task_assignment (taskId, userId) VALUES (?, ?)',
                  [taskId, engId],
                  function(err: Error | null) {
                    if (err) {
                      console.error(`Error assigning engineer ${engId} to task ${taskId}:`, err);
                      rejectAssignment(err);
                    } else {
                      console.log(`Assigned engineer ${engId} to task ${taskId}`);
                      resolveAssignment();
                    }
                  }
                );
              });
            });
            
            // Wait for all assignments to complete before resolving the task promise
            Promise.all(assignmentPromises)
              .then(() => resolve(taskId))
              .catch(err => reject(err));
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
  });
}

// For running directly
if (require.main === module) {
  // When finished with all projects, close the database
  process.on('beforeExit', () => {
    console.log('Seeding complete. Closing database connection.');
    db.close();
  });
}