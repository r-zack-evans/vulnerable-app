<template>
  <BaseLayout>
    <div class="project-detail-view">
      <div class="project-header">
        <div class="back-button" @click="goBack">
          <i class="fas fa-arrow-left"></i> Back to Projects
        </div>
        
        <!-- VULNERABILITY: Using v-html with unsanitized data -->
        <h1 v-if="!isEditMode" v-html="project.name"></h1>
        <h1 v-else>Edit Project</h1>
        
        <div class="project-actions" v-if="project.id && !isEditMode">
          <Button @click="enterEditMode()" variant="secondary" text="Edit Project" />
          <Button @click="confirmDeleteProject()" variant="danger" text="Delete Project" />
        </div>
      </div>
      
      <div v-if="loading" class="loading">Loading project details...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div v-else-if="!project.id && !isEditMode" class="not-found">Project not found.</div>
      
      <!-- Edit Form -->
      <div v-if="isEditMode" class="edit-form-container">
        <form @submit.prevent="saveProject" class="project-edit-form">
          <div class="form-group">
            <label for="name">Project Name</label>
            <input type="text" id="name" v-model="editForm.name" required />
          </div>
          
          <div class="form-group">
            <label for="description">Description</label>
            <textarea id="description" v-model="editForm.description" rows="4"></textarea>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="startDate">Start Date</label>
              <input type="date" id="startDate" v-model="editForm.startDate" />
            </div>
            
            <div class="form-group">
              <label for="endDate">End Date</label>
              <input type="date" id="endDate" v-model="editForm.endDate" />
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="status">Status</label>
              <select id="status" v-model="editForm.status">
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="On Hold">On Hold</option>
                <option value="Complete">Complete</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="completionPercentage">Completion (%)</label>
              <input type="number" id="completionPercentage" v-model.number="editForm.completionPercentage" min="0" max="100" />
            </div>
          </div>
          
          <!-- VULNERABILITY: Allowing direct edit of sensitive budget information -->
          <div class="form-group">
            <label for="budget">Budget ($)</label>
            <input type="number" id="budget" v-model.number="editForm.budget" min="0" />
          </div>
          
          <!-- VULNERABILITY: Allowing client-side editing of metadata without validation -->
          <div class="form-section">
            <h3>Project Notes</h3>
            
            <div class="form-group">
              <label for="clientNotes">Client Notes</label>
              <textarea id="clientNotes" v-model="editForm.clientNotes" rows="3"></textarea>
            </div>
            
            <div class="form-group">
              <label for="internalNotes">Internal Notes</label>
              <textarea id="internalNotes" v-model="editForm.internalNotes" rows="3"></textarea>
            </div>
          </div>
          
          <div class="form-actions">
            <Button type="submit" variant="primary" text="Save Project" />
            <Button @click="cancelEdit()" variant="secondary" text="Cancel" />
          </div>
        </form>
      </div>
      
      <!-- View Mode -->
      <div v-else-if="project.id" class="project-content">
        <div class="project-info-card">
          <div class="card-section">
            <h3>Description</h3>
            <!-- VULNERABILITY: Rendering unsanitized HTML from the server -->
            <div class="description" v-html="project.description"></div>
          </div>
          
          <div class="card-section status-section">
            <h3>Status</h3>
            <div class="status-info">
            <span :class="['status-badge', 'status-' + project.status.toLowerCase().replace(' ', '-')]">{{ project.status }}</span>
            <div class="completion-info">
            <div class="progress-bar">
            <div class="progress" :style="{ width: project.completionPercentage + '%' }"></div>
            </div>
            <span>{{ project.completionPercentage }}% Complete ({{ tasks.filter(t => t.status === 'Complete').length }}/{{ tasks.length }} tasks)</span>
            </div>
            </div>
          </div>
          
          <div class="card-section timeline-section">
            <h3>Timeline</h3>
            <div class="date-range">
              <div class="date-item">
                <span class="date-label">Start Date:</span>
                <span class="date-value">{{ formatDate(project.startDate) }}</span>
              </div>
              <div class="date-item">
                <span class="date-label">End Date:</span>
                <span class="date-value">{{ formatDate(project.endDate) }}</span>
              </div>
            </div>
          </div>

          <!-- VULNERABILITY: Displaying sensitive information like budget without access control -->
          <div class="card-section budget-section" v-if="project.budget">
            <h3>Budget</h3>
            <div class="budget-info">
              <span class="budget-value">${{ project.budget.toLocaleString() }}</span>
            </div>
          </div>

          <!-- VULNERABILITY: Showing internal metadata without proper controls -->
          <div class="card-section metadata-section">
            <h3>Tasks</h3>
            <div class="kanban-board">
              <div class="kanban-column">
                <div class="column-header not-started-header">Not Started</div>
                <div class="column-tasks" @dragover.prevent @drop="dropTask($event, 'Not Started')">
                  <div v-for="task in tasksByStatus['Not Started']" :key="task.id" class="kanban-task" draggable="true" @dragstart="dragStart($event, task)" @dragend="dragEnd">
                    <div class="task-title">{{ task.title }}</div>
                    <div class="task-meta">
                      <span v-if="task.dueDate">Due: {{ formatDate(task.dueDate) }}</span>
                      <span v-if="task.assignedTo">{{ task.assignedTo }}</span>
                    </div>
                    <div class="kanban-task-actions">
                      <button class="icon-btn" @click.stop="editTask(task)" title="Edit Task">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="icon-btn" @click.stop="deleteTask(task.id)" title="Delete Task">
                        <i class="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="kanban-column">
                <div class="column-header in-progress-header">In Progress</div>
                <div class="column-tasks" @dragover.prevent @drop="dropTask($event, 'In Progress')">
                  <div v-for="task in tasksByStatus['In Progress']" :key="task.id" class="kanban-task" draggable="true" @dragstart="dragStart($event, task)" @dragend="dragEnd">
                    <div class="task-title">{{ task.title }}</div>
                    <div class="task-meta">
                      <span v-if="task.dueDate">Due: {{ formatDate(task.dueDate) }}</span>
                      <span v-if="task.assignedTo">{{ task.assignedTo }}</span>
                    </div>
                    <div class="kanban-task-actions">
                      <button class="icon-btn" @click.stop="editTask(task)" title="Edit Task">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="icon-btn" @click.stop="deleteTask(task.id)" title="Delete Task">
                        <i class="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="kanban-column">
                <div class="column-header on-hold-header">On Hold</div>
                <div class="column-tasks" @dragover.prevent @drop="dropTask($event, 'On Hold')">
                  <div v-for="task in tasksByStatus['On Hold']" :key="task.id" class="kanban-task" draggable="true" @dragstart="dragStart($event, task)" @dragend="dragEnd">
                    <div class="task-title">{{ task.title }}</div>
                    <div class="task-meta">
                      <span v-if="task.dueDate">Due: {{ formatDate(task.dueDate) }}</span>
                      <span v-if="task.assignedTo">{{ task.assignedTo }}</span>
                    </div>
                    <div class="kanban-task-actions">
                      <button class="icon-btn" @click.stop="editTask(task)" title="Edit Task">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="icon-btn" @click.stop="deleteTask(task.id)" title="Delete Task">
                        <i class="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="kanban-column">
                <div class="column-header complete-header">Complete</div>
                <div class="column-tasks" @dragover.prevent @drop="dropTask($event, 'Complete')">
                  <div v-for="task in tasksByStatus['Complete']" :key="task.id" class="kanban-task" draggable="true" @dragstart="dragStart($event, task)" @dragend="dragEnd">
                    <div class="task-title">{{ task.title }}</div>
                    <div class="task-meta">
                      <span v-if="task.dueDate">Due: {{ formatDate(task.dueDate) }}</span>
                      <span v-if="task.assignedTo">{{ task.assignedTo }}</span>
                    </div>
                    <div class="kanban-task-actions">
                      <button class="icon-btn" @click.stop="editTask(task)" title="Edit Task">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="icon-btn" @click.stop="deleteTask(task.id)" title="Delete Task">
                        <i class="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="project-tasks-section">
          <div class="section-header">
            <h2>Manage Tasks</h2>
            <!-- VULNERABILITY: No CSRF protection when creating a new task -->
            <Button @click="openNewTaskModal()" variant="primary" text="Add Task" />
          </div>
          
          <div v-if="tasksLoading" class="loading">Loading tasks...</div>
          <div v-else-if="tasksError" class="error">{{ tasksError }}</div>
          <div v-else-if="tasks.length === 0" class="no-tasks">
            <p>No tasks assigned to this project yet. Click "Add Task" to create a new task.</p>
          </div>
          <div v-else class="tasks-actions">
            <p class="tasks-help">Drag tasks between columns to update their status. Tasks can be edited or deleted from the modal.</p>
            <div class="task-actions-row">
              <Button @click="openNewTaskModal()" variant="secondary" text="Create Task" size="small" />
              <Button @click="fetchTasks()" variant="outline" text="Refresh Tasks" size="small" />
            </div>
          </div>
        </div>
      </div>
      
      <!-- Delete Confirmation Modal -->
      <div v-if="showDeleteConfirm" class="modal">
        <div class="modal-content">
          <h3>Confirm Delete</h3>
          <p>Are you sure you want to delete "{{ project.name }}"? This action cannot be undone.</p>
          <div class="modal-actions">
            <Button @click="deleteProject()" variant="danger" text="Delete" />
            <Button @click="showDeleteConfirm = false" variant="secondary" text="Cancel" />
          </div>
        </div>
      </div>
      
      <!-- Task Modal -->
      <div v-if="showTaskModal" class="modal">
        <div class="modal-content">
          <h3>{{ editingTask ? 'Edit Task' : 'Add New Task' }}</h3>
          <form @submit.prevent="saveTask">
            <div class="form-group">
              <label for="taskTitle">Title</label>
              <input type="text" id="taskTitle" v-model="taskForm.title" required />
            </div>
            
            <div class="form-group">
              <label for="taskDescription">Description</label>
              <textarea id="taskDescription" v-model="taskForm.description" rows="3"></textarea>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="taskStatus">Status</label>
                <select id="taskStatus" v-model="taskForm.status">
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Complete">Complete</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="taskDueDate">Due Date</label>
                <input type="date" id="taskDueDate" v-model="taskForm.dueDate" />
              </div>
            </div>
            
            <!-- VULNERABILITY: No validation on assignee field -->
            <div class="form-group">
              <label for="taskAssignedTo">Assigned To</label>
              <input type="text" id="taskAssignedTo" v-model="taskForm.assignedTo" />
            </div>
            
            <div class="modal-actions">
              <Button type="submit" variant="primary" :text="editingTask ? 'Update Task' : 'Create Task'" />
              <Button @click="closeTaskModal()" variant="secondary" text="Cancel" />
            </div>
          </form>
        </div>
      </div>
    </div>
  </BaseLayout>
