<template>
  <header class="app-header">
    <div class="container header-container">
      <div class="logo">
        <router-link to="/">PT</router-link>
      </div>
      <nav class="desktop-nav">
        <ul>
          <li><router-link to="/">Home</router-link></li>
          <li><router-link to="/projects">Projects</router-link></li>
          <li><router-link to="/tasks">Tasks</router-link></li>
          
          <template v-if="user">
            <li class="dropdown">
              <a href="#" @click.prevent="toggleDropdown">Account</a>
              <div class="dropdown-menu" v-show="showDropdown">
                <router-link to="/users/profile">Profile</router-link>
                <a v-if="user.role === 'admin'" href="/admin/dashboard">Admin</a>
                <a href="#" @click.prevent="logout">Logout</a>
              </div>
            </li>
          </template>
          <template v-else>
            <li><router-link to="/login">Login</router-link></li>
          </template>
        </ul>
      </nav>
      <button class="menu-toggle" @click="toggleMobileMenu">
        <span></span>
        <span></span>
        <span></span>
      </button>
      <nav class="mobile-nav" v-show="showMobileMenu">
        <ul>
          <li><router-link to="/" @click="showMobileMenu = false">Home</router-link></li>
          <li><router-link to="/projects" @click="showMobileMenu = false">Projects</router-link></li>
          <li><router-link to="/tasks" @click="showMobileMenu = false">Tasks</router-link></li>
          
          <template v-if="user">
            <li><router-link to="/users/profile" @click="showMobileMenu = false">Profile</router-link></li>
            <li v-if="user.role === 'admin'">
              <router-link to="/admin/dashboard" @click="showMobileMenu = false">Admin</router-link>
            </li>
            <li><a href="#" @click.prevent="logout">Logout</a></li>
          </template>
          <template v-else>
            <li><router-link to="/login" @click="showMobileMenu = false">Login</router-link></li>
            <li><router-link to="/register" @click="showMobileMenu = false">Register</router-link></li>
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
      notification: '',
      showDropdown: false,
      showMobileMenu: false
    }
  },
  methods: {
    logout() {
      // Implement logout logic here
      this.user = null
      console.log('User logged out')
      this.$router.push('/login')
      this.showMobileMenu = false
      this.showDropdown = false
    },
    showNotification(message) {
      this.notification = message
      setTimeout(() => {
        this.notification = ''
      }, 5000)
    },
    toggleDropdown() {
      this.showDropdown = !this.showDropdown
    },
    toggleMobileMenu() {
      this.showMobileMenu = !this.showMobileMenu
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
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.dropdown')) {
        this.showDropdown = false
      }
    })
  }
}
</script>

<style scoped>
.app-header {
  background-color: white;
  color: #333;
  padding: 0.75rem 0;
  border-bottom: 1px solid #eaeaea;
  box-shadow: 0 2px 4px rgba(0,0,0,0.04);
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
  font-size: 1.25rem;
}

.logo a {
  color: #333;
  text-decoration: none;
  font-weight: bold;
  letter-spacing: 1px;
}

.desktop-nav ul {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 1.5rem;
}

.desktop-nav li a {
  color: #333;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
}

.desktop-nav li a:hover,
.desktop-nav li a.router-link-active {
  color: #007bff;
}

/* Dropdown styles */
.dropdown {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  min-width: 160px;
  background-color: white;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  border-radius: 4px;
  padding: 0.5rem 0;
  z-index: 10;
  margin-top: 0.5rem;
}

.dropdown-menu a {
  display: block;
  padding: 0.5rem 1rem;
  text-decoration: none;
  color: #333;
}

.dropdown-menu a:hover {
  background-color: #f8f9fa;
}

/* Mobile menu toggle */
.menu-toggle {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
}

.menu-toggle span {
  display: block;
  width: 25px;
  height: 2px;
  background-color: #333;
  margin: 5px 0;
  transition: transform 0.3s;
}

/* Mobile navigation */
.mobile-nav {
  display: none;
}

/* Notification styling */
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

/* Responsive styles */
@media (max-width: 768px) {
  .desktop-nav {
    display: none;
  }
  
  .menu-toggle {
    display: block;
  }
  
  .mobile-nav {
    display: block;
    position: fixed;
    top: 60px;
    left: 0;
    right: 0;
    background-color: white;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    z-index: 100;
  }
  
  .mobile-nav ul {
    flex-direction: column;
    padding: 1rem;
    gap: 1rem;
  }
  
  .mobile-nav li a {
    display: block;
    padding: 0.5rem 0;
  }
}
</style>