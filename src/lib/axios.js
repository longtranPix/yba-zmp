// Axios configuration for YBA HCM API
import axios from 'axios';
import appConfig from '../../app-config.json';

// Determine environment and API domain
const ENV = window.location.hostname === "localhost" ? "development" : "production";
const API_DOMAIN = appConfig.api[ENV].domain;
const STRAPI_DOMAIN = "http://localhost:1337"; // Strapi GraphQL endpoint

// Create main API client for REST endpoints
export const apiClient = axios.create({
  baseURL: API_DOMAIN,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create GraphQL client for Strapi
export const graphqlClient = axios.create({
  baseURL: `${STRAPI_DOMAIN}/graphql`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth token management
let authToken = null;
let authExpiry = 0;

// Load auth from localStorage
const loadAuthFromStorage = () => {
  try {
    const storedAuth = localStorage.getItem('yba_auth_info');
    const storedExpiry = localStorage.getItem('yba_auth_expiry');
    
    if (storedAuth && storedExpiry) {
      const parsedAuth = JSON.parse(storedAuth);
      const expiry = parseInt(storedExpiry);
      
      if (Date.now() < expiry) {
        authToken = parsedAuth.jwt;
        authExpiry = expiry;
        return true;
      } else {
        // Clear expired auth
        localStorage.removeItem('yba_auth_info');
        localStorage.removeItem('yba_auth_expiry');
      }
    }
  } catch (error) {
    console.error('Error loading auth from storage:', error);
  }
  return false;
};

// Save auth to localStorage
const saveAuthToStorage = (jwt, expiryTime) => {
  try {
    localStorage.setItem('yba_auth_info', JSON.stringify({ jwt }));
    localStorage.setItem('yba_auth_expiry', expiryTime.toString());
    authToken = jwt;
    authExpiry = expiryTime;
  } catch (error) {
    console.error('Error saving auth to storage:', error);
  }
};

// Clear auth
export const clearAuth = () => {
  authToken = null;
  authExpiry = 0;
  localStorage.removeItem('yba_auth_info');
  localStorage.removeItem('yba_auth_expiry');
};

// Get current auth token
export const getAuthToken = () => {
  if (!authToken || Date.now() >= authExpiry) {
    loadAuthFromStorage();
  }
  return authToken;
};

// Set auth token
export const setAuthToken = (jwt, expiryDuration = 5000) => {
  const expiryTime = Date.now() + expiryDuration;
  saveAuthToStorage(jwt, expiryTime);
};

// Initialize auth on load
loadAuthFromStorage();

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid auth
      clearAuth();
      // Optionally redirect to login or trigger re-authentication
      console.warn('Authentication expired, please login again');
    }
    return Promise.reject(error);
  }
);

// GraphQL request interceptor (optional auth for some queries)
graphqlClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token && config.requireAuth !== false) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// GraphQL response interceptor
graphqlClient.interceptors.response.use(
  (response) => {
    // Handle GraphQL errors
    if (response.data?.errors) {
      console.error('GraphQL errors:', response.data.errors);
      // You can handle specific GraphQL errors here
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      clearAuth();
      console.warn('GraphQL authentication expired');
    }
    return Promise.reject(error);
  }
);

// Helper function for GraphQL requests
export const graphqlRequest = async (query, variables = {}, options = {}) => {
  try {
    const response = await graphqlClient.post('', {
      query,
      variables,
    }, {
      requireAuth: options.requireAuth !== false,
      ...options,
    });

    if (response.data?.errors) {
      throw new Error(response.data.errors[0]?.message || 'GraphQL Error');
    }

    return response.data?.data;
  } catch (error) {
    console.error('GraphQL request failed:', error);
    throw error;
  }
};

// Helper function for REST API requests
export const restRequest = {
  get: (url, config = {}) => apiClient.get(url, config),
  post: (url, data, config = {}) => apiClient.post(url, data, config),
  put: (url, data, config = {}) => apiClient.put(url, data, config),
  patch: (url, data, config = {}) => apiClient.patch(url, data, config),
  delete: (url, config = {}) => apiClient.delete(url, config),
};

export default apiClient;
