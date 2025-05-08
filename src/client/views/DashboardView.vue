<template>
  <BaseLayout>
    <div class="dashboard">
      <h1>Project Dashboard</h1>
      
      <div class="stats-cards">
        <div class="stats-card">
          <div class="card-icon">
            <span class="material-icons">assignment</span>
          </div>
          <div class="card-content">
            <h3>{{ projectStats.total }}</h3>
            <p>Total Projects</p>
          </div>
        </div>
        
        <div class="stats-card">
          <div class="card-icon">
            <span class="material-icons">pending_actions</span>
          </div>
          <div class="card-content">
            <h3>{{ projectStats.active }}</h3>
            <p>Active Projects</p>
          </div>
        </div>
        
        <div class="stats-card">
          <div class="card-icon">
            <span class="material-icons">task_alt</span>
          </div>
          <div class="card-content">
            <h3>{{ projectStats.completed }}</h3>
            <p>Completed Projects</p>
          </div>
        </div>
        
        <div class="stats-card">
          <div class="card-icon">
            <span class="material-icons">task</span>
          </div>
          <div class="card-content">
            <h3>{{ taskStats.total }}</h3>
            <p>Total Tasks</p>
          </div>
        </div>
      </div>
      
      <div class="dashboard-content">
        <div class="recent-projects">
          <div class="section-header">
            <h2>Recent Projects</h2>
            <Button @click="$router.push('/projects')" variant="outline" text="View All" />
          </div>
          
          <div v-if="loading.projects" class="loading">Loading projects...</div>
          <div v-else-if="recentProjects.length === 0" class="no-data">No projects found</div>
          <div v-else class="projects-list">
            <div v-for="project in recentProjects" :key="project.id" class="project-item">
              <div class="project-info">
                <h3>
                  <router-link :to="`/projects/${project.id}`">{{ project.name }}</router-link>
                </h3>
                <div class="project-meta">
                  <span :class="['status', project.status.toLowerCase().replace(' ', '-')]">{{ project.status }}</span>
                  <span v-if="project.endDate" class="due-date">Due: {{ formatDate(project.endDate) }}</span>
                </div>
              </div>
              <div class="project-progress">
                <div class="progress-circle" :data-progress="project.completionPercentage || 0">
                  {{ project.completionPercentage || 0 }}%
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="tasks-summary">
          <div class="section-header">
            <h2>My Tasks</h2>
            <Button @click="$router.push('/tasks')" variant="outline" text="View All" />
          </div>
          
          <div v-if="loading.tasks" class="loading">Loading tasks...</div>
          <div v-else-if="myTasks.length === 0" class="no-data">No tasks assigned to you</div>
          <div v-else class="tasks-sections">
            <div class="task-section">
              <h3>Due Soon</h3>
              <ul class="task-list">
                <li v-for="task in upcomingTasks" :key="task.id" class="task-item">
                  <span :class="['status-dot', 'status-' + task.status.toLowerCase().replace(' ', '-')]"></span>
                  <div class="task-details">
                    <router-link :to="`/tasks/${task.id}`">{{ task.title }}</router-link>
                    <span class="task-meta">{{ getProjectName(task.projectId) }} • Due: {{ formatDate(task.dueDate) }}</span>
                  </div>
                  <span :class="['priority', 'priority-' + (task.priority || 'medium').toLowerCase()]">{{ task.priority }}</span>
                </li>
              </ul>
            </div>
            
            <div class="task-section">
              <h3>In Progress</h3>
              <ul class="task-list">
                <li v-for="task in inProgressTasks" :key="task.id" class="task-item">
                  <span class="status-dot status-in-progress"></span>
                  <div class="task-details">
                    <router-link :to="`/tasks/${task.id}`">{{ task.title }}</router-link>
                    <span class="task-meta">{{ getProjectName(task.projectId) }}</span>
                  </div>
                  <span :class="['priority', 'priority-' + (task.priority || 'medium').toLowerCase()]">{{ task.priority }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </BaseLayout>
</template>

<script>
import BaseLayout from '../components/BaseLayout.vue'
import Button from '../components/Button.vue'
import AlertMessage from '../components/AlertMessage.vue'
import axios from 'axios'

export default {
  name: 'DashboardView',
  components: {
    BaseLayout,
    Button,
    AlertMessage
  },
  data() {
    return {
      loading: {
        projects: true,
        tasks: true
      },
      error: null,
      user: null,
      projects: [],
      tasks: [],
      projectStats: {
        total: 0,
        active: 0,
        completed: 0
      },
      taskStats: {
        total: 0,
        completed: 0,
        overdue: 0
      }
    }
  },
  computed: {
    recentProjects() {
      return this.projects.slice(0, 5)
    },
    myTasks() {
      if (!this.user) return []
      return this.tasks.filter(task => task.assignedTo === this.user.id)
    },
    upcomingTasks() {
      const now = new Date()
      const oneWeekFromNow = new Date()
      oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7)
      
      return this.myTasks.filter(task => {
        if (!task.dueDate) return false
        const dueDate = new Date(task.dueDate)
        return dueDate >= now && dueDate <= oneWeekFromNow && task.status !== 'Complete'
      }).slice(0, 5)
    },
    inProgressTasks() {
      return this.myTasks.filter(task => task.status === 'In Progress').slice(0, 5)
    }
  },
  methods: {
    async fetchUser() {
      try {
        const response = await axios.get('/users/profile')
        this.user = response.data.user
      } catch (error) {
        console.error('Error fetching user:', error)
      }
    },
    async fetchProjects() {
      this.loading.projects = true
      
      try {
        const response = await axios.get('/projects')
        this.projects = response.data
        
        // Calculate project stats
        this.projectStats.total = this.projects.length
        this.projectStats.active = this.projects.filter(p => p.status === 'In Progress').length
        this.projectStats.completed = this.projects.filter(p => p.status === 'Complete').length
      } catch (error) {
        console.error('Error fetching projects:', error)
      } finally {
        this.loading.projects = false
      }
    },
    async fetchTasks() {
      this.loading.tasks = true
      
      try {
        const response = await axios.get('/tasks')
        this.tasks = response.data
        
        // Calculate task stats
        this.taskStats.total = this.tasks.length
        this.taskStats.completed = this.tasks.filter(t => t.isCompleted).length
        
        // Calculate overdue tasks
        const today = new Date()
        this.taskStats.overdue = this.tasks.filter(t => {
          if (!t.dueDate || t.isCompleted) return false
          return new Date(t.dueDate) < today
        }).length
      } catch (error) {
        console.error('Error fetching tasks:', error)
      } finally {
        this.loading.tasks = false
      }
    },
    getProjectName(projectId) {
      const project = this.projects.find(p => p.id === projectId)
      return project ? project.name : 'Unknown Project'
    },
    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString()
    }
  },
  created() {
    this.fetchUser()
    this.fetchProjects()
    this.fetchTasks()
  }
}
</script>

