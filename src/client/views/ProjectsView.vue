<template>
  <BaseLayout>
    <div class="projects-view">
      <h1>Projects</h1>
      
      <div class="actions-bar">
        <Button @click="openNewProjectModal()" variant="primary" text="New Project" />
        <div class="search-box">
          <input type="text" v-model="searchTerm" placeholder="Search projects..." />
        </div>
      </div>
      
      <!-- Project Form Modal (used for both Create and Edit) -->
      <div v-if="showProjectForm" class="modal">
        <div class="modal-content">
          <h2>{{ isEditMode ? 'Edit Project' : 'Create New Project' }}</h2>
          <form @submit.prevent="submitProjectForm">
            <FormGroup label="Project Name" :error="errors.name">
              <input type="text" v-model="projectForm.name" required />
            </FormGroup>
            
            <FormGroup label="Description" :error="errors.description">
              <textarea v-model="projectForm.description" rows="3"></textarea>
            </FormGroup>
            
            <FormGroup label="Start Date">
              <input type="date" v-model="projectForm.startDate" />
            </FormGroup>
            
            <FormGroup label="End Date">
              <input type="date" v-model="projectForm.endDate" />
            </FormGroup>
            
            <FormGroup label="Status">
              <select v-model="projectForm.status">
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="On Hold">On Hold</option>
                <option value="Complete">Complete</option>
              </select>
            </FormGroup>
            
            <FormGroup label="Completion Percentage" :error="errors.completionPercentage">
              <input type="number" v-model="projectForm.completionPercentage" min="0" max="100" />
            </FormGroup>
            
            <div class="form-actions">
              <Button type="submit" variant="primary" :text="isEditMode ? 'Update Project' : 'Create Project'" />
              <Button @click="closeProjectForm()" variant="secondary" text="Cancel" />
            </div>
          </form>
        </div>
      </div>
      
      <!-- Projects List -->
      <div v-if="loading" class="loading">Loading projects...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div v-else-if="filteredProjects.length === 0" class="no-projects">
        <p>No projects found. Create your first project!</p>
      </div>
      <div v-else class="projects-table-container">
        <table class="projects-table">
          <thead>
            <tr>
              <th>Project Name</th>
              <th>Status</th>
              <th>Timeline</th>
              <th>Progress</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="project in filteredProjects" :key="project.id" class="project-row">
              <td class="project-name-cell">
                <h3 class="project-name" @click="viewProject(project.id)">{{ project.name }}</h3>
                <p class="description">{{ project.description }}</p>
              </td>
              <td class="status-cell">
                <span :class="['status-badge', 'status-' + project.status.toLowerCase().replace(' ', '-')]">{{ project.status }}</span>
              </td>
              <td class="dates-cell">
                <div v-if="project.startDate" class="date-info">
                  <span class="date-icon">📅</span> 
                  <span>{{ formatDate(project.startDate) }}</span>
                </div>
                <div v-if="project.endDate" class="date-info">
                  <span class="date-icon">🗓️</span> 
                  <span>{{ formatDate(project.endDate) }}</span>
                </div>
              </td>
              <td class="progress-cell">
                <div v-if="project.completionPercentage != null" class="completion">
                  <div class="progress-bar">
                    <div class="progress" :style="{ width: project.completionPercentage + '%' }"></div>
                  </div>
                  <span>{{ project.completionPercentage }}%</span>
                </div>
              </td>
              <td class="actions-cell">
                <span class="action-icon view-icon" @click="viewProject(project.id)" title="View Details">
                  <i class="fas fa-eye"></i>
                </span>
                <span class="action-icon edit-icon" @click="openEditModal(project)" title="Edit Project">
                  <i class="fas fa-pen"></i>
                </span>
                <span class="action-icon delete-icon" @click="confirmDeleteProject(project)" title="Delete Project">
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
          <p>Are you sure you want to delete "{{ projectToDelete?.name }}"? This action cannot be undone.</p>
          <div class="modal-actions">
            <Button @click="deleteProject()" variant="danger" text="Delete" />
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
import axios from 'axios'
import { projectsAPI } from '../services/api'

