import { apiRequest } from "./queryClient";

export interface User {
  id: number;
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

export const authService = {
  login: async (email: string, password: string, role: string): Promise<AuthResponse> => {
    const response = await apiRequest('POST', '/api/auth/login', {
      email,
      password,
      role,
    });
    return response.json();
  },

  register: async (userData: any) => {
    const response = await apiRequest('POST', '/api/auth/register', userData);
    return response.json();
  },

  getCurrentUser: async (): Promise<{ user: User }> => {
    const response = await apiRequest('GET', '/api/auth/me');
    return response.json();
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  setAuth: (token: string, user: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  getStoredUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: (): boolean => {
    return !!authService.getToken();
  },
};

// Setup axios interceptor for auth
export const setupAuthInterceptor = () => {
  const originalFetch = window.fetch;
  
  window.fetch = async (url: RequestInfo | URL, options: RequestInit = {}) => {
    const token = authService.getToken();
    
    if (token && typeof url === 'string' && url.startsWith('/api')) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      };
    }
    
    const response = await originalFetch(url, options);
    
    // If token is expired, logout
    if (response.status === 401 || response.status === 403) {
      authService.logout();
      window.location.href = '/';
    }
    
    return response;
  };
};
