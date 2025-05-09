<template>
  <BaseLayout>
    <div class="tasks-view">
      <h1>Tasks</h1>
      
      <div class="actions-bar">
        <Button @click="openNewTaskModal()" variant="primary" text="New Task" />
        <div class="search-box">
          <input type="text" v-model="searchTerm" placeholder="Search tasks..." />
        </div>
      </div>
      
      <!-- Task Form Modal (used for both Create and Edit) -->
      <div v-if="showTaskForm" class="modal">
        <div class="modal-content">
          <h2>{{ isEditMode ? 'Edit Task' : 'Create New Task' }}</h2>
          <form @submit.prevent="submitTaskForm">
            <FormGroup label="Title" :error="errors.title">
              <input type="text" v-model="taskForm.title" required />
            </FormGroup>
            
            <FormGroup label="Description" :error="errors.description">
              <textarea v-model="taskForm.description" rows="3"></textarea>
            </FormGroup>
            
            <FormGroup label="Project" :error="errors.projectId">
              <select v-model="taskForm.projectId" required>
                <option value="" disabled>Select a project</option>
                <option v-for="project in projects" :key="project.id" :value="project.id">{{ project.name }}</option>
              </select>
            </FormGroup>

            <div class="form-row">
              <FormGroup label="Status">
                <select v-model="taskForm.status">
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Complete">Complete</option>
                </select>
              </FormGroup>

              <FormGroup label="Priority">
                <select v-model="taskForm.priority">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </FormGroup>
            </div>
            
            <FormGroup label="Due Date">
              <input type="date" v-model="taskForm.dueDate" />
            </FormGroup>

            <div class="form-row">
              <FormGroup label="Estimated Hours" :error="errors.estimatedHours">
                <input type="number" v-model="taskForm.estimatedHours" min="0" />
              </FormGroup>
              
              <FormGroup label="Actual Hours" :error="errors.actualHours">
                <input type="number" v-model="taskForm.actualHours" min="0" />
              </FormGroup>
            </div>
            
            <!-- VULNERABILITY: No validation of assignedTo field -->
            <FormGroup label="Assigned To" :error="errors.assignedTo">
              <input type="text" v-model="taskForm.assignedTo" placeholder="User ID" />
            </FormGroup>
            
            <div class="form-actions">
              <Button type="submit" variant="primary" :text="isEditMode ? 'Update Task' : 'Create Task'" />
              <Button @click="closeTaskForm()" variant="secondary" text="Cancel" />
            </div>
          </form>
        </div>
      </div>
      
      <!-- Tasks List -->
      <div v-if="loading" class="loading">Loading tasks...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div v-else-if="filteredTasks.length === 0" class="no-tasks">
        <p>No tasks found. Create your first task!</p>
      </div>
      <div v-else class="tasks-table-container">
        <table class="tasks-table">
          <thead>
            <tr>
              <th>Task</th>
              <th>Project</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Due Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="task in filteredTasks" :key="task.id" class="task-row" @click="viewTask(task.id)">
              <td class="task-name-cell">
                <h3 class="task-name">
                  {{ task.title }}
                </h3>
                <!-- VULNERABILITY: Rendering unsanitized HTML from the server -->
                <p class="description" v-html="task.description"></p>
              </td>
              <td class="project-cell">
                <!-- Display project name and make it clickable -->
                <span v-if="getProjectName(task.projectId)" class="project-link" @click.stop="viewProject(task.projectId)">
                  {{ getProjectName(task.projectId) }}
                </span>
                <span v-else class="not-assigned">Not assigned</span>
              </td>
              <td class="status-cell">
                <span :class="['status-badge', 'status-' + task.status.toLowerCase().replace(' ', '-')]">{{ task.status }}</span>
              </td>
              <td class="priority-cell">
                <span :class="['priority-badge', 'priority-' + (task.priority ? task.priority.toLowerCase() : 'none')]">
                  {{ task.priority || 'None' }}
                </span>
              </td>
              <td class="date-cell">
                <div v-if="task.dueDate" class="date-info">
                  <span class="date-icon">🗓️</span> 
                  <span>{{ formatDate(task.dueDate) }}</span>
                </div>
                <span v-else>No due date</span>
              </td>
              <td class="actions-cell">
                <span class="action-icon edit-icon" @click.stop="openEditModal(task)" title="Edit Task">
                  <i class="fas fa-pen"></i>
                </span>
                <span class="action-icon delete-icon" @click.stop="confirmDeleteTask(task)" title="Delete Task">
                  <i class="fas fa-trash-alt"></i>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Delete Confirmation Modal -->
      <div v-if="showDeleteConfirm" class="modal">
        <div class="modal-content">
          <h3>Confirm Delete</h3>
          <p>Are you sure you want to delete "{{ taskToDelete?.title }}"? This action cannot be undone.</p>
          <div class="modal-actions">
            <Button @click="deleteTask()" variant="danger" text="Delete" />
            <Button @click="showDeleteConfirm = false" variant="secondary" text="Cancel" />
          </div>
        </div>
      </div>
    </div>
  </BaseLayout>
