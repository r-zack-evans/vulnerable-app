<template>
  <BaseLayout>
    <section class="auth-form">
      <h1>Login</h1>
      
      <AlertMessage v-if="message" type="info" :message="message" />
      
      <AlertMessage v-if="error" type="danger" :message="error" />
      
      <form @submit.prevent="login">
        <FormGroup label="Username" id="username">
          <input 
            type="text" 
            id="username" 
            v-model="username" 
            required
            autocomplete="username">
        </FormGroup>
        
        <FormGroup label="Password" id="password">
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            required
            autocomplete="current-password">
        </FormGroup>
        
        <div class="form-group">
          <Button type="submit" variant="primary" :loading="loading" text="Login" />
        </div>
      </form>
      
      <!-- VULNERABILITY: Exposing demo credentials directly in UI -->
      <div class="demo-credentials">
        <h4>Demo Credentials</h4>
        <div class="demo-buttons">
          <Button @click="fillCredentials('admin')" variant="outline" text="Admin Login" />
          <Button @click="fillCredentials('user')" variant="outline" text="User Login" />
        </div>
        <p class="demo-note">Note: For educational purposes only. These credentials allow access to a vulnerable system.</p>
      </div>
      
      <div class="auth-links">
        <router-link to="/auth/forgot-password">Forgot Password?</router-link>
        <router-link to="/register">Don't have an account? Register</router-link>
      </div>
    </section>
  </BaseLayout>
</template>

<script>
import BaseLayout from '../components/BaseLayout.vue'
import AlertMessage from '../components/AlertMessage.vue'
import FormGroup from '../components/FormGroup.vue'
import Button from '../components/Button.vue'
import { useAuthStore } from '../stores/auth'

export default {
  name: 'LoginView',
  components: {
    BaseLayout,
    AlertMessage,
    FormGroup,
    Button
  },
  data() {
    return {
      username: '',
      password: '',
      error: null,
      message: null,
      loading: false,
      // VULNERABILITY: Default credentials for demo/educational purposes
      defaultCredentials: {
        admin: { username: 'admin', password: 'admin123' },
        user: { username: 'user', password: 'password123' }
      }
    }
  },
  created() {
    // Check for URL parameters that might contain messages
    const urlParams = new URLSearchParams(window.location.search)
    
    // VULNERABILITY: Reflected XSS potential through direct use of URL parameter
    if (urlParams.has('message')) {
      this.message = urlParams.get('message')
    }
    
    // VULNERABILITY: Auto-filling credentials if ?demo=admin or ?demo=user is in URL
    if (urlParams.has('demo')) {
      const demoType = urlParams.get('demo')
      if (this.defaultCredentials[demoType]) {
        this.username = this.defaultCredentials[demoType].username
        this.password = this.defaultCredentials[demoType].password
      }
    }
  },
  setup() {
    const authStore = useAuthStore()
    return { authStore }
  },
  methods: {
    async login() {
      try {
        // Reset local component error/loading state
        this.error = null
        this.loading = true
        
        // Use the Pinia store for login
        const success = await this.authStore.login({
          username: this.username,
          password: this.password
        })
        
        // Handle login result
        if (success) {
          // VULNERABILITY: Not checking user role before redirecting
          // Redirect to home or admin dashboard based on role
          if (this.authStore.isAdmin) {
            this.$router.push('/admin')
          } else {
            this.$router.push('/')
          }
        } else {
          // Copy error from store to component
          this.error = this.authStore.error
        }
      } catch (error) {
        console.error('Login error:', error)
        this.error = 'An unexpected error occurred during login.'
      } finally {
        this.loading = false
      }
    },
    
    // VULNERABILITY: Function to auto-fill credentials (for educational purposes)
    fillCredentials(role) {
      if (this.defaultCredentials[role]) {
        this.username = this.defaultCredentials[role].username
        this.password = this.defaultCredentials[role].password
      }
    }
  }
}
</script>

<style scoped>
.login-form {
  max-width: 400px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-actions {
  margin-top: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-link {
  color: #007bff;
}

.alert-danger {
  padding: 0.75rem;
  margin-bottom: 1rem;
  background-color: #f8d7da;
  color: #721c24;
  border-radius: 4px;
}

/* Demo credentials section */
.demo-credentials {
  margin-top: 2rem;
  padding: 1rem;
  border: 1px dashed #ffcc00;
  border-radius: 4px;
  background-color: #fffbeb;
}

.demo-credentials h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #856404;
  text-align: center;
}

.demo-buttons {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.demo-note {
  font-size: 0.8rem;
  color: #856404;
  margin-bottom: 0;
  text-align: center;
}
</style>