</template>

<script>
import BaseLayout from '../components/BaseLayout.vue'
import Button from '../components/Button.vue'
import { projectsAPI } from '../services/api'
import axios from 'axios' // VULNERABILITY: Direct use of axios instead of through a service

export default {
  name: 'ProjectDetailView',
  components: {
    BaseLayout,
    Button
  },
  data() {
    return {
      project: {},
      tasks: [],
      loading: true,
      error: null,
      tasksLoading: true,
      tasksError: null,
      showDeleteConfirm: false,
      isEditMode: false,
      editForm: {
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        status: 'Not Started',
        completionPercentage: 0,
        budget: 0,
        clientNotes: '',
        internalNotes: ''
      },
      showTaskModal: false,
      editingTask: null,
      taskForm: {
        title: '',
        description: '',
        status: 'Not Started',
        dueDate: '',
        assignedTo: ''
      }
    }
  },
  computed: {
    projectId() {
      // VULNERABILITY: No validation of the ID parameter
      return this.$route.params.id
    },
    tasksByStatus() {
      const result = {
        'Not Started': [],
        'In Progress': [],
        'On Hold': [],
        'Complete': []
      }
      
      if (this.tasks && this.tasks.length) {
        this.tasks.forEach(task => {
          if (result[task.status]) {
            result[task.status].push(task)
          } else {
            // Default fallback if status is unexpected
            result['Not Started'].push(task)
          }
        })
      }
      
      return result
    },
    completionPercentage() {
      if (!this.tasks || this.tasks.length === 0) return 0
      
      const completedTasks = this.tasks.filter(task => task.status === 'Complete').length
      return Math.round((completedTasks / this.tasks.length) * 100)
    }
  },
  watch: {
    // VULNERABILITY: No validation on route changes
    '$route.params.id': function(newId) {
      if (newId !== this.projectId) {
        this.fetchProject()
        this.fetchTasks()
      }
    },
    '$route.path': function(newPath) {
      // Handle edit mode when URL changes to edit path
      this.isEditMode = newPath.includes('/edit')
      if (this.isEditMode && this.project.id) {
        this.populateEditForm()
      }
    },
    'tasks': {
      deep: true,
      handler() {
        // Update project completion whenever tasks change
        this.updateProjectCompletion()
      }
    }
  },
  methods: {
    // Utility function to debounce frequent calls
    debounce(func, wait) {
      let timeout
      return function() {
        const context = this
        const args = arguments
        clearTimeout(timeout)
        timeout = setTimeout(() => func.apply(context, args), wait)
      }
    },
    goBack() {
      this.$router.push('/projects')
    },
    async fetchProject() {
      this.loading = true
      this.error = null
      
      try {
        // VULNERABILITY: Not validating the projectId before sending to API
        const response = await projectsAPI.getProject(this.projectId)
        this.project = response.data
        console.log('Project loaded:', this.project)
        
        // Initialize edit form if in edit mode
        if (this.isEditMode) {
          this.populateEditForm()
        }
      } catch (error) {
        console.error('Error fetching project:', error)
        // VULNERABILITY: Displaying detailed error message to user
        this.error = `Failed to load project: ${error.message}`
      } finally {
        this.loading = false
      }
    },
    async fetchTasks() {
      this.tasksLoading = true
      this.tasksError = null
      
      try {
        // VULNERABILITY: Not validating the projectId before sending to API
        const response = await projectsAPI.getProjectTasks(this.projectId)
        this.tasks = response.data
        console.log(`Loaded ${this.tasks.length} tasks`)
        
        // Update project completion percentage based on tasks
        this.updateProjectCompletion()
      } catch (error) {
        console.error('Error fetching tasks:', error)
        this.tasksError = 'Failed to load tasks. Please try again.'
      } finally {
        this.tasksLoading = false
      }
    },
    
    updateProjectCompletion() {
      // Skip if there are no tasks
      if (!this.tasks) return
      
      // Always calculate the current completion percentage based on tasks
      const completedTasks = this.tasks.filter(task => task.status === 'Complete').length
      const currentPercentage = this.tasks.length > 0 ? 
        Math.round((completedTasks / this.tasks.length) * 100) : 0
      
      // Check if the completion percentage is different from the current one
      if (this.project.completionPercentage !== currentPercentage) {
        // Update local project data first
        this.project.completionPercentage = currentPercentage
        
        // Send update to the server
        this.updateProjectCompletion_debounced()
      }
    },
    
    async updateProjectCompletionOnServer() {
      try {
        // Get current completion percentage from the project object
        // which was updated in updateProjectCompletion
        const currentPercentage = this.project.completionPercentage
        
        // Update only the completion percentage
        const projectData = {
          ...this.project,
          completionPercentage: currentPercentage
        }
        
        const response = await projectsAPI.updateProject(this.projectId, projectData)
        console.log('Updated project completion percentage:', currentPercentage)
      } catch (error) {
        console.error('Error updating project completion:', error)
      }
    },
    
    dragStart(event, task) {
      // Set data transfer
      event.dataTransfer.setData('taskId', task.id)
      event.dataTransfer.effectAllowed = 'move'
      
      // Add class for styling
      event.target.classList.add('dragging')
    },
    
    dragEnd(event) {
      // Remove dragging class
      event.target.classList.remove('dragging')
    },
    
    async dropTask(event, newStatus) {
      event.preventDefault()
      
      // Get the task ID from data transfer
      const taskId = event.dataTransfer.getData('taskId')
      if (!taskId) return
      
      // Find the task in our list
      const task = this.tasks.find(t => t.id === parseInt(taskId))
      if (!task) return
      
      // Skip if status hasn't changed
      if (task.status === newStatus) return
      
      // Update task status locally first
      const oldStatus = task.status
      task.status = newStatus
      
      try {
        // Send the update to the server
        const taskData = {
          ...task,
          status: newStatus
        }
        
        await axios.put(`/tasks/${taskId}`, taskData)
        console.log(`Task ${taskId} status changed from ${oldStatus} to ${newStatus}`)
        
        // Update project completion percentage
        this.updateProjectCompletion()
      } catch (error) {
        console.error('Error updating task status:', error)
        
        // Revert back if failed
        task.status = oldStatus
        this.tasksError = 'Failed to update task status. Please try again.'
      }
    },
    confirmDeleteProject() {
      this.showDeleteConfirm = true
    },
    async deleteProject() {
      try {
        // VULNERABILITY: No CSRF protection
        await projectsAPI.deleteProject(this.projectId)
        this.$router.push('/projects')
      } catch (error) {
        console.error('Error deleting project:', error)
        this.error = 'Failed to delete project. Please try again.'
      } finally {
        this.showDeleteConfirm = false
      }
    },
    formatDate(dateString) {
      if (!dateString) return 'Not set'
      
      try {
        const date = new Date(dateString)
        return date.toLocaleDateString()
      } catch (e) {
        console.error('Error formatting date:', e)
        return 'Invalid date'
      }
    },
    formatDateForInput(dateString) {
      if (!dateString) return ''
      
      try {
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return ''
        return date.toISOString().split('T')[0]
      } catch (e) {
        console.error('Error formatting date for input:', e)
        return ''
      }
    },
    enterEditMode() {
      this.$router.push(`/projects/${this.projectId}/edit`)
    },
    populateEditForm() {
      // VULNERABILITY: Not validating data from server
      this.editForm = {
        name: this.project.name || '',
        description: this.project.description || '',
        startDate: this.formatDateForInput(this.project.startDate),
        endDate: this.formatDateForInput(this.project.endDate),
        status: this.project.status || 'Not Started',
        completionPercentage: this.project.completionPercentage || 0,
        budget: this.project.budget || 0,
        clientNotes: this.project.metadata?.clientNotes || '',
        internalNotes: this.project.metadata?.internalNotes || ''
      }
    },
    cancelEdit() {
      // Navigate back to view mode
      this.$router.push(`/projects/${this.projectId}`)
    },
    async saveProject() {
      try {
        // Format the project data for API
        // VULNERABILITY: No sanitization of user input
        const projectData = {
          name: this.editForm.name,
          description: this.editForm.description,
          startDate: this.editForm.startDate || null,
          endDate: this.editForm.endDate || null,
          status: this.editForm.status,
          completionPercentage: parseInt(this.editForm.completionPercentage) || 0,
          budget: parseFloat(this.editForm.budget) || 0,
          metadata: {
            clientNotes: this.editForm.clientNotes,
            internalNotes: this.editForm.internalNotes
          }
        }
        
        // VULNERABILITY: Making direct HTTP request with string concatenation
        const response = await projectsAPI.updateProject(this.projectId, projectData)
        
        // Update local project data
        this.project = response.data
        
        // Navigate back to view mode
        this.$router.push(`/projects/${this.projectId}`)
      } catch (error) {
        console.error('Error saving project:', error)
        // VULNERABILITY: Showing error message with potential internal details
        this.error = `Failed to save project: ${error.message}`
      }
    },
    openNewTaskModal() {
      this.editingTask = null
      // Reset the task form
      this.taskForm = {
        title: '',
        description: '',
        status: 'Not Started',
        dueDate: this.formatDateForInput(new Date()),
        assignedTo: ''
      }
      this.showTaskModal = true
    },
    editTask(task) {
      this.editingTask = task.id
      // Populate the task form with existing task data
      this.taskForm = {
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'Not Started',
        dueDate: this.formatDateForInput(task.dueDate),
        assignedTo: task.assignedTo || ''
      }
      this.showTaskModal = true
    },
    closeTaskModal() {
      this.showTaskModal = false
      this.editingTask = null
    },
    async saveTask() {
      try {
        const taskData = {
          title: this.taskForm.title,
          description: this.taskForm.description,
          status: this.taskForm.status,
          dueDate: this.taskForm.dueDate || null,
          assignedTo: this.taskForm.assignedTo || null,
          projectId: parseInt(this.projectId)
        }
        
        let response
        
        if (this.editingTask) {
          // VULNERABILITY: String concatenation in URL and no validation
          // Update existing task
          response = await axios.put(`/tasks/${this.editingTask}`, taskData)
          
          // Update the task in the local list
          const index = this.tasks.findIndex(t => t.id === this.editingTask)
          if (index !== -1) {
            // Use Vue.set to ensure reactivity when updating array element
            this.$set(this.tasks, index, response.data)
          }
        } else {
          // Create new task
          // VULNERABILITY: Direct use of axios with string concatenation
          response = await axios.post(`/projects/${this.projectId}/tasks`, taskData)
          
          // Add the new task to the local list
          this.tasks.push(response.data)
        }
        
        this.closeTaskModal()
        
        // Update the project completion percentage
        this.updateProjectCompletion()
      } catch (error) {
        console.error('Error saving task:', error)
        this.tasksError = `Failed to save task: ${error.message}`
      }
    },
    async deleteTask(taskId) {
      if (!confirm('Are you sure you want to delete this task?')) return
      
      try {
        // VULNERABILITY: Direct axios call and string concatenation
        await axios.delete(`/tasks/${taskId}`)
        
        // Remove the task from the local list
        this.tasks = this.tasks.filter(t => t.id !== taskId)
        
        // Update the project completion percentage
        this.updateProjectCompletion()
      } catch (error) {
        console.error('Error deleting task:', error)
        this.tasksError = 'Failed to delete task. Please try again.'
      }
    }
  },
  created() {
    // Check if we're in edit mode based on the route
    this.isEditMode = this.$route.path.includes('/edit')
    
    // Create a debounced version of the update function to avoid too many server requests
    this.updateProjectCompletion_debounced = this.debounce(this.updateProjectCompletionOnServer, 1000)
    
    this.fetchProject()
    this.fetchTasks()
    
    // Force update completion percentage when component is mounted
    this.$nextTick(() => {
      setTimeout(() => {
        if (this.tasks.length > 0) {
          this.updateProjectCompletion()
        }
      }, 1000)
    })
    
    // VULNERABILITY: Logging sensitive data to console
    console.log('Route params:', this.$route.params)
  }
}
</script>

