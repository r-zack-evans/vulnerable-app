<template>
  <BaseLayout>
    <section class="welcome">
      <h1>{{ message }}</h1>
      <p>This application contains intentional security vulnerabilities for educational purposes.</p>
      <p>Try to find and exploit the vulnerabilities!</p>
      
      <div v-if="!user" class="auth-buttons">
        <Button @click="$router.push('/login')" variant="primary" text="Login" />
        <Button @click="$router.push('/register')" variant="secondary" text="Register" />
      </div>
      
      <div class="ejs-app-link" style="margin-top: 20px;">
        <Button @click="goToEjsVersion" variant="outline" text="Try the EJS version" />
      </div>
    </section>
    
    <section class="features">
      <h2>Features to Explore</h2>
      <div class="feature-grid">
        <div class="feature-card">
          <h3>User Management</h3>
          <p>Create accounts, update profiles, and explore user-related vulnerabilities.</p>
        </div>
        <div class="feature-card">
          <h3>Product Catalog</h3>
          <p>Browse products, add reviews, and search for items with potential injection flaws.</p>
        </div>
        <div class="feature-card">
          <h3>Admin Panel</h3>
          <p>Manage users and products, access sensitive functions with potential security issues.</p>
        </div>
        <div class="feature-card">
          <h3>API Endpoints</h3>
          <p>Interact with REST API endpoints that may contain various vulnerabilities.</p>
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
      message: 'Welcome to Vulnerable Demo App',
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
    goToEjsVersion() {
      // Redirect to the EJS version (root path)
      window.location.href = '/'
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