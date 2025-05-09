<template>
  <BaseLayout>
    <div class="task-detail-view">
      <div class="task-header">
        <h1>Task Details</h1>
        <div class="task-actions" v-if="!isEditMode">
          <Button @click="enterEditMode()" variant="secondary" text="Edit Task" />
        </div>
      </div>
      
      <div v-if="loading" class="loading">Loading task details...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div v-else-if="!task.id && !isEditMode" class="not-found">Task not found.</div>
      
      <!-- Edit Form -->
      <div v-if="isEditMode" class="edit-form-container">
        <form @submit.prevent="saveTask" class="task-edit-form">
          <div class="form-group">
            <label for="title">Title</label>
            <input type="text" id="title" v-model="editForm.title" required />
          </div>
          
          <div class="form-group">
            <label for="description">Description</label>
            <textarea id="description" v-model="editForm.description" rows="4"></textarea>
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
              <label for="priority">Priority</label>
              <select id="priority" v-model="editForm.priority">
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="dueDate">Due Date</label>
              <input type="date" id="dueDate" v-model="editForm.dueDate" />
            </div>
            
            <div class="form-group">
              <label for="assignedTo">Assigned To</label>
              <div class="assignee-search">
                <input 
                  type="text" 
                  id="assigneeSearch"
                  v-model="assigneeSearch" 
                  @input="searchAssignee"
                  placeholder="Search for user by username..."
                  class="search-input"
                />
                
                <div v-if="assigneeSearch && assigneeSearchResults.length > 0" class="assignee-search-results">
                  <div 
                    v-for="user in assigneeSearchResults" 
                    :key="user.id" 
                    class="assignee-search-item"
                    @click="selectAssignee(user)"
                  >
                    <span class="assignee-avatar">
                      <i class="fas fa-user"></i>
                    </span>
                    <div class="assignee-info">
                      <span class="assignee-username"><strong>{{ user.username }}</strong></span>
                      <span class="assignee-position" v-if="user.department || user.jobTitle">
                        {{ user.department }} {{ user.jobTitle ? (user.department ? '- ' : '') + user.jobTitle : '' }}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div v-if="assigneeSearch && assigneeSearchResults.length === 0" class="no-results">
                  No users found matching "{{ assigneeSearch }}"
                </div>
                
                <div v-if="editForm.assignedTo" class="selected-assignee">
                  <div class="assignee-badge">
                    <span class="assignee-badge-avatar">
                      <i class="fas fa-user"></i>
                    </span>
                    <span class="assignee-badge-info">Assigned to: {{ getAssigneeName() }}</span>
                    <button type="button" class="clear-assignee" @click="clearAssignee()" title="Remove assignee">&times;</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="estimatedHours">Estimated Hours</label>
              <input type="number" id="estimatedHours" v-model.number="editForm.estimatedHours" min="0" step="0.5" />
            </div>
            
            <div class="form-group">
              <label for="actualHours">Actual Hours</label>
              <input type="number" id="actualHours" v-model.number="editForm.actualHours" min="0" step="0.5" />
            </div>
          </div>
          
          <div class="form-section">
            <h3>Dependencies</h3>
            <div class="dependencies-list" v-if="projectTasks.length > 0">
              <div v-for="task in projectTasks" :key="task.id" class="dependency-item">
                <label>
                  <input 
                    type="checkbox" 
                    :value="task.id" 
                    v-model="editForm.dependsOn"
                    :disabled="task.id === currentTaskId"
                  />
                  {{ task.title }}
                </label>
              </div>
            </div>
            <div v-else class="no-dependencies">
              No other tasks in this project to set as dependencies.
            </div>
          </div>
          
          <div class="form-actions">
            <Button type="submit" variant="primary" text="Save Task" />
            <Button @click="cancelEdit()" variant="secondary" text="Cancel" />
          </div>
        </form>
      </div>
      
      <!-- View Mode -->
      <div v-else-if="task.id" class="task-content">
        <div class="task-info-card">
          <div class="card-section title-section">
            <h2 class="task-title">{{ task.title }}</h2>
            <div class="task-metadata">
              <span :class="['status-badge', 'status-' + task.status.toLowerCase().replace(' ', '-')]">{{ task.status }}</span>
              <span v-if="task.priority" :class="['priority-badge', 'priority-' + task.priority.toLowerCase()]">{{ task.priority }}</span>
            </div>
          </div>
          
          <div class="card-section description-section" v-if="task.description">
            <h3>Description</h3>
            <div class="description">{{ task.description }}</div>
          </div>
          
          <div class="card-section details-section">
            <h3>Details</h3>
            <div class="details-grid">
              <div class="detail-item">
                <span class="detail-label">Project:</span>
                <span class="detail-value">{{ projectName }}</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">Assigned To:</span>
                <span class="detail-value" v-if="assignedUser">{{ assignedUser.username }}</span>
                <span class="detail-value" v-else>Unassigned</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">Due Date:</span>
                <span class="detail-value">{{ formatDate(task.dueDate) }}</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">Estimated Hours:</span>
                <span class="detail-value">{{ task.estimatedHours || 'Not set' }}</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">Actual Hours:</span>
                <span class="detail-value">{{ task.actualHours || 'Not set' }}</span>
              </div>
            </div>
          </div>
          
          <div class="card-section dependencies-section" v-if="dependencies.length > 0">
            <h3>Dependencies</h3>
            <div class="dependencies-list">
              <div v-for="dep in dependencies" :key="dep.id" class="dependency-item">
                <RouterLink :to="`/tasks/${dep.id}`" class="dependency-link">{{ dep.title }}</RouterLink>
                <span :class="['status-badge', 'status-' + dep.status.toLowerCase().replace(' ', '-')]">{{ dep.status }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </BaseLayout>
</template>

<script>
import BaseLayout from '../components/BaseLayout.vue'
import Button from '../components/Button.vue'
import { projectsAPI, tasksAPI, usersAPI } from '../services/api'

export default {
  name: 'TaskDetailView',
  components: {
    BaseLayout,
    Button
  },
  data() {
    return {
      task: {},
      project: {},
      projectTasks: [], // Other tasks in the same project
      dependencies: [], // Tasks this task depends on
      users: [], // All users for assignment
      loading: true,
      error: null,
      isEditMode: false,
      assigneeSearch: '',
      assigneeSearchResults: [],
      editForm: {
        title: '',
        description: '',
        status: 'Not Started',
        priority: 'Medium',
        dueDate: '',
        assignedTo: '',
        estimatedHours: 0,
        actualHours: 0,
        dependsOn: []
      }
    }
  },
  computed: {
    currentTaskId() {
      return parseInt(this.$route.params.id)
    },
    projectName() {
      return this.project?.name || 'Unknown Project'
    },
    assignedUser() {
      if (!this.task.assignedTo) return null
      return this.users.find(user => user.id === this.task.assignedTo)
    }
  },
  watch: {
    '$route.params.id': function(newId) {
      if (parseInt(newId) !== this.currentTaskId) {
        this.fetchTask()
      }
    }
  },
  created() {
    this.fetchTask()
    this.fetchUsers()
  },
  methods: {
    async fetchTask() {
      this.loading = true
      this.error = null
      
      try {
        const response = await tasksAPI.getTask(this.currentTaskId)
        this.task = response.data
        
        // Fetch the project this task belongs to
        if (this.task.projectId) {
          this.fetchProject(this.task.projectId)
          this.fetchProjectTasks(this.task.projectId)
        }
        
        // Fetch dependencies if any
        if (this.task.dependsOn && this.task.dependsOn.length > 0) {
          this.fetchDependencies()
        }
        
        // Initialize edit form if in edit mode
        if (this.isEditMode) {
          this.populateEditForm()
        }
        
        // Update document title
        document.title = this.task.title ? `Task: ${this.task.title}` : 'Task Details'
      } catch (error) {
        console.error('Error fetching task:', error)
        this.error = 'Failed to load task. Please try again or contact support.'
      } finally {
        this.loading = false
      }
    },
    
    async fetchProject(projectId) {
      try {
        const response = await projectsAPI.getProject(projectId)
        this.project = response.data
      } catch (error) {
        console.error('Error fetching project:', error)
      }
    },
    
    async fetchProjectTasks(projectId) {
      try {
        const response = await projectsAPI.getProjectTasks(projectId)
        // Filter out the current task from the list
        this.projectTasks = response.data.filter(task => task.id !== this.currentTaskId)
      } catch (error) {
        console.error('Error fetching project tasks:', error)
      }
    },
    
    async fetchDependencies() {
      try {
        // Convert dependsOn to array if it's a string
        const dependsOnArray = typeof this.task.dependsOn === 'string'
          ? this.task.dependsOn.split(',').map(id => parseInt(id.trim()))
          : this.task.dependsOn
        
        // Fetch each dependency task
        const dependencyPromises = dependsOnArray.map(taskId =>
          tasksAPI.getTask(taskId).then(response => response.data)
        )
        
        this.dependencies = await Promise.all(dependencyPromises)
      } catch (error) {
        console.error('Error fetching dependencies:', error)
      }
    },
    
    async fetchUsers() {
      try {
        const response = await usersAPI.getAllUsers()
        this.users = response.data
      } catch (error) {
        console.error('Error fetching users:', error)
      }
    },
    
    populateEditForm() {
      // Parse dependsOn if it's a string
      let dependsOn = []
      if (this.task.dependsOn) {
        dependsOn = typeof this.task.dependsOn === 'string'
          ? this.task.dependsOn.split(',').map(id => parseInt(id.trim()))
          : this.task.dependsOn
      }
      
      this.editForm = {
        title: this.task.title || '',
        description: this.task.description || '',
        status: this.task.status || 'Not Started',
        priority: this.task.priority || 'Medium',
        dueDate: this.formatDateForInput(this.task.dueDate),
        assignedTo: this.task.assignedTo || '',
        estimatedHours: this.task.estimatedHours || 0,
        actualHours: this.task.actualHours || 0,
        dependsOn: dependsOn
      }
    },
    
    enterEditMode() {
      this.isEditMode = true
      this.populateEditForm()
    },
    
    // Search for assignee by username or ID
    searchAssignee() {
      if (!this.assigneeSearch.trim()) {
        this.assigneeSearchResults = [];
        return;
      }

      const searchTerm = this.assigneeSearch.toLowerCase().trim();
      this.assigneeSearchResults = this.users.filter(user => {
        // Match by username
        if (user.username.toLowerCase().includes(searchTerm)) {
          return true;
        }
        
        // Match by user ID (if search term is a number)
        if (!isNaN(searchTerm) && user.id === parseInt(searchTerm)) {
          return true;
        }
        
        // Match by department or job title
        if (user.department && user.department.toLowerCase().includes(searchTerm)) {
          return true;
        }
        
        if (user.jobTitle && user.jobTitle.toLowerCase().includes(searchTerm)) {
          return true;
        }
        
        return false;
      });
    },
    
    // Select a user as task assignee
    selectAssignee(user) {
      this.editForm.assignedTo = user.id;
      this.assigneeSearch = '';
      this.assigneeSearchResults = [];
    },
    
    // Clear the selected assignee
    clearAssignee() {
      this.editForm.assignedTo = '';
    },
    
    // Get the name of the selected assignee
    getAssigneeName() {
      if (!this.editForm.assignedTo) return '';
      
      const assignee = this.users.find(u => u.id === this.editForm.assignedTo);
      if (assignee) {
        let roleInfo = '';
        
        if (assignee.jobTitle) {
          roleInfo += assignee.jobTitle;
        }
        
        if (assignee.department) {
          roleInfo += roleInfo ? ` (${assignee.department})` : assignee.department;
        }
        
        return roleInfo ? `${assignee.username} - ${roleInfo}` : assignee.username;
      }
      
      return `User ${this.editForm.assignedTo}`;
    },
    
    cancelEdit() {
      this.isEditMode = false;
      this.assigneeSearch = '';
      this.assigneeSearchResults = [];
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
    
    async saveTask() {
      try {
        this.loading = true
        this.error = null
        
        // Prepare task data for update
        const taskData = {
          title: this.editForm.title,
          description: this.editForm.description,
          status: this.editForm.status,
          priority: this.editForm.priority,
          dueDate: this.editForm.dueDate,
          assignedTo: this.editForm.assignedTo,
          estimatedHours: this.editForm.estimatedHours,
          actualHours: this.editForm.actualHours,
          dependsOn: this.editForm.dependsOn
        }
        
        const response = await tasksAPI.updateTask(this.currentTaskId, taskData)
        
        // Update local task data
        this.task = response.data
        
        // Update dependencies
        if (this.task.dependsOn && this.task.dependsOn.length > 0) {
          this.fetchDependencies()
        } else {
          this.dependencies = []
        }
        
        // Exit edit mode
        this.isEditMode = false
        
        // Show success message
        alert('Task updated successfully')
      } catch (error) {
        console.error('Error updating task:', error)
        this.error = error.response?.data?.message || 'Failed to update task. Please try again.'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.assignee-search {
  position: relative;
}

.search-input {
  padding: 0.65rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  width: 100%;
}

.assignee-search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 300px;
  overflow-y: auto;
  background: white;
  border: 1px solid #ddd;
  border-radius: 0 0 4px 4px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  z-index: 10;
}

.assignee-search-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border-bottom: 1px solid #eee;
  cursor: pointer;
}

.assignee-search-item:hover {
  background-color: #f5f5f5;
}

.assignee-search-item:last-child {
  border-bottom: none;
}

.assignee-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background-color: #eee;
  border-radius: 50%;
  margin-right: 0.75rem;
}

.assignee-info {
  display: flex;
  flex-direction: column;
}

.assignee-username {
  font-size: 0.9rem;
}

.assignee-position {
  font-size: 0.8rem;
  color: #666;
}

.no-results {
  padding: 0.75rem;
  color: #666;
  font-style: italic;
  text-align: center;
}

.selected-assignee {
  margin-top: 0.75rem;
}

.assignee-badge {
  display: flex;
  align-items: center;
  background-color: #f0f7ff;
  border: 1px solid #cce5ff;
  border-radius: 4px;
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
}

.assignee-badge-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #0d6efd;
  color: white;
  margin-right: 0.5rem;
}

.assignee-badge-info {
  flex: 1;
}

.clear-assignee {
  background: transparent;
  border: none;
  color: #6c757d;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 0 0.25rem;
  margin-left: 0.5rem;
}

.clear-assignee:hover {
  color: #dc3545;
}
.task-detail-view {
  padding: 2rem 0;
  max-width: 900px;
  margin: 0 auto;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eaeaea;
}

.task-header h1 {
  margin: 0;
  font-size: 1.75rem;
  color: #333;
}

.loading {
  padding: 2rem;
  text-align: center;
  color: #666;
}

.error {
  padding: 1rem;
  background-color: #f8d7da;
  color: #721c24;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.not-found {
  padding: 2rem;
  text-align: center;
  color: #666;
  font-style: italic;
}

/* Edit Form Styles */
.edit-form-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  padding: 2rem;
}

.task-edit-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.form-row {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
  }
}