</template>

<script>
import BaseLayout from '../components/BaseLayout.vue'
import Button from '../components/Button.vue'
import FormGroup from '../components/FormGroup.vue'
import AlertMessage from '../components/AlertMessage.vue'
import { tasksAPI, projectsAPI } from '../services/api'

export default {
  name: 'TasksView',
  components: {
    BaseLayout,
    Button,
    FormGroup,
    AlertMessage
  },
  data() {
    return {
      tasks: [],
      projects: [], // Store projects for dropdown and display
      projectMap: {}, // Map of project IDs to names for quick lookup
      loading: true,
      error: null,
      searchTerm: '',
      showTaskForm: false,
      isEditMode: false,
      editTaskId: null,
      showDeleteConfirm: false,
      taskToDelete: null,
      taskForm: {
        title: '',
        description: '',
        projectId: '',
        status: 'Not Started',
        priority: 'Medium',
        dueDate: '',
        estimatedHours: null,
        actualHours: null,
        assignedTo: null,
        isCompleted: false
      },
      errors: {}
    }
  },
  computed: {
    filteredTasks() {
      if (!this.searchTerm) {
        return this.tasks
      }
      
      const term = this.searchTerm.toLowerCase()
      return this.tasks.filter(task => {
        // VULNERABILITY: No sanitization of search terms
        return task.title.toLowerCase().includes(term) || 
               (task.description && task.description.toLowerCase().includes(term)) ||
               task.status.toLowerCase().includes(term) ||
               (task.priority && task.priority.toLowerCase().includes(term)) ||
               (this.getProjectName(task.projectId) && this.getProjectName(task.projectId).toLowerCase().includes(term))
      })
    }
  },
  methods: {
    openNewTaskModal() {
      // Reset form and show modal for creating a new task
      this.isEditMode = false
      this.editTaskId = null
      this.resetTaskForm()
      this.showTaskForm = true
    },
    
    openEditModal(task) {
      // Set edit mode and populate form with task data
      this.isEditMode = true
      this.editTaskId = task.id
      
      // Format dates for HTML date inputs (YYYY-MM-DD)
      const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        // Check if date is valid
        if (isNaN(date.getTime())) return '';
        
        // Format to YYYY-MM-DD for input
        return date.toISOString().split('T')[0];
      };
      
      // Clone task data to form
      this.taskForm = {
        title: task.title || '',
        description: task.description || '',
        projectId: task.projectId || '',
        status: task.status || 'Not Started',
        priority: task.priority || 'Medium',
        dueDate: formatDateForInput(task.dueDate),
        estimatedHours: task.estimatedHours || null,
        actualHours: task.actualHours || null,
        assignedTo: task.assignedTo || null,
        isCompleted: task.isCompleted || false
      }
      
      console.log('Editing task:', task.id, this.taskForm);
      this.showTaskForm = true;
    },
    
    closeTaskForm() {
      this.showTaskForm = false
      this.isEditMode = false
      this.editTaskId = null
      this.errors = {}
    },

    async fetchTasks() {
      this.loading = true
      this.error = null
      
      try {
        // Use the tasks API service to fetch tasks
        const response = await tasksAPI.getAllTasks()
        console.log(`Received ${response.data?.length || 0} tasks from API`)
        
        // Handle data and convert dates properly
        this.tasks = Array.isArray(response.data) ? response.data.map(task => ({
          ...task,
          // Ensure dates are properly parsed
          dueDate: task.dueDate ? task.dueDate : null
        })) : []
        
        if (this.tasks.length === 0) {
          console.log('No tasks found or empty array returned')
        } else {
          console.log(`Successfully loaded ${this.tasks.length} tasks`)
        }
      } catch (error) {
        console.error('Error fetching tasks:', error)
        this.error = 'Failed to load tasks. Please try again.'
      } finally {
        this.loading = false
      }
    },

    async fetchProjects() {
      try {
        // Fetch projects for the dropdown and project name display
        const response = await projectsAPI.getAllProjects()
        this.projects = response.data || []
        
        // Create a map for quick project name lookup
        this.projectMap = {}
        this.projects.forEach(project => {
          this.projectMap[project.id] = project.name
        })
      } catch (error) {
        console.error('Error fetching projects:', error)
        // Don't set main error since this is a secondary operation
      }
    },

    async submitTaskForm() {
      this.errors = {}
      
      try {
        // Format dates correctly for API
        const formData = {
          ...this.taskForm,
          // Ensure dates are in proper format for API
          dueDate: this.taskForm.dueDate ? this.taskForm.dueDate : null,
          // Ensure numeric fields are numbers
          projectId: parseInt(this.taskForm.projectId) || null,
          estimatedHours: this.taskForm.estimatedHours ? parseInt(this.taskForm.estimatedHours) : null,
          actualHours: this.taskForm.actualHours ? parseInt(this.taskForm.actualHours) : null,
          assignedTo: this.taskForm.assignedTo ? parseInt(this.taskForm.assignedTo) : null
        }
        
        console.log('Submitting task form data:', formData)
        
        if (this.isEditMode && this.editTaskId) {
          // Update existing task
          console.log(`Updating task with ID ${this.editTaskId}`)
          const response = await tasksAPI.updateTask(this.editTaskId, formData)
          
          // Update the task in the list
          const index = this.tasks.findIndex(t => t.id === this.editTaskId)
          if (index !== -1) {
            this.tasks.splice(index, 1, response.data)
            console.log('Task updated in list at index:', index)
          } else {
            console.warn('Task not found in list after update')
            // Refresh the task list to get the updated data
            await this.fetchTasks()
          }
          
          console.log('Task updated:', response.data)
        } else {
          // Create new task
          const response = await tasksAPI.createTask(formData)
          // Add the new task to the beginning of the tasks array
          this.tasks.unshift(response.data)
          console.log('Task created:', response.data)
        }
        
        this.closeTaskForm()
      } catch (error) {
        console.error(`Error ${this.isEditMode ? 'updating' : 'creating'} task:`, error)
        if (error.response && error.response.data) {
          this.errors = error.response.data.errors || {}
        }
      }
    },

    resetTaskForm() {
      // Get current date for due date in ISO format
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      // Format date in YYYY-MM-DD format for date input
      const formatDate = (date) => {
        return date.toISOString().split('T')[0];
      };
      
      this.taskForm = {
        title: '',
        description: '',
        projectId: this.projects.length > 0 ? this.projects[0].id : '',
        status: 'Not Started',
        priority: 'Medium',
        dueDate: formatDate(nextWeek),
        estimatedHours: null,
        actualHours: null,
        assignedTo: null,
        isCompleted: false
      }
    },

    viewProject(id) {
      this.$router.push(`/projects/${id}`)
    },
    
    viewTask(id) {
      this.$router.push(`/tasks/${id}`)
    },

    confirmDeleteTask(task) {
      this.taskToDelete = task
      this.showDeleteConfirm = true
    },

    async deleteTask() {
      try {
        await tasksAPI.deleteTask(this.taskToDelete.id)
        this.tasks = this.tasks.filter(t => t.id !== this.taskToDelete.id)
        this.showDeleteConfirm = false
        this.taskToDelete = null
      } catch (error) {
        console.error('Error deleting task:', error)
        this.error = 'Failed to delete task. Please try again.'
      }
    },

    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString()
    },

    getProjectName(projectId) {
      // VULNERABILITY: Not checking if projectId is valid
      return this.projectMap[projectId] || ''
    }
  },
  created() {
    this.fetchProjects().then(() => {
      this.fetchTasks()
    })
    this.resetTaskForm() // Initialize with default values
  }
}
</script>

