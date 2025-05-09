import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { User, Credentials, Product, Project, Task } from '../types';

// API base URLs for different types of endpoints
const VUE_API_URL = '/api/vue';
const DIRECT_API_URL = '/api';

// Create separate API clients for different types of endpoints
const vueApiClient: AxiosInstance = axios.create({
  baseURL: VUE_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/plain, */*',
  },
  withCredentials: true
});

const directApiClient: AxiosInstance = axios.create({
  baseURL: DIRECT_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/plain, */*',
  },
  withCredentials: true
});

// Create axios instance with default config - backward compatibility
const apiClient: AxiosInstance = vueApiClient;

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
  login: (credentials: Credentials): Promise<AxiosResponse<User>> => apiClient.post('/auth/login', credentials),
  register: (userData: User): Promise<AxiosResponse<User>> => apiClient.post('/auth/register', userData),
  
  // VULNERABILITY: Storing sensitive token in localStorage
  setAuthToken: (token: string): void => {
    localStorage.setItem('token', token);
  },
  
  getAuthToken: (): string | null => localStorage.getItem('token'),
  
  // VULNERABILITY: Not clearing all auth data
  logout: (): void => {
    localStorage.removeItem('token');
    // Should also invalidate on server
  },
  
  // VULNERABILITY: Not checking token validity
  isAuthenticated: (): boolean => !!localStorage.getItem('token')
};

// Users API
export const usersAPI = {
  getProfile: (): Promise<AxiosResponse<User>> => apiClient.get('/users/profile'),
  
  // VULNERABILITY: No validation before sending to API
  updateProfile: (userData: User): Promise<AxiosResponse<User>> => apiClient.put('/users/profile', userData),
  
  // Get user by ID - used for looking up project owners and team members
  getUserById: (userId: number): Promise<AxiosResponse<{profile: User}>> => {
    // The API returns a different format than what our component expects
    // This adapter ensures we get the right format
    return directApiClient.get(`/users/${userId}`).then(response => {
      if (response.data && !response.data.profile) {
        // Convert direct user object to expected format with 'profile' key
        // Create a proper AxiosResponse object to maintain type safety
        return {
          ...response,
          data: { profile: response.data }
        };
      }
      return response;
    });
  },
  
  // Get all users using the non-admin endpoint that doesn't require special permissions
  getAllUsers: (): Promise<AxiosResponse<User[]>> => directApiClient.get('/users'),
  
  // Get users for project assignment - explicitly use the public endpoint
  getUsersForProjectAssignment: (): Promise<AxiosResponse<User[]>> => directApiClient.get('/users'),
  
  // Admin endpoints - VULNERABILITY: No role checking on client side  
  deleteUser: (userId: number): Promise<AxiosResponse<any>> => apiClient.delete(`/admin/users/${userId}`)
};

// Products API
export const productsAPI = {
  // VULNERABILITY: No pagination parameters
  getAllProducts: (): Promise<AxiosResponse<Product[]>> => apiClient.get('/products'),
  
  // VULNERABILITY: No input validation
  getProduct: (id: number): Promise<AxiosResponse<Product>> => apiClient.get(`/products/${id}`),
  
  // VULNERABILITY: Direct string concatenation in URL
  searchProducts: (query: string): Promise<AxiosResponse<Product[]>> => apiClient.get(`/products/search?query=${query}`)
};

// Projects API
export const projectsAPI = {
  getAllProjects: (): Promise<AxiosResponse<Project[]>> => apiClient.get('/projects'),
  getProject: (id: number): Promise<AxiosResponse<Project>> => apiClient.get(`/projects/${id}`),
  createProject: (projectData: Project): Promise<AxiosResponse<Project>> => apiClient.post('/projects', projectData),
  updateProject: (id: number | string, projectData: Project): Promise<AxiosResponse<Project>> => {
    // Ensure ID is a number and convert if needed
    const projectId = typeof id === 'string' ? parseInt(id) : id;
    console.log(`Making PUT request to /projects/${projectId} with data:`, projectData);
    return apiClient.put(`/projects/${projectId}`, projectData);
  },
  deleteProject: (id: number): Promise<AxiosResponse<any>> => apiClient.delete(`/projects/${id}`),
  getProjectTasks: (id: number): Promise<AxiosResponse<Task[]>> => apiClient.get(`/projects/${id}/tasks`)
};

// Tasks API
export const tasksAPI = {
  getAllTasks: (): Promise<AxiosResponse<Task[]>> => apiClient.get('/tasks'),
  getTask: (id: number): Promise<AxiosResponse<Task>> => apiClient.get(`/tasks/${id}`),
  createTask: (taskData: Task): Promise<AxiosResponse<Task>> => apiClient.post('/tasks', taskData),
  updateTask: (id: number | string, taskData: Task): Promise<AxiosResponse<Task>> => {
    // Ensure ID is a number and convert if needed
    const taskId = typeof id === 'string' ? parseInt(id) : id;
    return apiClient.put(`/tasks/${taskId}`, taskData);
  },
  deleteTask: (id: number): Promise<AxiosResponse<any>> => apiClient.delete(`/tasks/${id}`),
  updateTaskStatus: (id: number, status: string): Promise<AxiosResponse<Task>> => apiClient.patch(`/tasks/${id}/status`, { status }),
  assignTask: (id: number, userId: number): Promise<AxiosResponse<Task>> => apiClient.patch(`/tasks/${id}/assign`, { userId })
};

// VULNERABILITY: No revocation or token handling
export default {
  auth: authAPI,
  users: usersAPI,
  products: productsAPI,
  projects: projectsAPI,
  tasks: tasksAPI
};