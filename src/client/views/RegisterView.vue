<template>
  <BaseLayout>
    <section class="auth-form">
      <h1>Create Account</h1>
      
      <AlertMessage v-if="error" type="danger" :message="error" />
      
      <form @submit.prevent="register">
        <FormGroup label="Username" id="username">
          <input 
            type="text" 
            id="username" 
            v-model="username" 
            required
            autocomplete="username">
        </FormGroup>
        
        <FormGroup label="Email" id="email">
          <input 
            type="email" 
            id="email" 
            v-model="email" 
            required
            autocomplete="email">
        </FormGroup>
        
        <FormGroup label="Password" id="password">
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            required
            autocomplete="new-password">
        </FormGroup>
        
        <FormGroup label="Confirm Password" id="confirmPassword">
          <input 
            type="password" 
            id="confirmPassword" 
            v-model="confirmPassword" 
            required
            autocomplete="new-password">
        </FormGroup>
        
        <div class="form-group">
          <Button type="submit" variant="primary" :loading="loading" text="Register" />
        </div>
      </form>
      
      <div class="auth-links">
        <router-link to="/login">Already have an account? Login</router-link>
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
  name: 'RegisterView',
  components: {
    BaseLayout,
    AlertMessage,
    FormGroup,
    Button
  },
  setup() {
    const authStore = useAuthStore()
    return { authStore }
  },
  data() {
    return {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      error: null,
      loading: false
    }
  },
  methods: {
    async register() {
      try {
        // Reset error and set loading
        this.error = null
        this.loading = true
        
        // Validate passwords match
        if (this.password !== this.confirmPassword) {
          this.error = 'Passwords do not match'
          this.loading = false
          return
        }
        
        // Use auth store to register
        const success = await this.authStore.register({
          username: this.username,
          email: this.email,
          password: this.password
        })
        
        if (success) {
          // Redirect to home or login page
          this.$router.push('/login?message=Registration successful. Please log in.')
        } else {
          // Get error from store
          this.error = this.authStore.error
        }
      } catch (error) {
        console.error('Registration error:', error)
        this.error = 'An error occurred during registration. Please try again.'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.register-form {
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
</style>