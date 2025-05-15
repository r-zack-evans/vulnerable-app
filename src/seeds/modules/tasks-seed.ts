/**
 * Tasks Seed Module
 * 
 * Seeds tasks for all projects (both core and enterprise projects)
 * Consolidates previous task seeding logic
 */

import sqlite3 from 'sqlite3';

// Define interfaces
interface Task {
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: number | string; // can be relative days or absolute date string
  estimatedHours: number;
  actualHours: number;
}

interface Project {
  id: number;
  name: string;
}

interface User {
  id: number;
  username: string;
  jobTitle: string;
}

// Task data templates by project type
const taskTemplates: { [projectType: string]: Task[] } = {
  'API Gateway Migration': [
    {
      title: 'Document Current API Architecture',
      description: 'Create comprehensive documentation of our current API architecture, including endpoints, authentication methods, and rate limiting.',
      status: 'Complete',
      priority: 'High',
      dueDate: -15, // days relative to today
      estimatedHours: 20,
      actualHours: 24
    },
    {
      title: 'Evaluate Gateway Solutions',
      description: 'Research and compare Kong, AWS API Gateway, and Apigee. Prepare a report with pros/cons and cost analysis.',
      status: 'Complete',
      priority: 'High',
      dueDate: -5,
      estimatedHours: 16,
      actualHours: 12
    },
    {
      title: 'Develop Migration Strategy',
      description: 'Create a phased migration plan that minimizes disruption to existing services.',
      status: 'In Progress',
      priority: 'Critical',
      dueDate: 10,
      estimatedHours: 24,
      actualHours: 8
    },
    {
      title: 'Set Up Kong Development Environment',
      description: 'Configure Kong in development environment with Docker containers for testing.',
      status: 'Not Started',
      priority: 'Medium',
      dueDate: 15,
      estimatedHours: 12,
      actualHours: 0
    },
    {
      title: 'Implement Authentication Microservice',
      description: 'Develop a dedicated microservice for API key management and OAuth flows.',
      status: 'Not Started',
      priority: 'High',
      dueDate: 30,
      estimatedHours: 40,
      actualHours: 0
    }
  ],
  'Database Upgrade to PostgreSQL 14': [
    {
      title: 'Perform Database Health Check',
      description: 'Run diagnostics on current databases to identify potential issues before upgrade.',
      status: 'Not Started',
      priority: 'Critical',
      dueDate: 20,
      estimatedHours: 8,
      actualHours: 0
    },
    {
      title: 'Set Up Test Environment',
      description: 'Create a clone of production databases on PostgreSQL 14 for testing application compatibility.',
      status: 'Not Started',
      priority: 'High',
      dueDate: 25,
      estimatedHours: 16,
      actualHours: 0
    },
    {
      title: 'Identify Breaking Changes',
      description: 'Review PostgreSQL 14 release notes and identify potential breaking changes that may affect our applications.',
      status: 'Not Started',
      priority: 'High',
      dueDate: 30,
      estimatedHours: 12,
      actualHours: 0
    },
    {
      title: 'Develop Upgrade Runbook',
      description: 'Create a detailed runbook for the upgrade process, including rollback procedures.',
      status: 'Not Started',
      priority: 'Medium',
      dueDate: 40,
      estimatedHours: 24,
      actualHours: 0
    },
    {
      title: 'Run Performance Benchmarks',
      description: 'Benchmark application performance before and after upgrade to identify optimizations.',
      status: 'Not Started',
      priority: 'Medium',
      dueDate: 50,
      estimatedHours: 20,
      actualHours: 0
    }
  ],
  'Third-Party Payment Integration': [
    {
      title: 'Finalize Payment Provider Requirements',
      description: 'Document specific requirements for each payment gateway integration, including supported currencies and payment methods.',
      status: 'Complete',
      priority: 'High',
      dueDate: -10,
      estimatedHours: 16,
      actualHours: 14
    },
    {
      title: 'Implement Stripe Integration',
      description: 'Develop and test the Stripe payment processing flow, including webhook handlers for payment events.',
      status: 'In Progress',
      priority: 'Critical',
      dueDate: 5,
      estimatedHours: 32,
      actualHours: 20
    },
    {
      title: 'Implement PayPal Integration',
      description: 'Develop and test the PayPal payment flow, including Express Checkout and subscription billing.',
      status: 'Not Started',
      priority: 'High',
      dueDate: 15,
      estimatedHours: 32,
      actualHours: 0
    },
    {
      title: 'Develop Payment Abstraction Layer',
      description: 'Create a unified API interface for all payment providers to simplify future integrations.',
      status: 'In Progress',
      priority: 'Medium',
      dueDate: 20,
      estimatedHours: 40,
      actualHours: 12
    },
    {
      title: 'Implement Fraud Detection System',
      description: 'Integrate with third-party fraud detection service to flag suspicious transactions.',
      status: 'Not Started',
      priority: 'Medium',
      dueDate: 30,
      estimatedHours: 32,
      actualHours: 0
    }
  ],
  'Enterprise SAST/DAST Integration': [
    {
      title: 'Security Tools Evaluation',
      description: 'Evaluate enterprise-grade SAST and DAST security tools like Fortify, Veracode, and Checkmarx. Produce a comparative analysis report.',
      status: 'Complete',
      priority: 'Critical',
      dueDate: -10,
      estimatedHours: 32,
      actualHours: 40
    },
    {
      title: 'CI/CD Pipeline Integration Architecture',
      description: 'Design the architecture for integrating security scanning into the CI/CD pipeline with minimal performance impact.',
      status: 'In Progress',
      priority: 'High',
      dueDate: 15,
      estimatedHours: 40,
      actualHours: 20
    },
    {
      title: 'Custom Rule Development',
      description: 'Develop custom scanning rules that align with our organization\'s secure coding standards and compliance requirements.',
      status: 'Not Started',
      priority: 'Medium',
      dueDate: 30,
      estimatedHours: 60,
      actualHours: 0
    },
    {
      title: 'False Positive Management System',
      description: 'Implement a system to track, validate, and suppress false positives to reduce security noise for development teams.',
      status: 'Not Started',
      priority: 'High',
      dueDate: 45,
      estimatedHours: 50,
      actualHours: 0
    },
    {
      title: 'Developer Security Training',
      description: 'Develop training materials to help developers understand security scan results and remediation techniques.',
      status: 'Not Started',
      priority: 'Medium',
      dueDate: 60,
      estimatedHours: 30,
      actualHours: 0
    },
    {
      title: 'Automated Security Reporting Dashboard',
      description: 'Create an executive dashboard showing security posture, vulnerability trends, and compliance status across all development teams.',
      status: 'Not Started',
      priority: 'Medium',
      dueDate: 75,
      estimatedHours: 45,
      actualHours: 0
    }
  ],
  'Kubernetes Security Hardening': [
    {
      title: 'Kubernetes Security Assessment',
      description: 'Perform a comprehensive security assessment of existing Kubernetes clusters against CIS Benchmarks and NIST standards.',
      status: 'Complete',
      priority: 'Critical',
      dueDate: -20,
      estimatedHours: 40,
      actualHours: 45
    },
    {
      title: 'Network Policy Implementation',
      description: 'Design and implement network policies to enforce pod-to-pod communication restrictions following least privilege principles.',
      status: 'In Progress',
      priority: 'High',
      dueDate: 10,
      estimatedHours: 35,
      actualHours: 15
    },
    {
      title: 'Secret Management Solution',
      description: 'Integrate an enterprise secret management solution (HashiCorp Vault) with Kubernetes to securely manage and rotate sensitive credentials.',
      status: 'In Progress',
      priority: 'Critical',
      dueDate: 20,
      estimatedHours: 50,
      actualHours: 20
    },
    {
      title: 'Image Scanning Pipeline',
      description: 'Implement automated container image scanning to detect vulnerabilities before deployment to production.',
      status: 'Not Started',
      priority: 'High',
      dueDate: 30,
      estimatedHours: 30,
      actualHours: 0
    },
    {
      title: 'Runtime Security Monitoring',
      description: 'Deploy a runtime security solution to detect and respond to suspicious activities within containers and pods.',
      status: 'Not Started',
      priority: 'Medium',
      dueDate: 40,
      estimatedHours: 45,
      actualHours: 0
    },
    {
      title: 'Security Compliance Automation',
      description: 'Develop automated compliance checks and reporting for regulatory requirements (SOC2, HIPAA, GDPR) in Kubernetes environments.',
      status: 'Not Started',
      priority: 'Medium',
      dueDate: 50,
      estimatedHours: 40,
      actualHours: 0
    }
  ],
  'Distributed Tracing Implementation': [
    {
      title: 'Tracing Strategy Definition',
      description: 'Define the enterprise tracing strategy and standards, including span naming conventions and metadata enrichment policies.',
      status: 'Not Started',
      priority: 'High',
      dueDate: 20,
      estimatedHours: 25,
      actualHours: 0
    },
    {
      title: 'OpenTelemetry Collector Configuration',
      description: 'Set up and configure OpenTelemetry collectors for efficient trace data collection, sampling, and processing.',
      status: 'Not Started',
      priority: 'Critical',
      dueDate: 30,
      estimatedHours: 40,
      actualHours: 0
    },
    {
      title: 'Service Instrumentation Framework',
      description: 'Create a framework and libraries to standardize service instrumentation across multiple programming languages (Java, Go, JavaScript, Python).',
      status: 'Not Started',
      priority: 'High',
      dueDate: 60,
      estimatedHours: 80,
      actualHours: 0
    },
    {
      title: 'Database and Messaging Tracing',
      description: 'Implement tracing for database operations and message broker interactions to gain visibility into data flow bottlenecks.',
      status: 'Not Started',
      priority: 'Medium',
      dueDate: 90,
      estimatedHours: 50,
      actualHours: 0
    },
    {
      title: 'Trace Analysis Dashboards',
      description: 'Develop custom dashboards for trace analysis, service dependency mapping, and performance hotspot identification.',
      status: 'Not Started',
      priority: 'Medium',
      dueDate: 120,
      estimatedHours: 35,
      actualHours: 0
    },
    {
      title: 'Tracing-Based Alerting',
      description: 'Implement intelligent alerting based on trace data to identify service degradation and failure patterns.',
      status: 'Not Started',
      priority: 'Low',
      dueDate: 130,
      estimatedHours: 30,
      actualHours: 0
    }
  ],
  'Zero Trust Infrastructure Transition': [
    {
      title: 'Zero Trust Architecture Design',
      description: 'Develop the enterprise architecture for zero trust implementation, including identity verification, device validation, and access control.',
      status: 'Complete',
      priority: 'Critical',
      dueDate: -30,
      estimatedHours: 60,
      actualHours: 70
    },
    {
      title: 'Identity Provider Integration',
      description: 'Enhance our identity provider integration to support advanced authentication methods including biometrics and hardware security keys.',
      status: 'In Progress',
      priority: 'High',
      dueDate: 15,
      estimatedHours: 45,
      actualHours: 20
    },
    {
      title: 'Micro-Segmentation Implementation',
      description: 'Design and implement network micro-segmentation to limit lateral movement within the corporate environment.',
      status: 'In Progress',
      priority: 'Critical',
      dueDate: 45,
      estimatedHours: 90,
      actualHours: 30
    },
    {
      title: 'Continuous Access Evaluation',
      description: 'Implement real-time access policy evaluation based on user behavior, device posture, and environmental factors.',
      status: 'Not Started',
      priority: 'High',
      dueDate: 75,
      estimatedHours: 70,
      actualHours: 0
    },
    {
      title: 'Data Protection Controls',
      description: 'Deploy enhanced data protection controls including DLP integration and real-time data classification.',
      status: 'Not Started',
      priority: 'Medium',
      dueDate: 105,
      estimatedHours: 55,
      actualHours: 0
    },
    {
      title: 'Zero Trust Monitoring & Analytics',
      description: 'Implement comprehensive monitoring and analytics to detect anomalies and potential security incidents in the zero trust environment.',
      status: 'Not Started',
      priority: 'Medium',
      dueDate: 135,
      estimatedHours: 65,
      actualHours: 0
    },
    {
      title: 'Legacy System Integration',
      description: 'Develop adapters and proxies to integrate legacy systems into the zero trust architecture without major refactoring.',
      status: 'Not Started',
      priority: 'High',
      dueDate: 150,
      estimatedHours: 80,
      actualHours: 0
    }
  ]
};

