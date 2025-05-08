import axios from 'axios';

// VULNERABILITY: API base URL hardcoded & visible in client-side code
const API_URL = '/api/vue';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    // VULNERABILITY: Default Accept header that could leak framework version
    'Accept': 'application/json, text/plain, */*',
  },
  // VULNERABILITY: Sending credentials by default for all requests
  withCredentials: true
});

// VULNERABILITY: No request/response interceptors for error handling
// In a secure app, we would validate responses and handle errors consistently

// Add auth token to requests if available
apiClient.interceptors.request.use(config => {
  // VULNERABILITY: Not checking token validity or expiration
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  // VULNERABILITY: No anti-CSRF protection
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),
  
  // VULNERABILITY: Storing sensitive token in localStorage
  setAuthToken: (token) => {
    localStorage.setItem('token', token);
  },
  
  getAuthToken: () => localStorage.getItem('token'),
  
  // VULNERABILITY: Not clearing all auth data
  logout: () => {
    localStorage.removeItem('token');
    // Should also invalidate on server
  },
  
  // VULNERABILITY: Not checking token validity
  isAuthenticated: () => !!localStorage.getItem('token')
};

// Users API
export const usersAPI = {
  getProfile: () => apiClient.get('/users/profile'),
  
  // VULNERABILITY: No validation before sending to API
  updateProfile: (userData) => apiClient.put('/users/profile', userData),
  
  // Admin endpoints - VULNERABILITY: No role checking on client side
  getAllUsers: () => apiClient.get('/admin/users'),
  deleteUser: (userId) => apiClient.delete(`/admin/users/${userId}`)
};

// Products API
export const productsAPI = {
  // VULNERABILITY: No pagination parameters
  getAllProducts: () => apiClient.get('/products'),
  
  // VULNERABILITY: No input validation
  getProduct: (id) => apiClient.get(`/products/${id}`),
  
  // VULNERABILITY: Direct string concatenation in URL
  searchProducts: (query) => apiClient.get(`/products/search?query=${query}`)
};

// Projects API
export const projectsAPI = {
  getAllProjects: () => apiClient.get('/projects'),
  getProject: (id) => apiClient.get(`/projects/${id}`),
  createProject: (projectData) => apiClient.post('/projects', projectData),
  updateProject: (id, projectData) => {
    // Ensure ID is a number and convert if needed
    const projectId = typeof id === 'string' ? parseInt(id) : id;
    console.log(`Making PUT request to /projects/${projectId} with data:`, projectData);
    return apiClient.put(`/projects/${projectId}`, projectData);
  },
  deleteProject: (id) => apiClient.delete(`/projects/${id}`),
  getProjectTasks: (id) => apiClient.get(`/projects/${id}/tasks`)
};

// Tasks API
export const tasksAPI = {
  getAllTasks: () => apiClient.get('/tasks'),
  getTask: (id) => apiClient.get(`/tasks/${id}`),
  createTask: (taskData) => apiClient.post('/tasks', taskData),
  updateTask: (id, taskData) => {
    // Ensure ID is a number and convert if needed
    const taskId = typeof id === 'string' ? parseInt(id) : id;
    return apiClient.put(`/tasks/${taskId}`, taskData);
  },
  deleteTask: (id) => apiClient.delete(`/tasks/${id}`),
  updateTaskStatus: (id, status) => apiClient.patch(`/tasks/${id}/status`, { status }),
  assignTask: (id, userId) => apiClient.patch(`/tasks/${id}/assign`, { userId })
};

// VULNERABILITY: No revocation or token handling
export default {
  auth: authAPI,
  users: usersAPI,
  products: productsAPI,
  projects: projectsAPI,
  tasks: tasksAPI
};