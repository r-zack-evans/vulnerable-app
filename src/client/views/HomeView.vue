<template>
  <BaseLayout>
    <section class="welcome">
      <h1>{{ message }}</h1>
      <p>Manage your enterprise projects with our comprehensive task management solution.</p>
      <p>Track progress, assign resources, and meet your deadlines with confidence.</p>
      
      <div v-if="!user" class="auth-buttons">
        <Button @click="$router.push('/login')" variant="primary" text="Login" />
        <Button @click="$router.push('/register')" variant="secondary" text="Register" />
      </div>
      
      <div v-if="user" class="dashboard-link" style="margin-top: 20px;">
        <Button @click="$router.push('/projects')" variant="primary" text="Go to Dashboard" />
      </div>
    </section>
    
    <section class="features">
      <h2>Enterprise Features</h2>
      <div class="feature-grid">
        <div class="feature-card">
          <h3>Task Management</h3>
          <p>Create, assign, and track tasks across your organization with real-time updates.</p>
        </div>
        <div class="feature-card">
          <h3>Project Dashboard</h3>
          <p>Get a comprehensive view of all your projects with status tracking and priority management.</p>
        </div>
        <div class="feature-card">
          <h3>Team Collaboration</h3>
          <p>Assign team members to projects, manage permissions, and communicate effectively.</p>
        </div>
        <div class="feature-card">
          <h3>Advanced Reporting</h3>
          <p>Generate detailed reports on project progress, resource allocation, and deadline tracking.</p>
        </div>
      </div>
    </section>
  </BaseLayout>
</template>

<script>
import BaseLayout from '../components/BaseLayout.vue'
import Button from '../components/Button.vue'
import AlertMessage from '../components/AlertMessage.vue'
import { useProductStore } from '../stores/products'
import { useAuthStore } from '../stores/auth'

export default {
  name: 'HomeView',
  components: {
    BaseLayout,
    Button,
    AlertMessage
  },
  setup() {
    const productStore = useProductStore()
    const authStore = useAuthStore()
    return { productStore, authStore }
  },
  data() {
    return {
      message: 'Welcome to ProjectTrack Enterprise',
      error: null,
      notification: null
    }
  },
  computed: {
    user() {
      return this.authStore.user
    },
    products() {
      return this.productStore.products
    },
    featuredProducts() {
      return this.productStore.featuredProducts
    },
    loading() {
      return this.productStore.loading || this.authStore.loading
    }
  },
  created() {
    // Check for any message parameters
    const urlParams = new URLSearchParams(window.location.search)
    
    // VULNERABILITY: Reflected XSS potential by directly using URL parameters
    if (urlParams.has('message')) {
      this.message = urlParams.get('message')
    }
    
    // VULNERABILITY: Reflected XSS through notification parameter
    if (urlParams.has('notification')) {
      this.notification = urlParams.get('notification')
    }
    
    // Check if user is authenticated and load profile
    if (this.authStore.isAuthenticated) {
      this.authStore.fetchUserProfile()
    }
    
    // Load products
    this.fetchProducts()
  },
  methods: {
    goToDashboard() {
      // Redirect to the project dashboard
      this.$router.push('/projects')
    },
    async fetchProducts() {
      this.error = null
      
      try {
        // Use the product store to fetch products
        await this.productStore.fetchAllProducts()
        
        // Check if there was an error in the store
        if (this.productStore.error) {
          this.error = this.productStore.error
        }
      } catch (error) {
        console.error('Error fetching products:', error)
        this.error = 'Failed to load products. Please try again later.'
      }
    }
  }
}
</script>

<style scoped>
.welcome {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.feature-card {
  background-color: #f8f9fa;
  border-radius: 0.25rem;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.feature-card h3 {
  margin-top: 0;
  margin-bottom: 0.75rem;
  color: #333;
}

.feature-card p {
  margin: 0;
  color: #6c757d;
}

.features h2 {
  text-align: center;
  margin-bottom: 1.5rem;
}
</style>