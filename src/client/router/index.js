import HomeView from '../views/HomeView.vue'
import ProjectsView from '../views/ProjectsView.vue'

export default [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue')
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../views/RegisterView.vue')
  },
  {
    path: '/error',
    name: 'error',
    component: () => import('../views/ErrorView.vue')
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../views/DashboardView.vue'),
  },
  {
    path: '/projects',
    name: 'projects',
    component: ProjectsView,
  },
  {
    path: '/projects/:id',
    name: 'project-detail',
    component: () => import('../views/ProjectDetailView.vue')
  },
  {
    path: '/projects/:id/edit',
    name: 'project-edit',
    component: () => import('../views/ProjectDetailView.vue')
  },
  {
    path: '/tasks',
    name: 'tasks',
    component: () => import('../views/TasksView.vue')
  },
  {
    path: '/tasks/:id',
    name: 'task-detail',
    component: () => import('../views/TasksView.vue')
  },
  {
    path: '/users/profile',
    name: 'user-profile',
    component: () => import('../views/ProfileView.vue')
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('../views/AdminView.vue'),
    // VULNERABILITY: No client-side route guard for admin pages
    // In a secure app, we would add:
    // beforeEnter: (to, from, next) => {
    //   // Check if user is admin
    //   const user = JSON.parse(localStorage.getItem('user') || '{}')
    //   if (user.role === 'admin') next()
    //   else next('/login')
    // }
  },
  {
    // VULNERABILITY: Catch-all route that allows access to non-existent pages
    path: '/:pathMatch(.*)*',
    redirect: '/error'
  }
]