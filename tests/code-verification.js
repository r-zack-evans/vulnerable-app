/**
 * Code verification tests
 * 
 * This script analyzes the codebase to verify the auto-refresh implementation is correct.
 * We'll check for key functionality requirements to ensure the auto-refresh works properly.
 */

const fs = require('fs');
const path = require('path');

// Files to analyze with specific patterns for each file
const filesToVerify = [
  {
    path: 'src/client/views/ProjectDetailView.vue',
    patterns: [
      // Auto-refresh interval handling
      { pattern: /refreshInterval\s*:\s*null/, description: 'Defined refreshInterval property' },
      { pattern: /setInterval\(/, description: 'Using setInterval for auto-refresh' },
      { pattern: /clearInterval\(this\.refreshInterval\)/, description: 'Cleaning up interval on component destruction' },
      
      // Update methods properly refresh data
      { pattern: /fetchTasks\(\)/, description: 'Calls fetchTasks to refresh task data' },
      { pattern: /fetchProject\(\)/, description: 'Calls fetchProject to refresh project data' },
      
      // Edit mode handling
      { pattern: /handleRefreshInterval\(\)/, description: 'Has method to handle refresh intervals' },
      { pattern: /(watch[\s\S]*?isEditMode|isEditMode\s*:\s*function)/, description: 'Watches edit mode changes' },
      
      // Update methods for tasks - use more general patterns
      { pattern: /(saveTask|updateTask)[\s\S]*?fetchTask/, description: 'Refreshes data after task updates' },
      { pattern: /(dropTask|updateTaskStatus)[\s\S]*?fetchTasks/, description: 'Refreshes data after task drag-and-drop' }
    ]
  },
  {
    path: 'src/client/views/TaskDetailView.vue',
    patterns: [
      // Auto-refresh interval handling
      { pattern: /refreshInterval\s*:\s*null/, description: 'Defined refreshInterval property' },
      { pattern: /setInterval\(/, description: 'Using setInterval for auto-refresh' },
      { pattern: /clearInterval\(this\.refreshInterval\)/, description: 'Cleaning up interval on component destruction' },
      
      // Edit mode handling
      { pattern: /handleRefreshInterval\(\)/, description: 'Has method to handle refresh intervals' },
      { pattern: /(watch[\s\S]*?isEditMode|isEditMode\s*:\s*function)/, description: 'Watches edit mode changes' },
      
      // Update methods for tasks - use more general patterns
      { pattern: /(saveTask|updateTask)[\s\S]*?fetchTask/, description: 'Refreshes data after task updates' },
    ]
  }
];

// Run the verification
console.log('Auto-refresh Implementation Verification');
console.log('======================================');

let allPassed = true;

filesToVerify.forEach(file => {
  console.log(`\nVerifying ${file.path}...`);
  
  try {
    const fullPath = path.resolve(process.cwd(), file.path);
    const fileContent = fs.readFileSync(fullPath, 'utf8');
    
    console.log('Checking required patterns:');
    file.patterns.forEach(({ pattern, description }) => {
      const found = pattern.test(fileContent);
      console.log(`  ${found ? '✓' : '✗'} ${description}`);
      
      if (!found) {
        allPassed = false;
      }
    });
    
  } catch (error) {
    console.error(`Error verifying ${file.path}:`, error.message);
    allPassed = false;
  }
});

console.log('\nAdditional verification:');

// Check if beforeDestroy hook exists in both files
try {
  const projectViewPath = path.resolve(process.cwd(), 'src/client/views/ProjectDetailView.vue');
  const taskViewPath = path.resolve(process.cwd(), 'src/client/views/TaskDetailView.vue');
  
  const projectViewContent = fs.readFileSync(projectViewPath, 'utf8');
  const taskViewContent = fs.readFileSync(taskViewPath, 'utf8');
  
  const projectBeforeDestroy = /beforeDestroy\(\)[\s\S]*?clearInterval/.test(projectViewContent);
  const taskBeforeDestroy = /beforeDestroy\(\)[\s\S]*?clearInterval/.test(taskViewContent);
  
  console.log(`  ${projectBeforeDestroy ? '✓' : '✗'} ProjectDetailView has proper beforeDestroy cleanup`);
  console.log(`  ${taskBeforeDestroy ? '✓' : '✗'} TaskDetailView has proper beforeDestroy cleanup`);
  
  if (!projectBeforeDestroy || !taskBeforeDestroy) {
    allPassed = false;
  }
  
} catch (error) {
  console.error('Error in additional verification:', error.message);
  allPassed = false;
}

console.log('\n======================================');
console.log(`Overall result: ${allPassed ? 'PASSED ✓' : 'FAILED ✗'}`);
console.log('======================================');

process.exit(allPassed ? 0 : 1);