label {
  font-weight: 500;
  font-size: 0.9rem;
  color: #333;
}

input[type="text"],
input[type="number"],
input[type="date"],
select,
textarea {
  padding: 0.65rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  width: 100%;
}

input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.form-section {
  border-top: 1px solid #eee;
  padding-top: 1.5rem;
  margin-top: 0.5rem;
}

.form-section h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  color: #333;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

/* View Mode Styles */
.task-info-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  overflow: hidden;
}

.card-section {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #eee;
}

.card-section:last-child {
  border-bottom: none;
}

.card-section h3 {
  margin-top: 0;
  font-size: 1.1rem;
  color: #333;
  margin-bottom: 1rem;
}

.task-title {
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  color: #333;
}

.task-metadata {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.status-badge,
.priority-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-not-started {
  background-color: #e9ecef;
  color: #495057;
}

.status-in-progress {
  background-color: #cff4fc;
  color: #055160;
}

.status-on-hold {
  background-color: #fff3cd;
  color: #664d03;
}

.status-complete {
  background-color: #d1e7dd;
  color: #0f5132;
}

.priority-low {
  background-color: #d1e7dd;
  color: #0f5132;
}

.priority-medium {
  background-color: #fff3cd;
  color: #664d03;
}

.priority-high {
  background-color: #f8d7da;
  color: #721c24;
}

.priority-critical {
  background-color: #842029;
  color: white;
}

.description {
  line-height: 1.6;
  white-space: pre-line;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 576px) {
  .details-grid {
    grid-template-columns: 1fr;
  }
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label {
  font-size: 0.85rem;
  color: #6c757d;
  font-weight: 500;
}

.detail-value {
  font-size: 1rem;
}

.dependencies-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.dependency-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  font-size: 0.9rem;
}

.dependency-link {
  color: #0d6efd;
  text-decoration: none;
}

.dependency-link:hover {
  text-decoration: underline;
}

.no-dependencies {
  font-style: italic;
  color: #6c757d;
}
</style>