/**
 * Get all projects from database
 * @param {sqlite3.Database} db - Database connection
 * @returns {Promise<Array<Project>>} - Array of projects
 */
async function getProjects(db: sqlite3.Database): Promise<Project[]> {
  return new Promise<Project[]>((resolve, reject) => {
    db.all('SELECT id, name FROM project', (err, projects: Project[]) => {
      if (err) return reject(err);
      if (!projects || projects.length === 0) {
        return reject(new Error('No projects found to attach tasks to'));
      }
      resolve(projects);
    });
  });
}

/**
 * Get engineers for task assignment
 * @param {sqlite3.Database} db - Database connection
 * @returns {Promise<Array<User>>} - Array of engineers
 */
async function getEngineers(db: sqlite3.Database): Promise<User[]> {
  return new Promise<User[]>((resolve, reject) => {
    db.all("SELECT id, username, jobTitle FROM user WHERE role = 'user' AND (jobTitle LIKE '%Engineer%' OR jobTitle LIKE '%Developer%')", 
      (err, engineers: User[]) => {
        if (err) return reject(err);
        if (!engineers || engineers.length === 0) {
          return reject(new Error('No engineers found to assign to tasks'));
        }
        resolve(engineers);
      });
  });
}

/**
 * Calculate absolute due date from relative days
 * @param {number|string} relativeDays - Days relative to today or absolute date string
 * @returns {string} - ISO date string (YYYY-MM-DD)
 */