<style scoped>
.project-detail-view {
  padding: 1rem;
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.back-button {
  cursor: pointer;
  font-weight: 500;
  color: #4a5568;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
}

.back-button:hover {
  color: #2d3748;
}

.project-actions {
  display: flex;
  gap: 0.75rem;
}

.project-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

@media (min-width: 1024px) {
  .project-content {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
}

/* Edit Form Styles */
.edit-form-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  padding: 2rem;
  margin-bottom: 2rem;
}

.project-edit-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #4a5568;
}

.form-group input, .form-group select, .form-group textarea {
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 0.95rem;
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}

.form-section {
  border-top: 1px solid #e2e8f0;
  padding-top: 1.5rem;
  margin-top: 0.5rem;
}

.form-section h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  color: #2d3748;
}

/* Task Actions */
.task-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  justify-content: flex-end;
}

.project-info-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.card-section {
  padding: 1.5rem;
  border-bottom: 1px solid #f0f4f8;
}

.card-section:last-child {
  border-bottom: none;
}

.card-section h3 {
  font-size: 1.1rem;
  margin-top: 0;
  margin-bottom: 1rem;
  color: #2d3748;
}

.description {
  color: #4a5568;
  line-height: 1.6;
}

.status-badge {
  font-size: 0.75rem;
  padding: 0.3rem 0.6rem;
  border-radius: 12px;
  text-transform: uppercase;
  font-weight: 600;
  display: inline-block;
  margin-bottom: 1rem;
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

.completion-info {
  margin-top: 0.5rem;
}

.progress-bar {
  height: 8px;
  background-color: #f7fafc;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 0.5rem;
  border: 1px solid #edf2f7;
}

.progress {
  height: 100%;
  background-color: #63b3ed;
}

.date-range {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.date-item {
  display: flex;
  align-items: center;
}

.date-label {
  font-weight: 500;
  width: 100px;
  color: #4a5568;
}

.date-value {
  color: #2d3748;
}

.budget-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2d3748;
}

/* Kanban Board Styles */
.kanban-board {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  overflow-x: auto;
  padding-bottom: 1rem;
}

.kanban-column {
  display: flex;
  flex-direction: column;
  min-width: 250px;
  background-color: #f7fafc;
  border-radius: 8px;
  overflow: hidden;
}

.column-header {
  padding: 0.75rem;
  font-weight: 600;
  color: white;
  text-align: center;
}

.not-started-header {
  background-color: #64748b;
}

.in-progress-header {
  background-color: #3182ce;
}

.on-hold-header {
  background-color: #e53e3e;
}

.complete-header {
  background-color: #38a169;
}

.column-tasks {
  flex: 1;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 100px;
  max-height: 60vh;
  overflow-y: auto;
}

.kanban-task {
  background-color: white;
  border-radius: 6px;
  padding: 0.75rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  cursor: grab;
  user-select: none;
  transition: transform 0.2s, box-shadow 0.2s;
}

.kanban-task:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
}

