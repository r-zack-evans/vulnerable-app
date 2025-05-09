<template>
  <BaseLayout>
    <div class="profile-view">
      <div class="profile-header">
        <h1>User Profile</h1>
        <div class="profile-actions" v-if="!isEditMode">
          <Button @click="enterEditMode()" variant="secondary" text="Edit Profile" />
        </div>
      </div>
      
      <div v-if="loading" class="loading">Loading profile details...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      
      <!-- Edit Form -->
      <div v-if="isEditMode" class="edit-form-container">
        <form @submit.prevent="saveProfile" class="profile-edit-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" v-model="editForm.email" required />
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="username">Username</label>
              <input type="text" id="username" v-model="editForm.username" :disabled="!isAdmin" />
              <div v-if="!isAdmin" class="field-note">Username can only be changed by an administrator.</div>
            </div>
            
            <div class="form-group">
              <label for="userId">User ID</label>
              <input type="text" id="userId" v-model="editForm.id" disabled />
              <div class="field-note">User ID cannot be changed.</div>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="department">Department</label>
              <input type="text" id="department" v-model="editForm.department" />
            </div>
            
            <div class="form-group">
              <label for="jobTitle">Job Title</label>
              <input type="text" id="jobTitle" v-model="editForm.jobTitle" />
            </div>
          </div>
          
          <div class="form-section">
            <h3>User Preferences</h3>
            
            <div class="form-group">
              <label for="theme">Theme</label>
              <select id="theme" v-model="editForm.preferences.theme">
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System Default</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="notifications">
                <input type="checkbox" id="notifications" v-model="editForm.preferences.notifications" />
                Enable notifications
              </label>
            </div>
            
            <div class="form-group">
              <label for="dashboardLayout">Dashboard Layout</label>
              <select id="dashboardLayout" v-model="editForm.preferences.dashboardLayout">
                <option value="grid">Grid</option>
                <option value="list">List</option>
                <option value="compact">Compact</option>
              </select>
            </div>
          </div>
          
          <div class="form-group">
            <label for="profilePicture">Profile Picture URL</label>
            <input type="text" id="profilePicture" v-model="editForm.profilePicture" />
          </div>
          
          <div class="form-section">
            <h3>Security</h3>
            
            <div class="form-group">
              <label for="currentPassword">Current Password</label>
              <input type="password" id="currentPassword" v-model="editForm.currentPassword" />
              <div class="field-note">Required to change password</div>
            </div>
            
            <div class="form-group">
              <label for="newPassword">New Password</label>
              <input type="password" id="newPassword" v-model="editForm.newPassword" />
              <div class="field-note">Leave blank to keep current password</div>
            </div>
            
            <div class="form-group">
              <label for="confirmPassword">Confirm New Password</label>
              <input type="password" id="confirmPassword" v-model="editForm.confirmPassword" />
            </div>
          </div>
          
          <div class="form-actions">
            <Button type="submit" variant="primary" text="Save Profile" />
            <Button @click="cancelEdit()" variant="secondary" text="Cancel" />
          </div>
        </form>
      </div>
      
      <!-- View Mode -->
      <div v-else-if="user" class="profile-content">
        <div class="profile-info-card">
          <div class="card-section user-info-section">
            <div class="user-profile-header">
              <div class="profile-picture" v-if="user.profilePicture">
                <img :src="user.profilePicture" alt="Profile picture" />
              </div>
              <div class="profile-picture default-avatar" v-else>
                <i class="fas fa-user"></i>
              </div>
              
              <div class="user-details">
                <h2 class="username">{{ user.username }}</h2>
                <p class="user-role">{{ formatRole(user.role) }}</p>
                <p class="user-meta" v-if="user.department || user.jobTitle">
                  {{ user.department }}<span v-if="user.department && user.jobTitle"> - </span>{{ user.jobTitle }}
                </p>
              </div>
            </div>
          </div>
          
          <div class="card-section contact-section">
            <h3>Contact Information</h3>
            <div class="contact-info">
              <p><strong>Email:</strong> {{ user.email }}</p>
            </div>
          </div>
          
          <div class="card-section preferences-section">
            <h3>Preferences</h3>
            <div class="preferences-list">
              <p><strong>Theme:</strong> {{ formatPreference(user.preferences?.theme) }}</p>
              <p><strong>Notifications:</strong> {{ user.preferences?.notifications ? 'Enabled' : 'Disabled' }}</p>
              <p><strong>Dashboard Layout:</strong> {{ formatPreference(user.preferences?.dashboardLayout) }}</p>
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
import { usersAPI } from '../services/api'

