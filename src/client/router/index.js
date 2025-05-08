import HomeView from '../views/HomeView.vue'

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