import { apiRequest } from "./queryClient";

export interface User {
  id: string;
  email: string;
  role: 'doctor' | 'receptionist';
  firstName: string;
  lastName: string;
  specialization?: string;
  isActive: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

const API_BASE_URL = '/api';

// Initialize auth interceptor
let isInterceptorInitialized = false;

// Wait for server to be ready
const waitForServer = async (retries = 10, delay = 1000): Promise<void> => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch('/health');
      if (response.ok) {
        console.log('Server is ready');
        return;
      }
    } catch (error) {
      console.log(`Server not ready, attempt ${i + 1} of ${retries}`);
    }
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  throw new Error('Server failed to start');
};

// Setup auth interceptor
const setupAuthInterceptor = () => {
  if (isInterceptorInitialized) {
    return;
  }

  const originalFetch = window.fetch;
  
  window.fetch = async (url: RequestInfo | URL, options: RequestInit = {}) => {
    // Get the current token
    const token = authService.getToken();
    
    // Only modify API requests
    if (token && typeof url === 'string' && url.startsWith('/api')) {
      // Create new headers object
      const headers = new Headers(options.headers || {});
      headers.set('Authorization', `Bearer ${token}`);
      
      // Update options with new headers
      options = {
        ...options,
        headers,
      };
    }
    
    try {
      const response = await originalFetch(url, options);
      
      // Handle unauthorized responses
      if (response.status === 401 || response.status === 403) {
        authService.logout();
        return response;
      }
      
      return response;
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  };

  isInterceptorInitialized = true;
};

export const authService = {
  login: async (email: string, password: string, role: string): Promise<AuthResponse> => {
    try {
      await waitForServer();
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
      email,
      password,
      role,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Login failed' }));
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      
      if (!data.token || !data.user) {
        throw new Error('Invalid response from server');
      }

      // Store auth data
      authService.setAuth(data.token, data.user);
      
      // Initialize the auth interceptor after successful login
      setupAuthInterceptor();
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  register: async (userData: any) => {
    await waitForServer();
    const response = await apiRequest('POST', `${API_BASE_URL}/auth/register`, userData);
    return response.json();
  },

  getCurrentUser: async (): Promise<{ user: User }> => {
    try {
      await waitForServer();
      
      const token = authService.getToken();
      if (!token) {
        throw new Error('No auth token');
      }

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get current user');
      }

      const data = await response.json();
      return data;
    } catch (error: unknown) {
      console.error('Get current user error:', error);
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    isInterceptorInitialized = false;
    window.location.href = '/login';
  },

  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  setAuth: (token: string, user: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setupAuthInterceptor();
  },

  getStoredUser: (): User | null => {
    try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error parsing stored user:', error);
      return null;
    }
  },

  isAuthenticated: (): boolean => {
    const token = authService.getToken();
    const user = authService.getStoredUser();
    return !!(token && user);
  },
};

// Initialize the interceptor if there's a token
if (authService.getToken()) {
  setupAuthInterceptor();
}
