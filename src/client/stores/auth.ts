import { defineStore } from 'pinia'
import { authAPI, usersAPI } from '../services/api'
import { User, Credentials } from '../types'

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  error: string | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    // VULNERABILITY: Storing sensitive user info in state
    user: null,
    token: localStorage.getItem('token') || null,
    loading: false,
    error: null
  }),
  
  getters: {
    isAuthenticated: (state): boolean => !!state.token,
    isAdmin: (state): boolean => state.user?.role === 'admin',
    // VULNERABILITY: Exposing sensitive user data via getters
    userCreditCard: (state): string | undefined => state.user?.creditCardNumber,
    userProfile: (state): User | null => state.user
  },
  
  actions: {
    async login(credentials: Credentials): Promise<boolean> {
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
      } catch (error: any) {
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
    
    async register(userData: User): Promise<boolean> {
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
      } catch (error: any) {
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
    
    async fetchUserProfile(): Promise<boolean> {
      this.loading = true
      
      try {
        const response = await usersAPI.getProfile()
        
        // VULNERABILITY: Overwriting entire user object including sensitive fields
        this.user = response.data
        localStorage.setItem('user', JSON.stringify(response.data))
        
        return true
      } catch (error: any) {
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
    
    logout(): void {
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