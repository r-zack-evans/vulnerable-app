#!/usr/bin/env ts-node

import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./vuln_app.sqlite');

// Types for the database rows
interface ProjectOwner {
  id: number;
  name: string;
  username: string;
  role: string;
  jobTitle: string;
}

interface Task {
  id: number;
  title: string;
  priority: string;
  estimatedHours: number;
}

interface TaskAssignment {
  taskId: number;
  userId: number;
  username: string;
  jobTitle: string;
}

// Verify product managers are assigned as project owners
function verifyProjectOwners(): void {
  console.log('\n===== VERIFYING PROJECT OWNERS =====');
  
  const sql = `
    SELECT p.id, p.name, u.username, u.role, u.jobTitle 
    FROM project p 
    JOIN user u ON p.ownerId = u.id
  `;
  
  db.all(sql, [], (err, rows: ProjectOwner[]) => {
    if (err) {
      console.error('Error verifying project owners:', err);
      return;
    }
    
    console.log('Projects and their owners:');
    let allProductManagers = true;
    
    rows.forEach(row => {
      console.log(`Project #${row.id}: ${row.name} - Owner: ${row.username} (${row.role})`);
      if (row.role !== 'product_manager') {
        allProductManagers = false;
        console.error(`  ERROR: Project #${row.id} is not owned by a product manager!`);
      }
    });
    
    if (allProductManagers) {
      console.log('✅ All projects are owned by product managers as expected.');
    } else {
      console.error('❌ Some projects are not owned by product managers!');
    }
    
    verifyTaskAssignments();
  });
}

// Verify each task has at least one engineer assigned
function verifyTaskAssignments(): void {
  console.log('\n===== VERIFYING TASK ASSIGNMENTS =====');
  
  // Get all tasks
  db.all(`SELECT t.id, t.title, t.priority, t.estimatedHours FROM task t`, [], (err, tasks: Task[]) => {
    if (err) {
      console.error('Error fetching tasks:', err);
      db.close();
      return;
    }
    
    let processedTasks = 0;
    const taskCount = tasks.length;
    
    // For each task, check assigned engineers
    tasks.forEach(task => {
      const sql = `
        SELECT ta.taskId, ta.userId, u.username, u.jobTitle 
        FROM task_assignment ta 
        JOIN user u ON ta.userId = u.id 
        WHERE ta.taskId = ?
      `;
      
      db.all(sql, [task.id], (err, assignments: TaskAssignment[]) => {
        if (err) {
          console.error(`Error fetching assignments for task ${task.id}:`, err);
          return;
        }
        
        console.log(`\nTask #${task.id}: ${task.title} (Priority: ${task.priority}, Estimated Hours: ${task.estimatedHours})`);
        console.log(`Assigned engineers (${assignments.length}):`);
        
        assignments.forEach(assignment => {
          console.log(`  - ${assignment.username} (${assignment.jobTitle})`);
        });
        
        // Check for high priority or high hour tasks with multiple assignments
        if ((task.priority === 'Critical' || task.estimatedHours >= 30) && assignments.length > 1) {
          console.log(`✅ Complex task has multiple engineers assigned as expected.`);
        } else if (assignments.length === 0) {
          console.error(`❌ Task #${task.id} has no engineers assigned!`);
        } else {
          console.log(`✅ Task has at least one engineer assigned.`);
        }
        
        processedTasks++;
        if (processedTasks === taskCount) {
          console.log('\n===== VERIFICATION COMPLETE =====');
          db.close();
        }
      });
    });
  });
}

// Start verification
console.log('Starting verification of seeded data...');
verifyProjectOwners();