function calculateDueDate(relativeDays: number | string): string {
  if (typeof relativeDays === 'string') return relativeDays;
  
  const date = new Date();
  date.setDate(date.getDate() + relativeDays);
  return date.toISOString().split('T')[0];
}

/**
 * Assign engineers to a task based on specialty and task content
 * @param {Task} task - Task object
 * @param {Array<User>} engineers - Array of engineers
 * @param {string} projectName - Project name for context
 * @returns {Array<number>} - Array of engineer IDs to assign
 */
function assignEngineersToTask(task: Task, engineers: User[], projectName: string): number[] {
  // Always assign at least 4 team members (per requirements)
  const minEngineers = 4;
  let potentialEngineers: User[] = [];
  
  // Match engineers based on specialization
  if (task.title.includes('Security') || task.description.includes('Security') || 
      projectName.includes('SAST') || projectName.includes('Zero Trust')) {
    // Find security engineers
    potentialEngineers = engineers.filter(eng => 
      eng.jobTitle.includes('Security') || 
      eng.jobTitle === 'Software Engineer');
  } else if (task.title.includes('Kubernetes') || task.description.includes('Kubernetes') || 
             projectName.includes('Kubernetes')) {
    // Find DevOps engineers
    potentialEngineers = engineers.filter(eng => 
      eng.jobTitle.includes('DevOps') || 
      eng.jobTitle === 'Systems Engineer');
  } else if (task.title.includes('Tracing') || task.description.includes('Tracing') || 
             projectName.includes('Tracing')) {
    // Find backend/systems engineers
    potentialEngineers = engineers.filter(eng => 
      eng.jobTitle.includes('Backend') || 
      eng.jobTitle === 'Systems Engineer');
  } else if (task.title.includes('Database') || task.description.includes('Database')) {
    // Find database engineers
    potentialEngineers = engineers.filter(eng => 
      eng.jobTitle.includes('Database') || 
      eng.jobTitle === 'Backend Developer');
  } else if (task.title.includes('Dashboard') || task.description.includes('Dashboard') ||
             task.title.includes('UI') || task.description.includes('UI')) {
    // Find frontend engineers
    potentialEngineers = engineers.filter(eng => 
      eng.jobTitle.includes('Frontend') || 
      eng.jobTitle === 'Software Engineer');
  } else {
    // Default to all engineers for general tasks
    potentialEngineers = engineers;
  }
  
  // If not enough specialized engineers, add general engineers
  if (potentialEngineers.length < minEngineers) {
    const generalEngineers = engineers.filter(eng => 
      eng.jobTitle === 'Software Engineer' || 
      eng.jobTitle === 'Systems Engineer');
    
    potentialEngineers = [...new Set([...potentialEngineers, ...generalEngineers])];
  }
  
  // If still not enough, use all engineers
  if (potentialEngineers.length < minEngineers) {
    potentialEngineers = engineers;
  }
  
  // Determine how many engineers to assign based on priority
  const numToAssign = task.priority === 'Critical' ? 
    Math.min(6, potentialEngineers.length) : 
    Math.min(minEngineers, potentialEngineers.length);
  
  // Randomly select engineers
  const selectedEngineers: number[] = [];
  const availableEngineers = [...potentialEngineers];
  
  for (let i = 0; i < numToAssign && availableEngineers.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * availableEngineers.length);
    selectedEngineers.push(availableEngineers[randomIndex].id);
    availableEngineers.splice(randomIndex, 1);
  }
  
  return [...new Set(selectedEngineers)]; // Remove any duplicates
}

