import { apiRequest } from "./queryClient";

export interface User {
  id: string;
  email: string;
  role: 'master_admin' | 'admin' | 'sub_admin' | 'doctor' | 'receptionist';
  firstName: string;
  lastName: string;
  specialization?: string;
  isActive: boolean;
  hospitalId?: string;
  branchId?: string;
  createdBy?: string;
  permissions?: string[];
  lastLogin?: string;
  phoneNumber?: string;
  address?: string;
  profilePhotoUrl?: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api';


// Initialize auth interceptor
let isInterceptorInitialized = false;

// Wait for server to be ready
const waitForServer = async (retries = 10, delay = 1000): Promise<void> => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/health`);
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
    if (token && typeof url === 'string' && (url.startsWith('/api') || url.includes('/api/'))) {
      // Create new headers object
      const headers = new Headers(options.headers || {});
      headers.set('Authorization', `Bearer ${token}`);
      
      // Update options with new headers
      options = {
        ...options,
        headers,
      };
      
      console.log('Auth interceptor: Adding token to request', { url, hasToken: !!token });
    }
    
    try {
      const response = await originalFetch(url, options);
      
      // Only handle unauthorized responses for auth-related endpoints
      if (response.status === 401 || response.status === 403) {
        const urlString = typeof url === 'string' ? url : url.toString();
        
        // Only auto-logout for auth-related endpoints
        if (urlString.includes('/auth/me') || urlString.includes('/auth/verify') || urlString.includes('/auth/login')) {
          console.log('Auth interceptor: Auto-logout triggered for auth endpoint:', urlString);
          authService.logout();
        } else {
          console.log('Auth interceptor: 401/403 for non-auth endpoint, letting component handle it:', urlString);
        }
        
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
      
      const requestData = {
        email,
        password,
        role,
      };
      
      console.log('Login request data:', {
        email: requestData.email,
        passwordLength: requestData.password?.length,
        role: requestData.role,
        emailValid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requestData.email || ''),
        roleValid: ['master_admin', 'admin', 'sub_admin', 'doctor', 'receptionist'].includes(requestData.role),
        passwordValid: (requestData.password?.length || 0) >= 6
      });
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
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
      console.log('getCurrentUser: Token exists:', !!token);
      
      if (!token) {
        throw new Error('No auth token');
      }

      console.log('getCurrentUser: Making request to /auth/me');
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('getCurrentUser: Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('getCurrentUser: Error response:', errorText);
        throw new Error('Failed to get current user');
      }

      const data = await response.json();
      console.log('getCurrentUser: Success, user data:', data);
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
    const token = localStorage.getItem('token');
    console.log('getToken: Retrieved token', { hasToken: !!token, tokenLength: token?.length });
    return token;
  },

  setAuth: (token: string, user: User) => {
    console.log('setAuth: Storing token and user', { tokenLength: token.length, userEmail: user.email });
    
    // Clear any existing data first
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Store new data
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    // Verify storage immediately
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    console.log('setAuth: Verification', { 
      tokenStored: !!storedToken, 
      tokenLength: storedToken?.length,
      userStored: !!storedUser,
      tokenMatches: storedToken === token
    });
    
    // Only setup interceptor if token was stored successfully
    if (storedToken === token) {
      setupAuthInterceptor();
    } else {
      console.error('setAuth: Token storage verification failed!');
    }
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
    const isAuth = !!(token && user);
    console.log('isAuthenticated check:', { hasToken: !!token, hasUser: !!user, isAuthenticated: isAuth });
    return isAuth;
  },

  // New helper methods for role-based access
  hasRole: (user: User | null, roles: string[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  },

  canCreateRole: (user: User | null, targetRole: string): boolean => {
    if (!user) return false;
    
    switch (user.role) {
      case 'master_admin':
        return true; // Can create any role
      case 'admin':
        return ['sub_admin', 'doctor', 'receptionist'].includes(targetRole);
      case 'sub_admin':
        return ['doctor', 'receptionist'].includes(targetRole);
      default:
        return false;
    }
  },

  getAccessibleData: (user: User | null) => {
    if (!user) return { hospitalId: null, branchId: null };
    
    return {
      hospitalId: user.hospitalId,
      branchId: user.branchId
    };
  }
};

// Initialize the interceptor if there's a token
if (authService.getToken()) {
  setupAuthInterceptor();
}
