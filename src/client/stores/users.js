import { defineStore } from 'pinia'
import { usersAPI } from '../services/api'

export const useUserStore = defineStore('users', {
  state: () => ({
    users: [],
    loading: false,
    error: null
  }),
  
  getters: {
    adminUsers: (state) => {
      return state.users.filter(user => user.role === 'admin')
    },
    regularUsers: (state) => {
      return state.users.filter(user => user.role === 'user')
    }
  },
  
  actions: {
    async fetchAllUsers() {
      this.loading = true
      this.error = null
      
      try {
        // VULNERABILITY: No role check before making admin API call
        const response = await usersAPI.getAllUsers()
        this.users = response.data
        return this.users
      } catch (error) {
        console.error('Error fetching users:', error)
        
        // Handle unauthorized access
        if (error.response && error.response.status === 403) {
          this.error = 'Access denied. Admin privileges required.'
        } else if (error.response && error.response.data) {
          this.error = error.response.data.error || 'Failed to load users'
          
          // VULNERABILITY: Exposing detailed error information
          if (error.response.data.details) {
            this.error += `. Details: ${error.response.data.details}`
          }
        } else {
          this.error = 'An error occurred loading users'
        }
        
        return []
      } finally {
        this.loading = false
      }
    },
    
    async deleteUser(userId) {
      this.loading = true
      this.error = null
      
      try {
        // VULNERABILITY: No confirmation before deletion
        // VULNERABILITY: No admin role check on client side
        await usersAPI.deleteUser(userId)
        
        // Update local state without refetching
        this.users = this.users.filter(user => user.id !== userId)
        return true
      } catch (error) {
        console.error(`Error deleting user ${userId}:`, error)
        
        if (error.response && error.response.data) {
          this.error = error.response.data.error || `Failed to delete user ${userId}`
        } else {
          this.error = 'An error occurred while deleting the user'
        }
        
        return false
      } finally {
        this.loading = false
      }
    },
    
    async updateUserProfile(userData) {
      this.loading = true
      this.error = null
      
      try {
        // VULNERABILITY: No validation before sending, allowing privilege escalation
        const response = await usersAPI.updateProfile(userData)
        
        // Update the user in the user list if it exists
        const index = this.users.findIndex(u => u.id === userData.id)
        if (index !== -1) {
          this.users[index] = { ...this.users[index], ...response.data }
        }
        
        return response.data
      } catch (error) {
        console.error('Error updating profile:', error)
        
        if (error.response && error.response.data) {
          this.error = error.response.data.error || 'Failed to update profile'
        } else {
          this.error = 'An error occurred updating profile'
        }
        
        return null
      } finally {
        this.loading = false
      }
    }
  }
})