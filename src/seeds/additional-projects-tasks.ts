import * as sqlite3 from 'sqlite3';
const { Database } = sqlite3.verbose();

// Define types for project data
interface Project {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  completionPercentage: number;
  ownerId?: number; // Add ownerId field for project manager assignment
}

// Define types for task data
interface Task {
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  estimatedHours: number;
  actualHours: number;
}

// Function to add additional projects to the database
export function addAdditionalProjects(): void {
  console.log('Adding additional enterprise DevSecOps projects...');
  
  const db = new Database('./vuln_app.sqlite');
  
  // Get product managers to assign as project owners
  getUsersByRole(db, 'product_manager', (projectManagers) => {
    if (projectManagers.length === 0) {
      console.error('No product managers found to assign as project owners');
      db.close();
      return;
    }
    
    const additionalProjects: Project[] = [
      {
        name: 'Enterprise SAST/DAST Integration',
        description: 'Implement comprehensive Static and Dynamic Application Security Testing into our CI/CD pipeline to identify vulnerabilities earlier in the development lifecycle.',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'In Progress',
        completionPercentage: 15
      },
      {
        name: 'Kubernetes Security Hardening',
        description: 'Implement enhanced security controls across our Kubernetes clusters to ensure compliance with CIS Benchmarks and protect against container-based threats.',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'In Progress',
        completionPercentage: 35
      },
      {
        name: 'Distributed Tracing Implementation',
        description: 'Implement OpenTelemetry-based distributed tracing across our microservices architecture to improve observability and troubleshooting capabilities for our 100+ services.',
        startDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'Not Started',
        completionPercentage: 0
      },
      {
        name: 'Zero Trust Infrastructure Transition',
        description: 'Architect and implement a zero trust security model across our infrastructure to secure our enterprise applications and data against sophisticated threats.',
        startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'In Progress',
        completionPercentage: 20
      }
    ];
    
    let completed = 0;
    
    // Insert additional projects into the database
    additionalProjects.forEach((project, index) => {
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
            
            // Create tasks for this project
            createTasksForProject(db, this.lastID, project.name);
          }
          
          completed++;
          if (completed === additionalProjects.length) {
            // Don't close the database here as tasks are still being created asynchronously
            console.log('All additional projects created successfully.');
          }
        }
      );
    });
  });
  
  // Close database when process exits
  process.on('beforeExit', () => {
    console.log('Additional projects seeding complete. Closing database connection.');
    db.close();
  });
}

// Helper function to get users by role
function getUsersByRole(db: sqlite3.Database, role: string, callback: (users: {id: number, username: string, jobTitle: string}[]) => void): void {
  db.all("SELECT id, username, jobTitle FROM user WHERE role = ?", [role], (err, users: any[]) => {
    if (err) {
      console.error(`Error fetching ${role} users:`, err);
      callback([]);
      return;
    }
    callback(users || []);
  });
}