export default {
  name: 'ProfileView',
  components: {
    BaseLayout,
    Button
  },
  data() {
    return {
      user: null,
      loading: true,
      error: null,
      isEditMode: false,
      editForm: {
        id: '',
        username: '',
        email: '',
        department: '',
        jobTitle: '',
        role: '',
        profilePicture: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        preferences: {
          theme: 'light',
          notifications: true,
          dashboardLayout: 'grid'
        }
      }
    }
  },
  computed: {
    isAdmin() {
      return this.user && this.user.role === 'admin'
    }
  },
  created() {
    this.fetchProfile()
  },
  methods: {
    async fetchProfile() {
      this.loading = true
      this.error = null
      
      try {
        const response = await usersAPI.getProfile()
        this.user = response.data
        console.log('Profile loaded:', this.user)
        
        // Initialize edit form if in edit mode
        if (this.isEditMode) {
          this.populateEditForm()
        }
        
        // Update document title
        document.title = 'User Profile'
      } catch (error) {
        console.error('Error fetching profile:', error)
        this.error = 'Failed to load profile. Please try again or contact support.'
      } finally {
        this.loading = false
      }
    },
    
    populateEditForm() {
      // Ensure preferences is an object
      const preferences = this.user.preferences || {}
      
      this.editForm = {
        id: this.user.id || '',
        username: this.user.username || '',
        email: this.user.email || '',
        department: this.user.department || '',
        jobTitle: this.user.jobTitle || '',
        role: this.user.role || 'user',
        profilePicture: this.user.profilePicture || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        preferences: {
          theme: preferences.theme || 'light',
          notifications: preferences.notifications !== undefined ? preferences.notifications : true,
          dashboardLayout: preferences.dashboardLayout || 'grid'
        }
      }
    },
    
    enterEditMode() {
      this.isEditMode = true
      this.populateEditForm()
    },
    
    cancelEdit() {
      this.isEditMode = false
      this.editForm.currentPassword = ''
      this.editForm.newPassword = ''
      this.editForm.confirmPassword = ''
    },
    
    formatRole(role) {
      if (!role) return 'User'
      
      // Capitalize first letter
      return role.charAt(0).toUpperCase() + role.slice(1)
    },
    
    formatPreference(value) {
      if (!value) return 'Default'
      
      // Convert camelCase or snake_case to Title Case
      return value
        .replace(/([A-Z])/g, ' $1') // Insert a space before all capital letters
        .replace(/^./, str => str.toUpperCase()) // Uppercase the first character
    },
    
    validateForm() {
      // Password validation
      if (this.editForm.newPassword) {
        if (!this.editForm.currentPassword) {
          this.error = 'Current password is required to set a new password'
          return false
        }
        
        if (this.editForm.newPassword !== this.editForm.confirmPassword) {
          this.error = 'New password and confirmation do not match'
          return false
        }
        
        if (this.editForm.newPassword.length < 8) {
          this.error = 'Password must be at least 8 characters long'
          return false
        }
      }
      
      // Email validation
      if (!this.editForm.email || !/^\S+@\S+\.\S+$/.test(this.editForm.email)) {
        this.error = 'Please enter a valid email address'
        return false
      }
      
      return true
    },
    
    async saveProfile() {
      if (!this.validateForm()) {
        return
      }
      
      this.loading = true
      this.error = null
      
      try {
        // Prepare user data for update
        const userData = {
          email: this.editForm.email,
          department: this.editForm.department,
          jobTitle: this.editForm.jobTitle,
          profilePicture: this.editForm.profilePicture,
          preferences: this.editForm.preferences
        }
        
        // Only include username if admin
        if (this.isAdmin) {
          userData.username = this.editForm.username
        }
        
        // Include password data if changing password
        if (this.editForm.newPassword) {
          userData.currentPassword = this.editForm.currentPassword
          userData.newPassword = this.editForm.newPassword
        }
        
        const response = await usersAPI.updateProfile(userData)
        
        // Update local user data
        this.user = response.data
        
        // Exit edit mode
        this.isEditMode = false
        
        // Clear sensitive form fields
        this.editForm.currentPassword = ''
        this.editForm.newPassword = ''
        this.editForm.confirmPassword = ''
        
        // Show success message (would use a notification system in a real app)
        alert('Profile updated successfully')
      } catch (error) {
        console.error('Error updating profile:', error)
        this.error = error.response?.data?.message || 'Failed to update profile. Please try again.'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.profile-view {
  padding: 2rem 0;
  max-width: 900px;
  margin: 0 auto;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eaeaea;
}

.profile-header h1 {
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

/* Edit Form Styles */
.edit-form-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  padding: 2rem;
}

.profile-edit-form {
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
input[type="email"],
input[type="password"],
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

.field-note {
  font-size: 0.8rem;
  color: #666;
  margin-top: 0.25rem;
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
.profile-info-card {
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

.user-profile-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem 0;
}

.profile-picture {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  background-color: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-picture img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.default-avatar {
  font-size: 3rem;
  color: #adb5bd;
}

.user-details {
  flex: 1;
}

.username {
  margin: 0 0 0.25rem 0;
  font-size: 1.5rem;
  color: #333;
}

.user-role {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #6c757d;
  font-weight: 500;
}

.user-meta {
  margin: 0;
  font-size: 0.9rem;
  color: #6c757d;
}

.contact-info p,
.preferences-list p {
  margin: 0.5rem 0;
}
</style>