<style scoped>
.tasks-view {
  padding: 1rem;
}

.actions-bar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  align-items: center;
}

.search-box input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 250px;
}

.tasks-table-container {
  overflow-x: auto;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.tasks-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

.tasks-table th {
  text-align: left;
  padding: 1rem;
  font-weight: 600;
  color: #4a5568;
  border-bottom: 2px solid #e2e8f0;
  background-color: #f8fafc;
}

.tasks-table td {
  padding: 1rem;
  vertical-align: top;
  border-bottom: none;
}

.task-row {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  cursor: pointer;
  background-color: #ffffff;
  border-bottom: 1px solid #f0f4f8;
}

.task-row td {
  border-bottom: none;
}

.task-row:hover {
  background-color: #f0f7ff; /* Light pastel blue */
  transform: translateY(-3px);
  box-shadow: 0 3px 15px rgba(92, 107, 192, 0.1);
  z-index: 1;
}

.task-name-cell {
  min-width: 250px;
}

.task-name-cell h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: #2d3748;
}

.task-name {
  cursor: pointer;
  transition: color 0.2s ease;
}

.task-name:hover {
  color: #4299e1;
  text-decoration: underline;
}

.project-cell {
  min-width: 150px;
}

.project-link {
  color: #3182ce;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  display: inline-block;
}