<style scoped>
.dashboard {
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stats-card {
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 8px;
  background-color: #ebf4ff;
  color: #3182ce;
  margin-right: 1rem;
}

.card-icon .material-icons {
  font-size: 1.5rem;
}

.card-content h3 {
  font-size: 1.5rem;
  margin: 0 0 0.25rem 0;
}

.card-content p {
  margin: 0;
  color: #718096;
}

.dashboard-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.recent-projects, .tasks-summary {
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  margin: 0;
}

.projects-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.project-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-radius: 8px;
  background-color: #f7fafc;
  border-left: 4px solid #4299e1;
}

.project-info h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
}

.project-info h3 a {
  color: #2d3748;
  text-decoration: none;
}

.project-info h3 a:hover {
  color: #4299e1;
  text-decoration: underline;
}

.project-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
}

.status {
  font-weight: 600;
  text-transform: uppercase;
}

.status-not-started {
  color: #718096;
}

.status-in-progress {
  color: #4299e1;
}

.status-on-hold {
  color: #ed8936;
}

.status-complete {
  color: #48bb78;
}

.due-date {
  color: #718096;
}

.progress-circle {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background-color: #edf2f7;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  position: relative;
}

.progress-circle::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: conic-gradient(
    #4299e1 calc(var(--progress) * 1%),
    transparent 0
  );
  --progress: attr(data-progress);
  mask: radial-gradient(white 55%, transparent 0);
  -webkit-mask: radial-gradient(white 55%, transparent 0);
}

.task-section h3 {
  font-size: 1rem;
  margin: 0 0 1rem 0;
  color: #4a5568;
}

.task-list {
  padding: 0;
  margin: 0;
  list-style: none;
}

.task-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #edf2f7;
}

.task-item:last-child {
  border-bottom: none;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 0.75rem;
}

.status-not-started {
  background-color: #cbd5e0;
}

.status-in-progress {
  background-color: #4299e1;
}

.status-on-hold {
  background-color: #ed8936;
}

.status-complete {
  background-color: #48bb78;
}

.task-details {
  flex: 1;
}

.task-details a {
  display: block;
  color: #2d3748;
  text-decoration: none;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.task-details a:hover {
  color: #4299e1;
  text-decoration: underline;
}

.task-meta {
  font-size: 0.75rem;
  color: #718096;
}

.priority {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  white-space: nowrap;
}

.priority-low {
  color: #4299e1;
}

.priority-medium {
  color: #4a5568;
}

.priority-high {
  color: #ed8936;
}

.priority-critical {
  color: #e53e3e;
}

.loading, .no-data {
  padding: 2rem 0;
  text-align: center;
  color: #718096;
}

.tasks-sections {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

@media (max-width: 1024px) {
  .dashboard-content,
  .tasks-sections {
    grid-template-columns: 1fr;
  }
}
</style>