// Function to create tasks for a project
function createTasksForProject(db: sqlite3.Database, projectId: number, projectName: string): void {
  // Get engineers to assign to tasks
  getUsersByRole(db, 'user', (engineers) => {
    // Filter to include only engineers (from Engineering department)
    const actualEngineers = engineers.filter(user => 
      user.jobTitle.includes('Engineer') || 
      user.jobTitle.includes('Developer'));
    
    if (actualEngineers.length === 0) {
      console.error('No engineers found to assign to tasks');
      return;
    }
    
    // Tasks for SAST/DAST Integration project
    let tasks: Task[] = [];
    
    if (projectName.includes('SAST/DAST')) {
      tasks = [
        {
          title: 'Security Tools Evaluation',
          description: 'Evaluate enterprise-grade SAST and DAST security tools like Fortify, Veracode, and Checkmarx. Produce a comparative analysis report.',
          status: 'Complete',
          priority: 'Critical',
          dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          estimatedHours: 32,
          actualHours: 40
        },
        {
          title: 'CI/CD Pipeline Integration Architecture',
          description: 'Design the architecture for integrating security scanning into the CI/CD pipeline with minimal performance impact.',
          status: 'In Progress',
          priority: 'High',
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          estimatedHours: 40,
          actualHours: 20
        },
        {
          title: 'Custom Rule Development',
          description: 'Develop custom scanning rules that align with our organization\'s secure coding standards and compliance requirements.',
          status: 'Not Started',
          priority: 'Medium',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          estimatedHours: 60,
          actualHours: 0
        },
        {
          title: 'False Positive Management System',
          description: 'Implement a system to track, validate, and suppress false positives to reduce security noise for development teams.',
          status: 'Not Started',
          priority: 'High',
          dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          estimatedHours: 50,
          actualHours: 0
        },
        {
          title: 'Developer Security Training',
          description: 'Develop training materials to help developers understand security scan results and remediation techniques.',
          status: 'Not Started',
          priority: 'Medium',
          dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          estimatedHours: 30,
          actualHours: 0
        },
        {
          title: 'Automated Security Reporting Dashboard',
          description: 'Create an executive dashboard showing security posture, vulnerability trends, and compliance status across all development teams.',
          status: 'Not Started',
          priority: 'Medium',
          dueDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          estimatedHours: 45,
          actualHours: 0
        }
      ];
    } else if (projectName.includes('Kubernetes')) {
      tasks = [
        {
          title: 'Kubernetes Security Assessment',
          description: 'Perform a comprehensive security assessment of existing Kubernetes clusters against CIS Benchmarks and NIST standards.',
          status: 'Complete',
          priority: 'Critical',
          dueDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          estimatedHours: 40,
          actualHours: 45
        },
        {
          title: 'Network Policy Implementation',
          description: 'Design and implement network policies to enforce pod-to-pod communication restrictions following least privilege principles.',
          status: 'In Progress',
          priority: 'High',
          dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          estimatedHours: 35,
          actualHours: 15
        },
        {
          title: 'Secret Management Solution',
          description: 'Integrate an enterprise secret management solution (HashiCorp Vault) with Kubernetes to securely manage and rotate sensitive credentials.',
          status: 'In Progress',
          priority: 'Critical',
          dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          estimatedHours: 50,
          actualHours: 20
        },
        {
          title: 'Image Scanning Pipeline',
          description: 'Implement automated container image scanning to detect vulnerabilities before deployment to production.',
          status: 'Not Started',
          priority: 'High',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          estimatedHours: 30,
          actualHours: 0
        },
        {
          title: 'Runtime Security Monitoring',
          description: 'Deploy a runtime security solution to detect and respond to suspicious activities within containers and pods.',
          status: 'Not Started',
          priority: 'Medium',
          dueDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          estimatedHours: 45,
          actualHours: 0
        },
        {
          title: 'Security Compliance Automation',
          description: 'Develop automated compliance checks and reporting for regulatory requirements (SOC2, HIPAA, GDPR) in Kubernetes environments.',
          status: 'Not Started',
          priority: 'Medium',
          dueDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          estimatedHours: 40,
          actualHours: 0
        }
      ];
    } else if (projectName.includes('Distributed Tracing')) {
      tasks = [
        {
          title: 'Tracing Strategy Definition',
          description: 'Define the enterprise tracing strategy and standards, including span naming conventions and metadata enrichment policies.',
          status: 'Not Started',
          priority: 'High',
          dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          estimatedHours: 25,
          actualHours: 0
        },
        {
          title: 'OpenTelemetry Collector Configuration',
          description: 'Set up and configure OpenTelemetry collectors for efficient trace data collection, sampling, and processing.',
          status: 'Not Started',
          priority: 'Critical',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          estimatedHours: 40,
          actualHours: 0
        },
        {
          title: 'Service Instrumentation Framework',
          description: 'Create a framework and libraries to standardize service instrumentation across multiple programming languages (Java, Go, JavaScript, Python).',
          status: 'Not Started',
          priority: 'High',
          dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          estimatedHours: 80,
          actualHours: 0
        },
        {
          title: 'Database and Messaging Tracing',
          description: 'Implement tracing for database operations and message broker interactions to gain visibility into data flow bottlenecks.',
          status: 'Not Started',
          priority: 'Medium',
          dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          estimatedHours: 50,
          actualHours: 0
        },
        {
          title: 'Trace Analysis Dashboards',
          description: 'Develop custom dashboards for trace analysis, service dependency mapping, and performance hotspot identification.',
          status: 'Not Started',
          priority: 'Medium',
          dueDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          estimatedHours: 35,
          actualHours: 0
        },
        {
          title: 'Tracing-Based Alerting',
          description: 'Implement intelligent alerting based on trace data to identify service degradation and failure patterns.',
          status: 'Not Started',
          priority: 'Low',
          dueDate: new Date(Date.now() + 130 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          estimatedHours: 30,
          actualHours: 0
        }
      ];
    } else if (projectName.includes('Zero Trust')) {
      tasks = [
        {
          title: 'Zero Trust Architecture Design',
          description: 'Develop the enterprise architecture for zero trust implementation, including identity verification, device validation, and access control.',
          status: 'Complete',
          priority: 'Critical',
          dueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          estimatedHours: 60,
          actualHours: 70
        },
        {
          title: 'Identity Provider Integration',
          description: 'Enhance our identity provider integration to support advanced authentication methods including biometrics and hardware security keys.',
          status: 'In Progress',
          priority: 'High',
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          estimatedHours: 45,
          actualHours: 20
        },
        {
          title: 'Micro-Segmentation Implementation',
          description: 'Design and implement network micro-segmentation to limit lateral movement within the corporate environment.',
          status: 'In Progress',
          priority: 'Critical',
          dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          estimatedHours: 90,
          actualHours: 30
        },
        {
          title: 'Continuous Access Evaluation',
          description: 'Implement real-time access policy evaluation based on user behavior, device posture, and environmental factors.',
          status: 'Not Started',
          priority: 'High',
          dueDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          estimatedHours: 70,
          actualHours: 0
        },
        {
          title: 'Data Protection Controls',
          description: 'Deploy enhanced data protection controls including DLP integration and real-time data classification.',
          status: 'Not Started',
          priority: 'Medium',
          dueDate: new Date(Date.now() + 105 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          estimatedHours: 55,
          actualHours: 0
        },
        {
          title: 'Zero Trust Monitoring & Analytics',
          description: 'Implement comprehensive monitoring and analytics to detect anomalies and potential security incidents in the zero trust environment.',
          status: 'Not Started',
          priority: 'Medium',
          dueDate: new Date(Date.now() + 135 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          estimatedHours: 65,
          actualHours: 0
        },
        {
          title: 'Legacy System Integration',
          description: 'Develop adapters and proxies to integrate legacy systems into the zero trust architecture without major refactoring.',
          status: 'Not Started',
          priority: 'High',
          dueDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          estimatedHours: 80,
          actualHours: 0
        }
      ];
    }
    
    // Function to assign appropriate engineers to tasks based on task content and engineer specialty
    function assignEngineersToTask(task: Task): number[] {
      const assignedEngineers: number[] = [];
      
      // Ensure we assign at least 4 team members (per requirements)
      const requiredEngineers = 4;
      
      // Find appropriate engineers based on the task
      let potentialEngineers: any[] = [];
      
      // Match engineers based on task specialization
      if (task.title.includes('Security') || task.description.includes('Security') || 
          task.title.includes('SAST') || task.title.includes('DAST') || 
          task.title.includes('Compliance') || task.title.includes('Zero Trust')) {
        // Find security engineers
        potentialEngineers = actualEngineers.filter(eng => 
          eng.jobTitle.includes('Security') || 
          eng.jobTitle === 'Software Engineer');
      } else if (task.title.includes('Kubernetes') || task.description.includes('Kubernetes') || 
                 task.title.includes('Container') || task.description.includes('Container')) {
        // Find DevOps engineers
        potentialEngineers = actualEngineers.filter(eng => 
          eng.jobTitle.includes('DevOps') || 
          eng.jobTitle === 'Systems Engineer');
      } else if (task.title.includes('Tracing') || task.description.includes('Tracing') || 
                 task.title.includes('Telemetry') || task.description.includes('OpenTelemetry')) {
        // Find backend/systems engineers
        potentialEngineers = actualEngineers.filter(eng => 
          eng.jobTitle.includes('Backend') || 
          eng.jobTitle === 'Systems Engineer');
      } else if (task.title.includes('Database') || task.description.includes('Database')) {
        // Find database engineers
        potentialEngineers = actualEngineers.filter(eng => 
          eng.jobTitle.includes('Database') || 
          eng.jobTitle === 'Backend Developer');
      } else if (task.title.includes('Dashboard') || task.description.includes('Dashboard') ||
                 task.title.includes('UI') || task.description.includes('UI')) {
        // Find frontend engineers
        potentialEngineers = actualEngineers.filter(eng => 
          eng.jobTitle.includes('Frontend') || 
          eng.jobTitle === 'Software Engineer');
      } else {
        // Default to all engineers for general tasks
        potentialEngineers = actualEngineers;
      }
      
      // If we don't have enough specific engineers, add general engineers
      if (potentialEngineers.length < requiredEngineers) {
        const generalEngineers = actualEngineers.filter(eng => 
          eng.jobTitle === 'Software Engineer' || 
          eng.jobTitle === 'Systems Engineer');
          
        potentialEngineers = [...new Set([...potentialEngineers, ...generalEngineers])];
      }
      
      // If we still don't have enough engineers, use all available engineers
      if (potentialEngineers.length < requiredEngineers) {
        potentialEngineers = actualEngineers;
      }
      
      // Assign engineers to task (minimum 4, but more for complex tasks)
      const engineersToAssign = Math.max(
        requiredEngineers,
        Math.min(potentialEngineers.length, task.priority === 'Critical' ? 6 : 4)
      );
      
      // Randomly select engineers from potential pool
      const selectedEngineers = [];
      for (let i = 0; i < engineersToAssign && potentialEngineers.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * potentialEngineers.length);
        selectedEngineers.push(potentialEngineers[randomIndex].id);
        potentialEngineers.splice(randomIndex, 1); // Remove selected engineer from pool
      }
      
      return [...new Set(selectedEngineers)]; // Remove any duplicates
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
      });
  });
}

// If this script is run directly, execute the seeding
if (require.main === module) {
  console.log('Running additional projects seeding directly...');
  addAdditionalProjects();
  
  // Keep the process alive until all async operations complete
  process.on('beforeExit', () => {
    console.log('All seeding operations completed.');
  });
  
  // Add a safety timeout to ensure the process eventually exits
  setTimeout(() => {
    console.log('Forcing exit after timeout');
    process.exit(0);
  }, 10000);
}