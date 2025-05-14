import { test, expect, Page, TestInfo } from '@playwright/test';
import { setupMockServer, RouteResponse } from './mock-server';

// Constants for our tests
const TEST_PROJECT_ID = 1;
const TEST_TASK_ID = 1;

// Mock data for project and task
const mockProject = {
  id: TEST_PROJECT_ID,
  name: 'Test Project',
  description: 'A project used for testing',
  startDate: '2023-01-01',
  endDate: '2023-12-31',
  status: 'In Progress',
  completionPercentage: 50,
  budget: 10000,
  ownerId: 1,
  ownerName: 'Test User',
  teamMembers: [2, 3],
};

const mockTasks = [
  {
    id: TEST_TASK_ID,
    title: 'Test Task 1',
    description: 'First test task',
    status: 'In Progress',
    dueDate: '2023-06-30',
    assignedTo: 2,
    projectId: TEST_PROJECT_ID,
  },
  {
    id: 2,
    title: 'Test Task 2',
    description: 'Second test task',
    status: 'Not Started',
    dueDate: '2023-07-15',
    assignedTo: 3,
    projectId: TEST_PROJECT_ID,
  },
];

const mockUsers = [
  { id: 1, username: 'admin', email: 'admin@example.com', role: 'admin' },
  { id: 2, username: 'user1', email: 'user1@example.com', role: 'user' },
  { id: 3, username: 'user2', email: 'user2@example.com', role: 'user' },
];

// Helper functions
async function setupMocks(page: Page) {
  // Mock API responses
  await page.route('/api/vue/projects/' + TEST_PROJECT_ID, route => {
    route.fulfill({ status: 200, body: JSON.stringify(mockProject) });
  });

  await page.route('/api/vue/projects/' + TEST_PROJECT_ID + '/tasks', route => {
    route.fulfill({ status: 200, body: JSON.stringify(mockTasks) });
  });

  await page.route('/api/vue/tasks/' + TEST_TASK_ID, route => {
    route.fulfill({ status: 200, body: JSON.stringify(mockTasks[0]) });
  });

  await page.route('/api/vue/users', route => {
    route.fulfill({ status: 200, body: JSON.stringify(mockUsers) });
  });
}

async function updateProjectMock(page: Page, updates: Partial<typeof mockProject>) {
  // Create updated project data
  const updatedProject = { ...mockProject, ...updates };
  
  // Update the mock response
  await page.route('/api/vue/projects/' + TEST_PROJECT_ID, route => {
    route.fulfill({ status: 200, body: JSON.stringify(updatedProject) });
  });

  return updatedProject;
}

async function updateTaskMock(page: Page, updates: Partial<typeof mockTasks[0]>) {
  // Create updated task data
  const updatedTask = { ...mockTasks[0], ...updates };
  
  // Update the mock responses
  await page.route('/api/vue/tasks/' + TEST_TASK_ID, route => {
    route.fulfill({ status: 200, body: JSON.stringify(updatedTask) });
  });

  // Also update the task in the tasks list
  const updatedTasks = [...mockTasks];
  updatedTasks[0] = updatedTask;
  
  await page.route('/api/vue/projects/' + TEST_PROJECT_ID + '/tasks', route => {
    route.fulfill({ status: 200, body: JSON.stringify(updatedTasks) });
  });

  return updatedTask;
}