.kanban-task.dragging {
  opacity: 0.5;
  cursor: grabbing;
}

.task-title {
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #2d3748;
}

.kanban-task .task-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #718096;
}

.kanban-task-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.75rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.kanban-task:hover .kanban-task-actions {
  opacity: 1;
}

.icon-btn {
  background: none;
  border: none;
  color: #718096;
  padding: 0.25rem;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
}

.icon-btn:hover {
  background-color: #f7fafc;
  color: #4a5568;
}

.icon-btn:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.5);
}

.metadata-section {
  padding: 1.5rem;
}

.metadata-section h3 {
  margin-bottom: 1.5rem;
}

.project-tasks-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.tasks-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.tasks-help {
  color: #4a5568;
  font-size: 0.95rem;
  margin: 0;
}

.task-actions-row {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #2d3748;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.task-card {
  background-color: white;
  border-radius: 8px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.task-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #2d3748;
}

.task-status {
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 10px;
  text-transform: uppercase;
  font-weight: 600;
}

.task-description {
  color: #4a5568;
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 1rem;
}

.task-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #718096;
}

.loading, .error, .not-found, .no-tasks {
  text-align: center;
  padding: 2rem;
  color: #4a5568;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.error {
  color: #c53030;
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
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

@media (max-width: 1200px) {
  .kanban-board {
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
}

@media (max-width: 768px) {
  .kanban-board {
    grid-template-columns: 1fr;
  }
}
</style>