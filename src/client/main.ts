import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia } from 'pinia'
import App from './App.vue'
import routes from './router'
import './styles.css'

// Create router instance
const router = createRouter({
  history: createWebHistory(),
  routes
})

// Create Pinia store
const pinia = createPinia()

// VULNERABILITY: No navigation guards for protected routes
// In a secure app, we would add authentication checks here

// Create and mount Vue app
const app = createApp(App)
app.use(router)
app.use(pinia)
app.mount('#app')