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
/* Global styles with Tailwind classes */
/* Note: Most of these styles are replaced by Tailwind utility classes */

/* We'll define these component classes in a separate CSS file to allow Tailwind to process them properly */
</style>