export default {
  name: 'ProjectsView',
  components: {
    BaseLayout,
    Button,
    FormGroup,
    AlertMessage
  },
  data() {
    return {
      projects: [],
      loading: true,
      error: null,
      searchTerm: '',
      showProjectForm: false,
      isEditMode: false,
      editProjectId: null,
      showDeleteConfirm: false,
      projectToDelete: null,
      projectForm: {
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        status: 'Not Started',
        completionPercentage: 0
      },
      errors: {}
    }
  },
  computed: {
    filteredProjects() {
      if (!this.searchTerm) {
        return this.projects
      }
      
      const term = this.searchTerm.toLowerCase()
      return this.projects.filter(project => {
        return project.name.toLowerCase().includes(term) || 
               project.description.toLowerCase().includes(term) ||
               project.status.toLowerCase().includes(term)
      })
    }
  },
  methods: {
    openNewProjectModal() {
      // Reset form and show modal for creating a new project
      this.isEditMode = false
      this.editProjectId = null
      this.resetProjectForm()
      this.showProjectForm = true
    },
    
    openEditModal(project) {
      // Set edit mode and populate form with project data
      this.isEditMode = true
      this.editProjectId = project.id
      
      // Format dates for HTML date inputs (YYYY-MM-DD)
      const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        // Check if date is valid
        if (isNaN(date.getTime())) return '';
        
        // Format to YYYY-MM-DD for input
        return date.toISOString().split('T')[0];
      };
      
      // Clone project data to form
      this.projectForm = {
        name: project.name || '',
        description: project.description || '',
        startDate: formatDateForInput(project.startDate),
        endDate: formatDateForInput(project.endDate),
        status: project.status || 'Not Started',
        completionPercentage: project.completionPercentage || 0
      }
      
      console.log('Editing project:', project.id, this.projectForm);
      this.showProjectForm = true;
    },
    
    closeProjectForm() {
      this.showProjectForm = false
      this.isEditMode = false
      this.editProjectId = null
      this.errors = {}
    },
    async fetchProjects() {
      this.loading = true
      this.error = null
      
      try {
        // Use the projects API service to fetch projects
        const response = await projectsAPI.getAllProjects()
        console.log(`Received ${response.data?.length || 0} projects from API`)
        
        // Handle data and convert dates properly
        this.projects = Array.isArray(response.data) ? response.data.map(project => ({
          ...project,
          // Ensure dates are properly parsed
          startDate: project.startDate ? project.startDate : null,
          endDate: project.endDate ? project.endDate : null
        })) : []
        
        if (this.projects.length === 0) {
          console.log('No projects found or empty array returned')
        } else {
          console.log(`Successfully loaded ${this.projects.length} projects`)
        }
      } catch (error) {
        console.error('Error fetching projects:', error)
        this.error = 'Failed to load projects. Please try again.'
      } finally {
        this.loading = false
      }
    },
    async submitProjectForm() {
      this.errors = {}
      
      try {
        // Format dates correctly for API
        const formData = {
          ...this.projectForm,
          // Ensure dates are in proper format for API (YYYY-MM-DD)
          startDate: this.projectForm.startDate ? this.projectForm.startDate : null,
          endDate: this.projectForm.endDate ? this.projectForm.endDate : null,
          // Ensure completionPercentage is a number
          completionPercentage: parseInt(this.projectForm.completionPercentage) || 0
        }
        
        console.log('Submitting project form data:', formData)
        
        if (this.isEditMode && this.editProjectId) {
          // Update existing project
          console.log(`Updating project with ID ${this.editProjectId}`)
          // Explicitly convert ID to number to ensure correct type
          const projectId = Number(this.editProjectId)
          const response = await projectsAPI.updateProject(projectId, formData)
          
          // Update the project in the list
          const index = this.projects.findIndex(p => p.id === projectId)
          if (index !== -1) {
            this.projects.splice(index, 1, response.data)
            console.log('Project updated in list at index:', index)
          } else {
            console.warn('Project not found in list after update')
            // Refresh the project list to get the updated data
            await this.fetchProjects()
          }
          
          console.log('Project updated:', response.data)
        } else {
          // Create new project
          const response = await projectsAPI.createProject(formData)
          // Add the new project to the beginning of the projects array
          this.projects.unshift(response.data)
          console.log('Project created:', response.data)
        }
        
        this.closeProjectForm()
      } catch (error) {
        console.error(`Error ${this.isEditMode ? 'updating' : 'creating'} project:`, error)
        if (error.response && error.response.data) {
          this.errors = error.response.data.errors || {}
        }
      }
    },
    resetProjectForm() {
      // Get current date and date one week later in ISO format for date inputs
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      
      // Format dates in YYYY-MM-DD format for date inputs
      const formatDate = (date) => {
        return date.toISOString().split('T')[0];
      };
      
      this.projectForm = {
        name: '',
        description: '',
        startDate: formatDate(today),
        endDate: formatDate(nextWeek),
        status: 'Not Started',
        completionPercentage: 0
      }
    },
    viewProject(id) {
      this.$router.push(`/projects/${id}`)
    },
    // Old method kept for backwards compatibility
    editProject(id) {
      // Find the project and open the edit modal instead
      const project = this.projects.find(p => p.id === id)
      if (project) {
        this.openEditModal(project)
      }
    },
    confirmDeleteProject(project) {
      this.projectToDelete = project
      this.showDeleteConfirm = true
    },
    async deleteProject() {
      try {
        await projectsAPI.deleteProject(this.projectToDelete.id)
        this.projects = this.projects.filter(p => p.id !== this.projectToDelete.id)
        this.showDeleteConfirm = false
        this.projectToDelete = null
      } catch (error) {
        console.error('Error deleting project:', error)
        this.error = 'Failed to delete project. Please try again.'
      }
    },
    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString()
    }
  },
  created() {
    this.fetchProjects()
    this.resetProjectForm() // Initialize with default dates
  }
}
</script>

<style scoped>
.projects-view {
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

.projects-table-container {
  overflow-x: auto;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.projects-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

.projects-table th {
  text-align: left;
  padding: 1rem;
  font-weight: 600;
  color: #4a5568;
  border-bottom: 1px solid #f0f4f8;
  background-color: #f8fafc;
}

.projects-table td {
  padding: 1rem;
  vertical-align: top;
  border-bottom: 1px solid #f0f4f8;
}

.project-row:hover {
  background-color: #f8fafd;
}

.project-name-cell {
  min-width: 250px;
}

.project-name-cell h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: #2d3748;
}

.project-name {
  cursor: pointer;
  transition: color 0.2s ease;
}

.project-name:hover {
  color: #4299e1;
  text-decoration: underline;
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

.dates-cell {
  min-width: 140px;
}

.date-info {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: #718096;
}

.date-icon {
  margin-right: 0.5rem;
}

.progress-cell {
  min-width: 150px;
  padding: 1rem 1.5rem;
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

.view-icon {
  background-color: #e3f8ff; /* Pastel blue */
  color: #36b4e5;
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
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.form-actions, .modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.loading, .error, .no-projects {
  text-align: center;
  padding: 2rem;
  color: #4a5568;
}

.error {
  color: #c53030;
}
</style>