// Set up tests
test.describe('Auto-refresh functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Set up mocks for API endpoints
    await setupMocks(page);
    
    // Navigate to a URL first before trying to set localStorage
    await page.goto('about:blank');
    
    // Mock authentication
    await page.evaluate(() => {
      localStorage.setItem('token', 'fake-token');
    });
  });

  test('Project details should auto-refresh when data changes', async ({ page }) => {
    // Navigate to project detail page
    await page.goto(`/projects/${TEST_PROJECT_ID}`);
    
    // Verify initial project name is displayed
    await expect(page.locator('h1')).toContainText(mockProject.name);
    
    // Update project mock with new data
    const updatedProject = await updateProjectMock(page, { 
      name: 'Updated Project Name', 
      completionPercentage: 75 
    });
    
    // Wait for auto-refresh interval (we'll force it to happen faster for testing)
    await page.evaluate(() => {
      // Trigger the fetchProject method directly to simulate auto-refresh
      (window as any).__vue__.$children[0].fetchProject();
    });
    
    // Verify updated project name is displayed after refresh
    await expect(page.locator('h1')).toContainText(updatedProject.name);
    
    // Verify updated completion percentage is displayed
    await expect(page.locator('.progress')).toHaveAttribute('style', /width: 75%/);
  });

  test('Task details should auto-refresh when data changes', async ({ page }) => {
    // Navigate to task detail page
    await page.goto(`/tasks/${TEST_TASK_ID}`);
    
    // Verify initial task title is displayed
    await expect(page.locator('h1')).toContainText(mockTasks[0].title);
    
    // Update task mock with new data
    const updatedTask = await updateTaskMock(page, { 
      title: 'Updated Task Title', 
      status: 'Complete' 
    });
    
    // Wait for auto-refresh interval (we'll force it to happen faster for testing)
    await page.evaluate(() => {
      // Trigger the fetchTask method directly to simulate auto-refresh
      (window as any).__vue__.$children[0].fetchTask();
    });
    
    // Verify updated task title is displayed after refresh
    await expect(page.locator('h1')).toContainText(updatedTask.title);
    
    // Verify updated status is displayed
    await expect(page.locator('.status-badge')).toContainText('Complete');
  });

  test('Project task updates should auto-refresh in kanban board', async ({ page }) => {
    // Navigate to project detail page
    await page.goto(`/projects/${TEST_PROJECT_ID}`);
    
    // Verify initial task count in the In Progress column
    await expect(page.locator('.kanban-column:has(.in-progress-header) .kanban-task')).toHaveCount(1);
    
    // Update task status
    await updateTaskMock(page, { status: 'Complete' });
    
    // Wait for auto-refresh interval (we'll force it to happen faster for testing)
    await page.evaluate(() => {
      // Trigger the fetchTasks method directly to simulate auto-refresh
      (window as any).__vue__.$children[0].fetchTasks();
    });
    
    // Verify task moved to Complete column
    await expect(page.locator('.kanban-column:has(.complete-header) .kanban-task')).toHaveCount(1);
    await expect(page.locator('.kanban-column:has(.in-progress-header) .kanban-task')).toHaveCount(0);
  });

  test('Auto-refresh should stop in edit mode and resume in view mode', async ({ page }) => {
    // Navigate to project detail page
    await page.goto(`/projects/${TEST_PROJECT_ID}`);
    
    // Enter edit mode
    await page.click('button:has-text("Edit Project")');
    
    // Verify edit form is displayed
    await expect(page.locator('.project-edit-form')).toBeVisible();
    
    // Try to update project in background
    await updateProjectMock(page, { name: 'Should Not Update' });
    
    // Manually trigger a refresh - this shouldn't affect the form
    await page.evaluate(() => {
      // Trigger the fetchProject method directly to simulate auto-refresh
      (window as any).__vue__.$children[0].fetchProject();
    });
    
    // Verify that the form field hasn't been updated with the new name
    const inputName = await page.locator('#name');
    await expect(inputName).toHaveValue(mockProject.name);
    
    // Cancel edit mode
    await page.click('button:has-text("Cancel")');
    
    // Verify we're back in view mode
    await expect(page.locator('.project-edit-form')).not.toBeVisible();
    
    // Now auto-refresh should take effect
    await page.evaluate(() => {
      // Trigger the fetchProject method directly to simulate auto-refresh
      (window as any).__vue__.$children[0].fetchProject();
    });
    
    // Verify the updated name is now visible
    await expect(page.locator('h1')).toContainText('Should Not Update');
  });
});