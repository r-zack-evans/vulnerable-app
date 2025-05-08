<template>
  <BaseLayout>
    <section class="welcome">
      <h1>{{ message }}</h1>
      <p class="subtitle">Simple, beautiful project management</p>
      
      <div v-if="!user" class="auth-buttons">
        <Button @click="$router.push('/login')" variant="primary" text="Login" />
        <Button @click="$router.push('/register')" variant="secondary" text="Register" />
      </div>
      
      <div v-if="user" class="dashboard-link">
        <Button @click="$router.push('/projects')" variant="primary" text="Go to Dashboard" />
      </div>
    </section>
    
    <section class="features">
      <div class="feature-grid">
        <div class="feature-card">
          <h3>Task Management</h3>
          <p>Create, assign, and track tasks with ease</p>
        </div>
        <div class="feature-card">
          <h3>Project Dashboard</h3>
          <p>Comprehensive view of all your projects</p>
        </div>
        <div class="feature-card">
          <h3>Team Collaboration</h3>
          <p>Seamless communication and task assignment</p>
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
  margin-bottom: 3rem;
  padding: 4rem 1rem;
  background-color: #f0f7ff; /* Light pastel blue background */
  border-radius: 1rem;
}

.welcome h1 {
  color: #5c6bc0; /* Soft indigo */
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.subtitle {
  font-size: 1.2rem;
  color: #7986cb; /* Lighter indigo */
  margin-bottom: 2rem;
}

.auth-buttons {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 2rem;
}

.dashboard-link {
  margin-top: 2rem;
}

.features {
  padding: 3rem 1rem;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
  max-width: 1100px;
  margin: 0 auto;
}

.feature-card {
  background-color: #fff;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-top: 4px solid #a5d6a7; /* Pastel green accent */
}

.feature-card:nth-child(2) {
  border-top-color: #ffcc80; /* Pastel orange accent */
}

.feature-card:nth-child(3) {
  border-top-color: #90caf9; /* Pastel blue accent */
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.feature-card h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #455a64;
  font-size: 1.35rem;
}

.feature-card p {
  margin: 0;
  color: #78909c;
  line-height: 1.5;
}
</style>