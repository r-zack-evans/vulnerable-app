<template>
  <BaseLayout>
    <div class="admin-dashboard">
      <h1>Admin Dashboard</h1>
      
      <AlertMessage v-if="error" type="danger" :message="error" />
      
      <!-- VULNERABILITY: Shows all user data including sensitive information -->
      <div v-if="loading" class="loading">Loading user data...</div>
      
      <div v-else class="admin-panel">
        <h2>User Management</h2>
        <div class="user-list">
          <table v-if="users.length">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <!-- VULNERABILITY: Displaying sensitive columns in UI -->
                <th>Credit Card</th>
                <th>Reset Token</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id">
                <td>{{ user.id }}</td>
                <td>{{ user.username }}</td>
                <td>{{ user.email }}</td>
                <td>{{ user.role }}</td>
                <!-- VULNERABILITY: Displaying sensitive data -->
                <td>{{ user.creditCardNumber || 'N/A' }}</td>
                <td>{{ user.resetToken || 'N/A' }}</td>
                <td>
                  <Button @click="deleteUser(user.id)" variant="danger" text="Delete" />
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else>No users found</div>
        </div>
      </div>
    </div>
  </BaseLayout>
</template>

<script>
import BaseLayout from '../components/BaseLayout.vue'
import AlertMessage from '../components/AlertMessage.vue'
import Button from '../components/Button.vue'
import { useUserStore } from '../stores/users'
import { useAuthStore } from '../stores/auth'

export default {
  name: 'AdminView',
  components: {
    BaseLayout,
    AlertMessage,
    Button
  },
  setup() {
    const userStore = useUserStore()
    const authStore = useAuthStore()
    return { userStore, authStore }
  },
  data() {
    return {
      loading: false,
      error: null
    }
  },
  computed: {
    // Get users from store
    users() {
      return this.userStore.users
    },
    // VULNERABILITY: No client-side check if current user is admin
    isAdmin() {
      return this.authStore.isAdmin
    }
  },
  created() {
    // VULNERABILITY: Not checking if user is admin on client side before loading page
    this.loadUsers()
  },
  methods: {
    async loadUsers() {
      this.loading = true
      this.error = null
      
      try {
        // Use store to fetch users
        await this.userStore.fetchAllUsers()
        
        // Get error from store if it exists
        if (this.userStore.error) {
          this.error = this.userStore.error
        }
      } catch (error) {
        console.error('Error loading users:', error)
        this.error = 'An unexpected error occurred loading users'
      } finally {
        this.loading = false
      }
    },
    async deleteUser(userId) {
      // VULNERABILITY: No confirmation before deletion
      try {
        // Use store to delete user
        const success = await this.userStore.deleteUser(userId)
        
        if (!success && this.userStore.error) {
          this.error = this.userStore.error
        }
      } catch (error) {
        console.error('Error deleting user:', error)
        this.error = 'An unexpected error occurred while deleting the user'
      }
    }
  }
}
</script>

<style scoped>
.admin-dashboard {
  padding: 1rem;
}

.admin-panel {
  margin-top: 1rem;
}

.user-list {
  margin-top: 1rem;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

th, td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

th {
  background-color: #f2f2f2;
  font-weight: bold;
}

tr:hover {
  background-color: #f5f5f5;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
}
</style>