<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
import { useAuthStore } from './stores/auth'
import { useProductStore } from './stores/products'
import { onMounted } from 'vue'

export default {
  name: 'App',
  setup() {
    const authStore = useAuthStore()
    const productStore = useProductStore()
    
    onMounted(() => {
      // Check authentication on app load
      if (authStore.isAuthenticated) {
        authStore.fetchUserProfile()
      }
      
      // Preload common data
      productStore.fetchAllProducts()
    })
    
    return {}
  }
}
</script>

<style>
/* Global styles - keep all of these for universal styling */
body {
  margin: 0;
  font-family: Arial, sans-serif;
  line-height: 1.6;
}

/* Basic container styles */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 15px;
}

/* Common form styles */
.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

input, textarea, select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

button, .btn {
  cursor: pointer;
  display: inline-block;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  border-radius: 4px;
  text-decoration: none;
  text-align: center;
}

/* Common alert styles */
.alert {
  padding: 0.75rem 1.25rem;
  margin-bottom: 1rem;
  border-radius: 0.25rem;
}

.alert-danger {
  background-color: #f8d7da;
  color: #721c24;
}

.alert-info {
  background-color: #d1ecf1;
  color: #0c5460;
}

/* Common section styles */
section {
  margin: 2rem 0;
}

/* Loading indicators */
.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
}
</style>