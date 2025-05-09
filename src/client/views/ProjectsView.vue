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
            
            <FormGroup label="Project Owner">
              <div class="owner-search">
                <input 
                  type="text" 
                  id="ownerSearch"
                  v-model="ownerSearch" 
                  @input="searchOwner"
                  @focus="ownerSearch ? searchOwner() : showAllOwners()"
                  placeholder="Search for owner (click to show all)..."
                  class="search-input"
                />
                
                <div v-if="ownerSearchResults.length > 0" class="owner-search-results">
                  <div 
                    v-for="user in ownerSearchResults" 
                    :key="user.id" 
                    class="owner-search-item"
                    @click="selectOwner(user)"
                  >
                    <span class="owner-avatar">
                      <i class="fas fa-user"></i>
                    </span>
                    <div class="owner-info">
                      <span class="owner-username"><strong>{{ user.username }}</strong> <span class="user-id">(#{{ user.id }})</span></span>
                      <span class="owner-email" v-if="user.email">{{ user.email }}</span>
                      <span class="owner-position">
                        {{ user.role === 'manager' ? '👑 ' : user.role === 'admin' ? '⚙️ ' : '' }}
                        {{ user.department ? user.department : '' }}
                        {{ user.department && user.jobTitle ? ' - ' : '' }}
                        {{ user.jobTitle ? user.jobTitle : '' }}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div v-if="ownerSearch && ownerSearchResults.length === 0" class="no-results">
                  No users found matching "{{ ownerSearch }}"
                  <button @click="showAllOwners()" class="show-all-button">Show all users</button>
                </div>
                
                <!-- Show error message if there's an API error -->
                <div v-if="error" class="api-error">
                  <p>{{ error }}</p>
                  <button @click="retryFetchUsers()" class="retry-button">Retry</button>
                </div>
                
                <div v-if="projectForm.ownerId" class="selected-owner">
                  <div class="owner-badge">
                    <span class="owner-badge-avatar">
                      <i class="fas fa-user-shield"></i>
                    </span>
                    <span class="owner-badge-info">
                      <strong>{{ getOwnerName() }}</strong>
                      <span v-if="getOwnerDetails()" class="owner-details">{{ getOwnerDetails() }}</span>
                    </span>
                    <button type="button" class="clear-owner" @click="clearOwner()" title="Remove owner">&times;</button>
                  </div>
                </div>
              </div>
            </FormGroup>
            
            <FormGroup label="Team Members">
              <div class="team-members-section">
                <div v-if="usersLoading" class="loading-indicator">Loading users...</div>
                <div v-else>
                  <div class="team-member-search">
                    <input 
                      type="text" 
                      id="teamMemberSearch"
                      v-model="teamMemberSearch" 
                      @input="searchTeamMembers"
                      @focus="teamMemberSearch ? searchTeamMembers() : showAllTeamMembers()"
                      placeholder="Search for team member by username or ID..."
                      class="search-input"
                    />
                    
                    <div v-if="teamMemberSearchResults.length > 0" class="team-member-search-results">
                      <div 
                        v-for="user in teamMemberSearchResults" 
                        :key="user.id" 
                        class="team-member-search-item"
                        @click="selectTeamMember(user)"
                        :class="{ 'disabled': user.id === projectForm.ownerId || projectForm.teamMembers.includes(user.id) }"
                      >
                        <span class="team-member-avatar">
                          <i class="fas fa-user"></i>
                        </span>
                        <div class="team-member-info">
                          <span class="team-member-username"><strong>{{ user.username }}</strong> <span class="user-id">(#{{ user.id }})</span></span>
                          <span class="team-member-position">
                            {{ user.department }} {{ user.jobTitle ? (user.department ? ' - ' : '') + user.jobTitle : '' }}
                          </span>
                        </div>
                        <div v-if="projectForm.teamMembers.includes(user.id)" class="already-selected">
                          <i class="fas fa-check"></i>
                        </div>
                        <div v-else-if="user.id === projectForm.ownerId" class="owner-indicator">
                          <i class="fas fa-user-shield"></i> Owner
                        </div>
                      </div>
                    </div>
                    
                    <div v-if="teamMemberSearch && teamMemberSearchResults.length === 0" class="no-results">
                      No users found matching "{{ teamMemberSearch }}"
                      <button @click="showAllTeamMembers()" class="show-all-button">Show all team members</button>
                    </div>
                    
                    <!-- Show error message if there's an API error -->
                    <div v-if="error" class="api-error">
                      <p>{{ error }}</p>
                      <button @click="retryFetchUsers()" class="retry-button">Retry</button>
                    </div>
                    
                    <!-- Show message when no users have been loaded at all -->
                    <div v-if="!teamMemberSearch && users.length === 0 && !usersLoading" class="no-results">
                      <span v-if="error">{{ error }}</span>
                      <span v-else>Click in the search box to load users</span>
                      <button @click="retryFetchUsers()" class="retry-button">Load Users</button>
                    </div>
                  </div>
                  
                  <!-- Selected members count and badges -->
                  <div class="selected-members">
                    <div class="selected-count">
                      {{ projectForm.teamMembers.length }} team member(s) selected
                    </div>
                    <div v-if="projectForm.teamMembers.length > 0" class="selected-team-members">
                      <div v-for="memberId in projectForm.teamMembers" :key="memberId" class="team-member-badge">
                        <span class="team-member-badge-avatar">
                          <i class="fas fa-user"></i>
                        </span>
                        <span class="team-member-badge-info">{{ getUsernameById(memberId) }}</span>
                        <button type="button" class="clear-team-member" @click="removeTeamMember(memberId)" title="Remove team member">&times;</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
            <tr v-for="project in filteredProjects" :key="project.id" class="project-row" @click="viewProject(project.id)">
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
                <span class="action-icon edit-icon" @click.stop="openEditModal(project)" title="Edit Project">
                  <i class="fas fa-pen"></i>
                </span>
                <span class="action-icon delete-icon" @click.stop="confirmDeleteProject(project)" title="Delete Project">
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
import { projectsAPI, usersAPI } from '../services/api'

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
        completionPercentage: 0,
        ownerId: null,
        teamMembers: []
      },
      users: [],
      usersLoading: false,
      teamMemberSearch: '',
      teamMemberSearchResults: [],
      ownerSearch: '',
      ownerSearchResults: [],
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
    async openNewProjectModal() {
      // Reset form and show modal for creating a new project
      this.isEditMode = false
      this.editProjectId = null
      this.resetProjectForm()
      this.showProjectForm = true
      
      // Load users for team member and owner selection
      await this.fetchUsers()
      
      // Initialize search results with all users for easier selection
      this.teamMemberSearchResults = [...this.users];
      this.teamMemberSearchResults.sort((a, b) => a.username.localeCompare(b.username));
    },
    
    // Fetch users from the API properly
    async fetchUsers() {
      this.usersLoading = true;
      this.error = null;
      
      try {
        // Make the API call with a proper timeout and retry logic
        const response = await this.fetchWithRetry(() => usersAPI.getUsersForProjectAssignment(), 3);
        
        // The API returns users in response.data directly
        if (response && response.data && Array.isArray(response.data)) {
          const apiUsers = response.data;
          console.log(`Successfully loaded ${apiUsers.length} users from API`);
          
          // Ensure we have all required fields for each user
          this.users = apiUsers.map(user => ({
            id: user.id,
            username: user.username || `User ${user.id}`,
            email: user.email || '', // Make sure email is included
            role: user.role || 'user',
            department: user.department || 'General',
            jobTitle: user.jobTitle || 'Staff'
          }));
          
          // Initialize search results with the loaded data
          this.teamMemberSearchResults = [...this.users];
          this.teamMemberSearchResults.sort((a, b) => a.username.localeCompare(b.username));
          this.ownerSearchResults = [...this.users];
          
          // Sort owner results by role (managers first)
          this.sortOwnerResults();
        } else {
          console.warn('API returned no users or invalid format');
          this.error = 'Could not load users from the database. Please try again later.';
        }
      } catch (error) {
        console.error('Error fetching users from API:', error);
        this.error = 'Failed to load users. Please check your connection and try again.';
      } finally {
        this.usersLoading = false;
      }
      
      return this.users;
    },
    
    // Helper method to fetch with retry logic
    async fetchWithRetry(fetchFn, maxRetries = 3, delay = 1000) {
      let lastError;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await fetchFn();
        } catch (error) {
          console.warn(`Fetch attempt ${attempt} failed:`, error);
          lastError = error;
          
          if (attempt < maxRetries) {
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay));
            // Increase delay for next attempt (exponential backoff)
            delay *= 2;
          }
        }
      }
      
      throw lastError;
    },
    
    
    // Search for project owner by username or ID
    searchOwner() {
      // When empty search, show all users for easier selection
      if (!this.ownerSearch.trim()) {
        this.ownerSearchResults = [...this.users];
        
        // Sort by role (managers first, then admins, then others)
        this.sortOwnerResults();
        return;
      }

      const searchTerm = this.ownerSearch.toLowerCase().trim();
      console.log(`Searching for owner with term: "${searchTerm}"`);
      
      // Always show all users if we have a partial match on 1-2 characters
      if (searchTerm.length <= 2) {
        this.ownerSearchResults = [...this.users];
        this.sortOwnerResults();
        return;
      }
      
      // Make sure users are loaded
      if (this.users.length === 0) {
        // If no users are loaded, fetch them first
        this.fetchUsers().then(() => {
          if (this.users.length > 0) {
            this.performOwnerSearch(searchTerm);
          }
        });
        return;
      }
      
      // Perform the search
      this.performOwnerSearch(searchTerm);
    },
    
    // Perform the actual owner search
    performOwnerSearch(searchTerm) {
      console.log(`Performing owner search with term: "${searchTerm}"`);
      console.log(`Current user count: ${this.users.length}`);
      
      // Filter users based on search term
      this.ownerSearchResults = this.users.filter(user => {
        if (!user) return false;
        
        // Match by username
        if (user.username && user.username.toLowerCase().includes(searchTerm)) {
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
      
      this.sortOwnerResults();
      console.log(`Found ${this.ownerSearchResults.length} matching users for owner search`);
    },
    
    // Sort owner results with managers and admins first
    sortOwnerResults() {
      // Sort results to show managers first, then admins, then regular users
      this.ownerSearchResults.sort((a, b) => {
        // Managers first
        if (a.role === 'manager' && b.role !== 'manager') return -1;
        if (b.role === 'manager' && a.role !== 'manager') return 1;
        
        // Then admins
        if (a.role === 'admin' && b.role !== 'admin') return -1;
        if (b.role === 'admin' && a.role !== 'admin') return 1;
        
        // Then alphabetically by username
        return a.username.localeCompare(b.username);
      });
    },
    
    // Select a user as project owner
    selectOwner(user) {
      this.projectForm.ownerId = user.id;
      this.ownerSearch = '';
      this.ownerSearchResults = [];
      
      // If selected as owner, remove from team members if present
      if (this.projectForm.teamMembers.includes(user.id)) {
        this.removeTeamMember(user.id);
      }
    },
    
    // Clear the selected owner
    clearOwner() {
      this.projectForm.ownerId = null;
    },
    
    // Get the name of the selected owner
    getOwnerName() {
      if (!this.projectForm.ownerId) return '';
      
      // First try to find the user in our loaded users
      const owner = this.users.find(u => u.id === this.projectForm.ownerId);
      if (owner) {
        // Prioritize showing username
        return owner.username;
      }
      
      // If user not found in our loaded users, fetch it from API
      this.fetchOwnerById(this.projectForm.ownerId);
      
      // Return a temporary display until the API call completes
      return `Loading user...`;
    },
    
    // Get details for the selected owner (department, job title)
    getOwnerDetails() {
      if (!this.projectForm.ownerId) return '';
      
      const owner = this.users.find(u => u.id === this.projectForm.ownerId);
      if (!owner) return '';
      
      let details = [];
      
      if (owner.jobTitle) {
        details.push(owner.jobTitle);
      }
      
      if (owner.department) {
        details.push(owner.department);
      }
      
      if (owner.role) {
        // Format role for display
        const formattedRole = owner.role.charAt(0).toUpperCase() + owner.role.slice(1);
        details.push(formattedRole);
      }
      
      return details.join(' • ');
    },
    
    
    // Fetch a specific owner by ID if not found in our users list
    async fetchOwnerById(ownerId) {
      try {
        const response = await usersAPI.getUserById(ownerId);
        if (response.data) {
          // Add user to our users array if not already there
          if (!this.users.some(u => u.id === response.data.id)) {
            this.users.push(response.data);
          }
        }
      } catch (error) {
        console.error(`Error fetching owner with ID ${ownerId}:`, error);
      }
    },
    
    
    // Search for team members by username or ID
    searchTeamMembers() {
      // When search is empty, show all users for easier selection
      if (!this.teamMemberSearch.trim()) {
        // Always make sure we have users loaded
        if (this.users.length === 0) {
          this.fetchUsers().then(() => {
            this.teamMemberSearchResults = [...this.users];
            this.teamMemberSearchResults.sort((a, b) => a.username.localeCompare(b.username));
          });
          return;
        }
        this.teamMemberSearchResults = [...this.users];
        this.teamMemberSearchResults.sort((a, b) => a.username.localeCompare(b.username));
        return;
      }

      const searchTerm = this.teamMemberSearch.toLowerCase().trim();
      console.log(`Searching for team members with term: '${searchTerm}'`);
      
      // For short search terms, just show all users
      if (searchTerm.length <= 2) {
        this.teamMemberSearchResults = [...this.users];
        this.teamMemberSearchResults.sort((a, b) => a.username.localeCompare(b.username));
        return;
      }
      
      // Make sure users are loaded
      if (this.users.length === 0) {
        // If no users are loaded, fetch them first
        this.fetchUsers().then(() => {
          if (this.users.length > 0) {
            this.performTeamMemberSearch(searchTerm);
          }
        });
        return;
      }
      
      // Perform the search
      this.performTeamMemberSearch(searchTerm);
    },
    
    // Perform the actual team member search
    performTeamMemberSearch(searchTerm) {
      console.log(`Performing team member search with: '${searchTerm}'`);
      console.log(`Current user count: ${this.users.length}`);
      
      if (this.users.length === 0) {
        console.warn('No users available for search!');
        this.error = 'Unable to load users. Please try refreshing the page.';
        return;
      }
      
      this.teamMemberSearchResults = this.users.filter(user => {
        if (!user) return false;
        
        // Match by username
        if (user.username && user.username.toLowerCase().includes(searchTerm)) {
          return true;
        }
        
        // Match by user ID (if search term is a number)
        if (!isNaN(searchTerm) && user.id === parseInt(searchTerm)) {
          return true;
        }
        
        // Match by department or job title for more flexible search
        if (user.department && user.department.toLowerCase().includes(searchTerm)) {
          return true;
        }
        
        if (user.jobTitle && user.jobTitle.toLowerCase().includes(searchTerm)) {
          return true;
        }
        
        return false;
      });
      
      // Sort results by username
      this.teamMemberSearchResults.sort((a, b) => a.username.localeCompare(b.username));
      
      console.log(`Found ${this.teamMemberSearchResults.length} matching team members`);
    },
    
    
    // Get username by user ID
    getUsernameById(userId) {
      const user = this.users.find(u => u.id === userId);
      return user ? user.username : `User ${userId}`;
    },
    
    // Select a user as team member
    selectTeamMember(user) {
      // Don't add if already a team member or is owner
      if (user.id === this.projectForm.ownerId || this.projectForm.teamMembers.includes(user.id)) {
        return;
      }
      
      // Add to team members array
      this.projectForm.teamMembers.push(user.id);
      this.teamMemberSearch = '';
      this.teamMemberSearchResults = [];
    },
    
    // Remove a team member from the selection
    removeTeamMember(memberId) {
      this.projectForm.teamMembers = this.projectForm.teamMembers.filter(id => id !== memberId);
    },
    
    // Show all available users as owners
    showAllOwners() {
      console.log('Showing all users for owner selection');
      // Make sure users are loaded
      if (this.users.length === 0) {
        this.fetchUsers().then(() => {
          this.ownerSearchResults = [...this.users];
          this.sortOwnerResults();
        });
        return;
      }
      
      // Show all users sorted by role
      this.ownerSearchResults = [...this.users];
      this.sortOwnerResults();
      console.log(`Showing all ${this.ownerSearchResults.length} users for owner selection`);
    },
    
    // Show all available users as team members
    showAllTeamMembers() {
      console.log('Showing all users for team member selection');
      // Make sure users are loaded
      if (this.users.length === 0) {
        this.fetchUsers().then(() => {
          this.teamMemberSearchResults = [...this.users];
          this.teamMemberSearchResults.sort((a, b) => a.username.localeCompare(b.username));
        });
        return;
      }
      
      // Show all users
      this.teamMemberSearchResults = [...this.users];
      this.teamMemberSearchResults.sort((a, b) => a.username.localeCompare(b.username));
      console.log(`Showing all ${this.teamMemberSearchResults.length} users for team member selection`);
    },
    
    async openEditModal(project) {
      // Set edit mode first
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
      
      // Process team members to ensure they're in the right format
      let teamMembers = [];
      if (project.teamMembers) {
        if (Array.isArray(project.teamMembers)) {
          teamMembers = project.teamMembers.map(id => typeof id === 'string' ? parseInt(id) : id);
        } else if (typeof project.teamMembers === 'string') {
          // Handle case where teamMembers comes back as a comma-separated string
          teamMembers = project.teamMembers.split(',').map(id => parseInt(id.trim()));
        }
      }
      
      // Clone project data to form
      this.projectForm = {
        name: project.name || '',
        description: project.description || '',
        startDate: formatDateForInput(project.startDate),
        endDate: formatDateForInput(project.endDate),
        status: project.status || 'Not Started',
        completionPercentage: project.completionPercentage || 0,
        ownerId: project.ownerId || null,
        teamMembers: teamMembers
      }
      
      // Load users and then update the filtered list
      await this.fetchUsers();
      
      // Initialize search results with all users for easier selection
      this.teamMemberSearchResults = [...this.users];
      this.teamMemberSearchResults.sort((a, b) => a.username.localeCompare(b.username));
      
      // Fetch any missing team members if needed
      this.ensureTeamMembersData();
      
      console.log('Editing project:', project.id, this.projectForm);
      this.showProjectForm = true;
    },
    
    // Make sure we have data for all team members
    async ensureTeamMembersData() {
      if (!this.projectForm.teamMembers || this.projectForm.teamMembers.length === 0) {
        return;
      }
      
      // Look for any team members we don't have data for
      for (const memberId of this.projectForm.teamMembers) {
        if (!this.users.some(u => u.id === memberId)) {
          try {
            // Fetch the missing team member
            const response = await usersAPI.getUserById(memberId);
            if (response.data) {
              this.users.push(response.data);
            }
          } catch (error) {
            console.error(`Error fetching team member with ID ${memberId}:`, error);
          }
        }
      }
    },
    
    closeProjectForm() {
      this.showProjectForm = false
      this.isEditMode = false
      this.editProjectId = null
      this.errors = {}
    },
    // Retry fetching users when there's an error
    async retryFetchUsers() {
      this.error = null;
      console.log('Retrying user fetch...');
      await this.fetchUsers();
      
      // If users loaded successfully, show them
      if (this.users.length > 0) {
        console.log('Users loaded successfully, showing all users');
        this.showAllOwners();
        this.showAllTeamMembers();
      } else {
        console.warn('No users were loaded after retry');
      }
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
          completionPercentage: parseInt(this.projectForm.completionPercentage) || 0,
          // Include owner and team members
          ownerId: this.projectForm.ownerId || null,
          teamMembers: this.projectForm.teamMembers || [],
          // Add metadata with empty notes fields
          metadata: {
            clientNotes: '',
            internalNotes: ''
          }
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
        completionPercentage: 0,
        ownerId: null,
        teamMembers: []
      }
      
      // Reset search fields
      this.teamMemberSearch = '';
      this.ownerSearch = '';
      this.teamMemberSearchResults = [];
      this.ownerSearchResults = [];
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
/* Team Member search styles */
.team-member-search {
  position: relative;
  margin-bottom: 1rem;
}

.team-member-search-results {
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

.team-member-search-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border-bottom: 1px solid #eee;
  cursor: pointer;
}

.team-member-search-item:hover {
  background-color: #f5f5f5;
}

.team-member-search-item:last-child {
  border-bottom: none;
}

.team-member-search-item.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: #f5f5f5;
}

.team-member-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background-color: #eee;
  border-radius: 50%;
  margin-right: 0.75rem;
}

.team-member-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.team-member-username {
  font-size: 0.9rem;
}

.team-member-position {
  font-size: 0.8rem;
  color: #666;
}

.already-selected,
.owner-indicator {
  font-size: 0.8rem;
  color: #0d6efd;
  border-left: 1px solid #eee;
  padding-left: 0.75rem;
  margin-left: 0.5rem;
  display: flex;
  align-items: center;
}

.owner-indicator {
  color: #198754;
}

.already-selected i,
.owner-indicator i {
  margin-right: 0.4rem;
}

.selected-team-members {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.team-member-badge {
  display: flex;
  align-items: center;
  background-color: #f0f7ff;
  border: 1px solid #cce5ff;
  border-radius: 4px;
  padding: 0.4rem 0.6rem;
  font-size: 0.85rem;
}

.team-member-badge-avatar {
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

.team-member-badge-info {
  flex: 1;
}

.clear-team-member {
  background: transparent;
  border: none;
  color: #6c757d;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 0 0.25rem;
  margin-left: 0.5rem;
}

.clear-team-member:hover {
  color: #dc3545;
}
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
  border-bottom: 2px solid #e2e8f0;
  background-color: #f8fafc;
}

.projects-table td {
  padding: 1rem;
  vertical-align: top;
  border-bottom: none;
}

.project-row {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  cursor: pointer;
  background-color: #ffffff;
  border-bottom: 1px solid #f0f4f8;
}

.project-row td {
  border-bottom: none;
}

.project-row:hover {
  background-color: #f0f7ff; /* Light pastel blue */
  transform: translateY(-3px);
  box-shadow: 0 3px 15px rgba(92, 107, 192, 0.1);
  z-index: 1;
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
  background-color: #e8eaf6;
  color: #5c6bc0;
  border: 1px solid #d1d6f0;
}

.status-in-progress {
  background-color: #e1f5fe;
  color: #039be5;
  border: 1px solid #b3e5fc;
}

.status-on-hold {
  background-color: #ffecb3;
  color: #ff8f00;
  border: 1px solid #ffe082;
}

.status-complete {
  background-color: #e0f2f1;
  color: #00897b;
  border: 1px solid #b2dfdb;
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
  background-color: #5c6bc0; /* Match our primary color */
  background-image: linear-gradient(to right, #5c6bc0, #7986cb);
}

.actions-cell {
  white-space: nowrap;
  min-width: 100px;
}

.action-icon {
  display: inline-block;
  margin: 0 0.5rem;
  width: 32px;
  height: 32px;
  line-height: 32px;
  text-align: center;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.action-icon i {
  font-size: 0.9rem;
}

.view-icon {
  background-color: #e3f8ff; /* Pastel blue */
  color: #36b4e5;
}

.edit-icon {
  background-color: #fff8e1; /* Light amber/yellow */
  color: #ffab00;
}

.delete-icon {
  background-color: #fce4ec; /* Pastel pink */
  color: #ec407a;
}

.action-icon:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Action icon styling */
.action-icon {
  position: relative;
  z-index: 5;
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

/* Owner search styles */
.owner-search {
  position: relative;
  margin-top: 0.5rem;
}

.owner-search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 200px;
  overflow-y: auto;
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.owner-search-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border-bottom: 1px solid #f0f4f8;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.owner-search-item:last-child {
  border-bottom: none;
}

.owner-search-item:hover {
  background-color: #edf2f7;
}

.owner-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  margin-right: 0.75rem;
  flex-shrink: 0;
}

.owner-info {
  display: flex;
  flex-direction: column;
}

.owner-username {
  color: #2d3748;
  font-size: 0.95rem;
}

.owner-position {
  color: #718096;
  font-size: 0.8rem;
}

.user-id {
  color: #a0aec0;
  font-size: 0.75rem;
  font-weight: normal;
}

.owner-email {
  color: #4299e1;
  font-size: 0.8rem;
  margin-bottom: 0.2rem;
  display: block;
}

.selected-owner {
  margin-top: 1rem;
}

.owner-badge {
  display: inline-flex;
  align-items: center;
  background-color: #ebf8ff;
  border: 1px solid #bee3f8;
  border-radius: 50px;
  padding: 0.5rem 1rem;
  color: #2b6cb0;
}

.owner-badge-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #63b3ed;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-right: 0.5rem;
  flex-shrink: 0;
}

.owner-badge-info {
  display: flex;
  flex-direction: column;
  margin-right: 0.5rem;
}

.owner-badge-info strong {
  font-weight: 600;
  font-size: 0.95rem;
}

.owner-details {
  font-size: 0.8rem;
  color: #4a5568;
  margin-top: 0.1rem;
}

.clear-owner {
  background: none;
  border: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: #63b3ed;
  color: white;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.clear-owner:hover {
  background-color: #2b6cb0;
}

/* Team Members Styles */
.team-members-section {
  margin-bottom: 1.5rem;
}

.team-members-search {
  margin-bottom: 0.75rem;
}

.search-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 0.9rem;
}

.team-members-list, .search-results {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
}

.team-member-item, .search-result-item {
  padding: 0.5rem;
  border-bottom: 1px solid #f0f4f8;
}

.team-member-item:last-child, .search-result-item:last-child {
  border-bottom: none;
}

.search-result-item {
  background-color: #f8fafc;
}

.team-member-email {
  color: #4299e1;
  font-size: 0.8rem;
  margin-left: 0.5rem;
  display: block;
  margin-top: 0.2rem;
}

.team-member-info {
  color: #718096;
  font-size: 0.8rem;
  display: block;
  margin-top: 0.2rem;
}

.no-results {
  padding: 0.75rem;
  color: #a0aec0;
  font-style: italic;
  text-align: center;
  background-color: #f8fafc;
  border: 1px dashed #e2e8f0;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.show-all-button {
  background-color: #e6f7ff;
  border: 1px solid #bae7ff;
  color: #1890ff;
  padding: 0.3rem 0.7rem;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.show-all-button:hover {
  background-color: #bae7ff;
  color: #096dd9;
}

.api-error {
  padding: 0.75rem;
  background-color: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 4px;
  margin-bottom: 0.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: #cf1322;
}

.api-error p {
  margin: 0;
  text-align: center;
  font-size: 0.9rem;
}

.retry-button {
  background-color: #ff4d4f;
  color: white;
  border: none;
  padding: 0.4rem 1rem;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-button:hover {
  background-color: #ff7875;
}

.selected-members {
  margin-top: 0.75rem;
}

.selected-count {
  font-size: 0.8rem;
  color: #718096;
  margin-bottom: 0.5rem;
}

.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem;
  font-size: 0.9rem;
  color: #4a5568;
  border-radius: 4px;
  background-color: #f7fafc;
  margin-bottom: 0.5rem;
}

.loading-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(79, 209, 197, 0.3);
  border-radius: 50%;
  border-top-color: #4fd1c5;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.selected-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.selected-badge {
  display: inline-flex;
  align-items: center;
  background-color: #ebf8ff;
  color: #3182ce;
  font-size: 0.8rem;
  padding: 0.25rem 0.5rem;
  border-radius: 50px;
  border: 1px solid #bee3f8;
}

.remove-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 0.25rem;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: #63b3ed;
  color: white;
  font-size: 0.75rem;
  cursor: pointer;
}

.remove-badge:hover {
  background-color: #3182ce;
}
</style>