/**
 * Create a task and assign engineers
 * @param {sqlite3.Database} db - Database connection
 * @param {Task} task - Task object
 * @param {number} projectId - Project ID
 * @param {Array<User>} engineers - Available engineers
 * @param {string} projectName - Project name
 * @returns {Promise<number>} - Created task ID
 */
async function createTask(
  db: sqlite3.Database, 
  task: Task, 
  projectId: number, 
  engineers: User[], 
  projectName: string
): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    // Calculate absolute due date
    const dueDate = calculateDueDate(task.dueDate);
    
    // Insert task
    db.run(
      'INSERT INTO task (title, description, projectId, status, priority, dueDate, estimatedHours, actualHours) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        task.title,
        task.description,
        projectId,
        task.status,
        task.priority,
        dueDate,
        task.estimatedHours,
        task.actualHours
      ],
      async function(this: sqlite3.RunResult, err: Error | null) {
        if (err) return reject(err);
        
        const taskId = this.lastID;
        console.log(`Created task: ${task.title} for project ${projectId}`);
        
        try {
          // Assign engineers to task
          const assignedEngineers = assignEngineersToTask(task, engineers, projectName);
          
          // Create task assignments
          for (const engineerId of assignedEngineers) {
            await new Promise<void>((resolveAssignment, rejectAssignment) => {
              db.run(
                'INSERT INTO task_assignment (taskId, userId) VALUES (?, ?)',
                [taskId, engineerId],
                (err) => {
                  if (err) return rejectAssignment(err);
                  console.log(`Assigned engineer ${engineerId} to task ${taskId}`);
                  resolveAssignment();
                }
              );
            });
          }
          
          resolve(taskId);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}

/**
 * Seed tasks for all projects
 * @param {sqlite3.Database} db - Database connection
 */
async function seed(db: sqlite3.Database): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      // Check if tasks already exist
      db.get('SELECT COUNT(*) as count FROM task', async (err, row: { count: number }) => {
        if (err) return reject(err);
        
        // If tasks exist, skip seeding
        if (row && row.count > 0) {
          console.log(`Found ${row.count} existing tasks, skipping tasks seeding`);
          // Set seed count for metrics
          module.exports.seedCount = 0;
          return resolve();
        }
        
        try {
          // Get all projects
          const projects = await getProjects(db);
          
          // Get engineers for task assignment
          const engineers = await getEngineers(db);
          
          let totalTasksCreated = 0;
          
          // Create tasks for each project
          for (const project of projects) {
            const templates = taskTemplates[project.name];
            
            // Skip if no templates for this project
            if (!templates) {
              console.log(`No task templates found for project: ${project.name}`);
              continue;
            }
            
            console.log(`Creating ${templates.length} tasks for project: ${project.name}`);
            
            // Create tasks for this project
            for (const taskTemplate of templates) {
              await createTask(db, taskTemplate, project.id, engineers, project.name);
              totalTasksCreated++;
            }
            
            console.log(`Completed creating tasks for project: ${project.name}`);
          }
          
          // Set seed count for metrics
          module.exports.seedCount = totalTasksCreated;
          
          console.log(`${totalTasksCreated} tasks seeded successfully`);
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
 * Refresh tasks if needed
 * @param {sqlite3.Database} db - Database connection
 */
async function refresh(db: sqlite3.Database): Promise<void> {
  // For tasks, we don't refresh existing data to maintain integrity
  return new Promise<void>((resolve) => {
    console.log('Task refresh not implemented to preserve data integrity');
    module.exports.seedCount = 0;
    resolve();
  });
}

module.exports = {
  seed,
  refresh,
  seedCount: 0
};

export { seed, refresh };