// API Configuration
export const API_CONFIG = {
  // Base URL for API requests
  baseURL: import.meta.env.VITE_API_URL || '',
  
  // API endpoints
  api: {
    base: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
    health: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/health` : '/health',
  },
  
  // Environment info
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

// Helper function to construct API URLs
export const getApiUrl = (endpoint: string): string => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  if (import.meta.env.VITE_API_URL) {
    // Production: use absolute URL
    return `${import.meta.env.VITE_API_URL}/${cleanEndpoint}`;
  } else {
    // Development: use relative URL (proxy will handle it)
    return `/${cleanEndpoint}`;
  }
};

export default API_CONFIG;
