export interface User {
  id?: number;
  username?: string;
  email?: string;
  role?: string;
  token?: string;
  creditCardNumber?: string;
  profile?: any;
  [key: string]: any;
}

export interface Credentials {
  username: string;
  password: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  description?: string;
  [key: string]: any;
}

export interface Project {
  id?: number;
  name: string;
  description?: string;
  status?: string;
  ownerId?: number;
  [key: string]: any;
}

export interface Task {
  id?: number;
  title: string;
  description?: string;
  status?: string;
  assignedTo?: number;
  projectId?: number;
  [key: string]: any;
}