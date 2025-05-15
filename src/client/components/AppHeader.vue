<template>
  <header class="bg-white text-gray-800 py-3 border-b border-gray-200 shadow-sm">
    <div class="container flex justify-between items-center">
      <div class="text-xl font-bold">
        <router-link to="/" class="text-gray-800 no-underline font-bold tracking-wide">PT</router-link>
      </div>
      <nav class="hidden md:block">
        <ul class="flex space-x-6 list-none m-0 p-0">
          <li><router-link to="/" class="text-gray-800 no-underline text-sm font-medium hover:text-blue-600">Home</router-link></li>
          <li><router-link to="/projects" class="text-gray-800 no-underline text-sm font-medium hover:text-blue-600">Projects</router-link></li>
          <li><router-link to="/tasks" class="text-gray-800 no-underline text-sm font-medium hover:text-blue-600">Tasks</router-link></li>
          
          <template v-if="user">
            <li class="relative">
              <a href="#" @click.prevent="toggleDropdown" class="text-gray-800 no-underline text-sm font-medium hover:text-blue-600">Account</a>
              <div v-show="showDropdown" class="absolute top-full right-0 min-w-40 bg-white shadow-md rounded py-2 z-10 mt-2">
                <router-link to="/users/profile" class="block px-4 py-2 text-gray-800 hover:bg-gray-100">Profile</router-link>
                <a v-if="user.role === 'admin'" href="/admin/dashboard" class="block px-4 py-2 text-gray-800 hover:bg-gray-100">Admin</a>
                <a href="#" @click.prevent="logout" class="block px-4 py-2 text-gray-800 hover:bg-gray-100">Logout</a>
              </div>
            </li>
          </template>
          <template v-else>
            <li><router-link to="/login" class="text-gray-800 no-underline text-sm font-medium hover:text-blue-600">Login</router-link></li>
          </template>
        </ul>
      </nav>
      <button class="md:hidden bg-transparent border-0 cursor-pointer p-2" @click="toggleMobileMenu">
        <span class="block w-6 h-0.5 bg-gray-800 mb-1.5 transition-transform"></span>
        <span class="block w-6 h-0.5 bg-gray-800 mb-1.5 transition-transform"></span>
        <span class="block w-6 h-0.5 bg-gray-800 transition-transform"></span>
      </button>
      <nav v-show="showMobileMenu" class="md:hidden fixed top-15 left-0 right-0 bg-white shadow-md z-50">
        <ul class="flex flex-col p-4 space-y-4">
          <li><router-link to="/" @click="showMobileMenu = false" class="block py-2 text-gray-800">Home</router-link></li>
          <li><router-link to="/projects" @click="showMobileMenu = false" class="block py-2 text-gray-800">Projects</router-link></li>
          <li><router-link to="/tasks" @click="showMobileMenu = false" class="block py-2 text-gray-800">Tasks</router-link></li>
          
          <template v-if="user">
            <li><router-link to="/users/profile" @click="showMobileMenu = false" class="block py-2 text-gray-800">Profile</router-link></li>
            <li v-if="user.role === 'admin'">
              <router-link to="/admin/dashboard" @click="showMobileMenu = false" class="block py-2 text-gray-800">Admin</router-link>
            </li>
            <li><a href="#" @click.prevent="logout" class="block py-2 text-gray-800">Logout</a></li>
          </template>
          <template v-else>
            <li><router-link to="/login" @click="showMobileMenu = false" class="block py-2 text-gray-800">Login</router-link></li>
            <li><router-link to="/register" @click="showMobileMenu = false" class="block py-2 text-gray-800">Register</router-link></li>
          </template>
        </ul>
      </nav>
    </div>
    
    <!-- Notification area (secure implementation) -->
    <div id="notification-area" v-if="notification" v-text="notification" class="bg-red-100 text-red-700 p-2.5 text-center"></div>
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
      localStorage.removeItem('user')
      localStorage.removeItem('token')
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
    },
    checkUserStatus() {
      // Check for user in localStorage
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser)
          
          // Only update if different to avoid unnecessary re-renders
          if (!this.user || this.user.id !== parsedUser.id) {
            console.log('Updating user from localStorage:', parsedUser)
            this.user = parsedUser
          }
        } catch (e) {
          console.error('Failed to parse stored user during status check:', e)
        }
      } else if (this.user) {
        // User was logged in but now storage is empty
        this.user = null
      }
    }
  },
  created() {
    // In a real app, this would fetch the user from an API or Vuex/Pinia store
    // For now, we'll check localStorage as a simple example
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        this.user = JSON.parse(storedUser)
        console.log('User loaded from localStorage:', this.user)
      } catch (e) {
        console.error('Failed to parse stored user')
      }
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.dropdown') && !e.target.closest('a[href="#"]')) {
        this.showDropdown = false
      }
    })
    
    // Add event listener for storage changes to detect login/logout
    window.addEventListener('storage', this.checkUserStatus)
    
    // Also check user status every few seconds
    setInterval(this.checkUserStatus, 3000)
    
    // Initial check
    this.checkUserStatus()
  }
}
</script>

<style scoped>
/* With Tailwind, most styles are now applied directly in the template with utility classes */
/* We only need to keep a few custom styles that aren't easily done with utility classes */

/* Custom style for active router links */
.router-link-active {
  @apply text-blue-600;
}

/* Animation for mobile menu toggle */
.menu-toggle[aria-expanded="true"] span:first-child {
  @apply transform rotate-45 translate-y-2;
}

.menu-toggle[aria-expanded="true"] span:nth-child(2) {
  @apply opacity-0;
}

.menu-toggle[aria-expanded="true"] span:last-child {
  @apply transform -rotate-45 -translate-y-2;
}

/* Custom notification styles if needed beyond what Tailwind provides */
.notification:not(:empty) {
  @apply block;
}
</style>