<template>
  <header class="app-header">
    <div class="container header-container">
      <div class="logo">
        <router-link to="/">Vulnerable Demo App</router-link>
      </div>
      <nav>
        <ul>
          <li><router-link to="/">Home</router-link></li>
          <li><router-link to="/products">Products</router-link></li>
          
          <template v-if="user">
            <li><router-link to="/users/profile">Profile</router-link></li>
            
            <li v-if="user.role === 'admin'">
              <router-link to="/admin/dashboard">Admin</router-link>
            </li>
            
            <li><a href="#" @click.prevent="logout">Logout</a></li>
          </template>
          <template v-else>
            <li><router-link to="/login">Login</router-link></li>
            <li><router-link to="/register">Register</router-link></li>
          </template>
        </ul>
      </nav>
    </div>
    
    <!-- Notification area (secure implementation) -->
    <div id="notification-area" class="notification" v-if="notification" v-text="notification"></div>
  </header>
</template>

<script>
export default {
  name: 'AppHeader',
  data() {
    return {
      user: null,
      notification: ''
    }
  },
  methods: {
    logout() {
      // Implement logout logic here
      this.user = null
      console.log('User logged out')
      this.$router.push('/login')
    },
    showNotification(message) {
      this.notification = message
      setTimeout(() => {
        this.notification = ''
      }, 5000)
    }
  },
  created() {
    // In a real app, this would fetch the user from an API or Vuex/Pinia store
    // For now, we'll check localStorage as a simple example
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        this.user = JSON.parse(storedUser)
      } catch (e) {
        console.error('Failed to parse stored user')
      }
    }
  }
}
</script>

<style scoped>
.app-header {
  background-color: #333;
  color: white;
  padding: 1rem 0;
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  margin: 0;
  font-size: 1.5rem;
}

.logo a {
  color: white;
  text-decoration: none;
  font-weight: bold;
}

nav ul {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 1.5rem;
}

nav li a {
  color: white;
  text-decoration: none;
}

nav li a:hover,
nav li a.router-link-active {
  text-decoration: underline;
}

.notification {
  background-color: #f8d7da;
  color: #721c24;
  padding: 10px;
  text-align: center;
  display: none;
}

.notification:not(:empty) {
  display: block;
}
</style>