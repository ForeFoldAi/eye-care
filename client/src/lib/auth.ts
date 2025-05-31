interface User {
  id: number;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  specialization?: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

export const getStoredToken = (): string | null => {
  return localStorage.getItem('token');
};

export const getStoredUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const setAuthData = (token: string, user: User): void => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

export const clearAuthData = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const isAuthenticated = (): boolean => {
  return !!getStoredToken();
};

export const hasRole = (role: string): boolean => {
  const user = getStoredUser();
  return user?.role === role;
};

export const getCurrentUser = (): User | null => {
  return getStoredUser();
};