.project-link:hover {
  text-decoration: underline;
  color: #2c5282;
  transform: translateX(2px);
}

/* Keep for future reference but not in use now */
.task-link {
  display: none;
}

.not-assigned {
  color: #a0aec0;
  font-style: italic;
}

.status-cell {
  min-width: 120px;
  text-align: center;
}

.status-badge {
  font-size: 0.75rem;
  padding: 0.3rem 0.6rem;
  border-radius: 12px;
  text-transform: uppercase;
  font-weight: 600;
  display: inline-block;
}

.status-not-started {
  background-color: #f5f7fa;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.status-in-progress {
  background-color: #e6f6ff;
  color: #3182ce;
  border: 1px solid #bee3f8;
}

.status-on-hold {
  background-color: #fff5f5;
  color: #e53e3e;
  border: 1px solid #fed7d7;
}

.status-complete {
  background-color: #f0fff4;
  color: #38a169;
  border: 1px solid #c6f6d5;
}

.priority-cell {
  min-width: 100px;
  text-align: center;
}

.priority-badge {
  font-size: 0.75rem;
  padding: 0.3rem 0.6rem;
  border-radius: 12px;
  text-transform: uppercase;
  font-weight: 600;
  display: inline-block;
}

.priority-low {
  background-color: #f0fff4;
  color: #38a169;
  border: 1px solid #c6f6d5;
}

.priority-medium {
  background-color: #ebf8ff;
  color: #3182ce;
  border: 1px solid #bee3f8;
}

.priority-high {
  background-color: #fffaf0;
  color: #dd6b20;
  border: 1px solid #feebc8;
}

.priority-critical {
  background-color: #fff5f5;
  color: #e53e3e;
  border: 1px solid #fed7d7;
}

.priority-none {
  background-color: #f7fafc;
  color: #a0aec0;
  border: 1px solid #edf2f7;
}

.description {
  color: #718096;
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.4;
  max-width: 400px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.date-cell {
  min-width: 140px;
}

.date-info {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  color: #718096;
}

.date-icon {
  margin-right: 0.5rem;
}

.actions-cell {
  white-space: nowrap;
  min-width: 100px;
}

.action-icon {
  display: inline-block;
  margin: 0 0.5rem;
  width: 30px;
  height: 30px;
  line-height: 30px;
  text-align: center;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-icon i {
  font-size: 0.9rem;
}

.edit-icon {
  background-color: #fff4e2; /* Pastel yellow/orange */
  color: #ffa41b;
}

.delete-icon {
  background-color: #ffe2e2; /* Pastel red */
  color: #ff5252;
}

.action-icon:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  overflow-y: auto;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin: 2rem 0;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-actions, .modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.loading, .error, .no-tasks {
  text-align: center;
  padding: 2rem;
  color: #4a5568;
}

.error {
  color: #c53030;
}
</style>