import { defineStore } from 'pinia'
import { authAPI, usersAPI } from '../services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    // VULNERABILITY: Storing sensitive user info in state
    user: null,
    token: localStorage.getItem('token') || null,
    loading: false,
    error: null
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user && state.user.role === 'admin',
    // VULNERABILITY: Exposing sensitive user data via getters
    userCreditCard: (state) => state.user?.creditCardNumber,
    userProfile: (state) => state.user
  },
  
  actions: {
    async login(credentials) {
      this.loading = true
      this.error = null
      
      try {
        const response = await authAPI.login(credentials)
        const data = response.data
        
        // VULNERABILITY: Storing token insecurely
        this.token = data.token
        authAPI.setAuthToken(data.token)
        
        // VULNERABILITY: Storing full user object with sensitive data
        this.user = data
        localStorage.setItem('user', JSON.stringify(data))
        
        return true
      } catch (error) {
        console.error('Login error:', error)
        
        if (error.response && error.response.data) {
          this.error = error.response.data.error || 'Invalid username or password'
        } else {
          this.error = 'An error occurred during login'
        }
        
        return false
      } finally {
        this.loading = false
      }
    },
    
    async register(userData) {
      this.loading = true
      this.error = null
      
      try {
        const response = await authAPI.register(userData)
        const data = response.data
        
        // VULNERABILITY: Auto-login after registration without verification
        this.token = data.token
        authAPI.setAuthToken(data.token)
        
        // Partial user data available after registration
        this.user = data
        localStorage.setItem('user', JSON.stringify(data))
        
        return true
      } catch (error) {
        console.error('Registration error:', error)
        
        if (error.response && error.response.data) {
          this.error = error.response.data.error || 'Registration failed'
        } else {
          this.error = 'An error occurred during registration'
        }
        
        return false
      } finally {
        this.loading = false
      }
    },
    
    async fetchUserProfile() {
      this.loading = true
      
      try {
        const response = await usersAPI.getProfile()
        
        // VULNERABILITY: Overwriting entire user object including sensitive fields
        this.user = response.data
        localStorage.setItem('user', JSON.stringify(response.data))
        
        return true
      } catch (error) {
        console.error('Error fetching profile:', error)
        
        // If token is invalid, logout
        if (error.response && error.response.status === 401) {
          this.logout()
        }
        
        return false
      } finally {
        this.loading = false
      }
    },
    
    logout() {
      // VULNERABILITY: Not invalidating token on server
      this.user = null
      this.token = null
      
      // Clear local storage
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      
      // Clear from API service
      authAPI.logout()
    }
  }
})