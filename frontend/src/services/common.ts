// src/services/common.ts

// Custom error types
class ApiError extends Error {
  constructor(message: string, public status: number, public response?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

class NetworkError extends Error {
  constructor(message: string = 'Network error') {
    super(message);
    this.name = 'NetworkError';
  }
}

class TimeoutError extends Error {
  constructor(message: string = 'Request timeout') {
    super(message);
    this.name = 'TimeoutError';
  }
}

// Function to get API base URL with better error handling
export const getApiBaseUrl = (): string => {
  const url = process.env.REACT_APP_API_URL || process.env.VITE_API_URL;
  if (!url) {
    console.warn('REACT_APP_API_URL/VITE_API_URL not set, using localhost fallback');
    return 'http://localhost:5000';
  }
  
  // Basic URL validation
  try {
    new URL(url);
    return url;
  } catch (e) {
    console.error('Invalid API URL format:', url);
    console.warn('Using localhost fallback');
    return 'http://localhost:5000';
  }
};

// API configuration with default timeout
const API_CONFIG = {
  DEFAULT_TIMEOUT: 10000, // 10 seconds
  RETRY_LIMIT: 3,
  RETRY_DELAY: 1000, // 1 second
};

// Helper function to add timeout to fetch
const fetchWithTimeout = async (
  url: string, 
  config: RequestInit, 
  timeout: number = API_CONFIG.DEFAULT_TIMEOUT
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { ...config, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new TimeoutError();
    }
    throw error;
  }
};

export const api = {
  get: async <T = any>(
    endpoint: string, 
    options: RequestInit = {}, 
    retryCount: number = 0
  ): Promise<T> => {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/api${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };
    
    try {
      const response = await fetchWithTimeout(url, config);
      
      if (!response.ok) {
        let errorResponse;
        try {
          errorResponse = await response.json();
        } catch (e) {
          errorResponse = await response.text();
        }
        
        const error = new ApiError(
          `API request failed with status ${response.status}`,
          response.status,
          errorResponse
        );
        
        // Retry on network errors or server errors
        if (
          (response.status >= 500 && retryCount < API_CONFIG.RETRY_LIMIT) || 
          response.status === 429 // Too many requests
        ) {
          console.warn(`Retrying request to ${url} (attempt ${retryCount + 1})`);
          await new Promise(r => setTimeout(r, API_CONFIG.RETRY_DELAY * (retryCount + 1)));
          return api.get<T>(endpoint, options, retryCount + 1);
        }
        
        throw error;
      }
      
      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text() as unknown as T;
      }
    } catch (error) {
      if (error instanceof NetworkError || error instanceof TimeoutError) {
        console.error(`Network error for ${url}:`, error.message);
        throw error;
      }
      
      console.error(`API GET request failed for ${url}:`, error);
      throw new NetworkError();
    }
  },
  
  post: async <T = any>(
    endpoint: string, 
    data: any, 
    options: RequestInit = {}, 
    retryCount: number = 0
  ): Promise<T> => {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/api${endpoint}`;
    
    const config: RequestInit = {
      method: 'POST',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(data),
    };
    
    try {
      const response = await fetchWithTimeout(url, config);
      
      if (!response.ok) {
        let errorResponse;
        try {
          errorResponse = await response.json();
        } catch (e) {
          errorResponse = await response.text();
        }
        
        const error = new ApiError(
          `API request failed with status ${response.status}`,
          response.status,
          errorResponse
        );
        
        // Retry on network errors or server errors
        if (
          (response.status >= 500 && retryCount < API_CONFIG.RETRY_LIMIT) || 
          response.status === 429 // Too many requests
        ) {
          console.warn(`Retrying request to ${url} (attempt ${retryCount + 1})`);
          await new Promise(r => setTimeout(r, API_CONFIG.RETRY_DELAY * (retryCount + 1)));
          return api.post<T>(endpoint, data, options, retryCount + 1);
        }
        
        throw error;
      }
      
      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text() as unknown as T;
      }
    } catch (error) {
      if (error instanceof NetworkError || error instanceof TimeoutError) {
        console.error(`Network error for ${url}:`, error.message);
        throw error;
      }
      
      console.error(`API POST request failed for ${url}:`, error);
      throw new NetworkError();
    }
  },
  
  put: async <T = any>(
    endpoint: string, 
    data: any, 
    options: RequestInit = {}, 
    retryCount: number = 0
  ): Promise<T> => {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/api${endpoint}`;
    
    const config: RequestInit = {
      method: 'PUT',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(data),
    };
    
    try {
      const response = await fetchWithTimeout(url, config);
      
      if (!response.ok) {
        let errorResponse;
        try {
          errorResponse = await response.json();
        } catch (e) {
          errorResponse = await response.text();
        }
        
        const error = new ApiError(
          `API request failed with status ${response.status}`,
          response.status,
          errorResponse
        );
        
        // Retry on network errors or server errors
        if (
          (response.status >= 500 && retryCount < API_CONFIG.RETRY_LIMIT) || 
          response.status === 429 // Too many requests
        ) {
          console.warn(`Retrying request to ${url} (attempt ${retryCount + 1})`);
          await new Promise(r => setTimeout(r, API_CONFIG.RETRY_DELAY * (retryCount + 1)));
          return api.put<T>(endpoint, data, options, retryCount + 1);
        }
        
        throw error;
      }
      
      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text() as unknown as T;
      }
    } catch (error) {
      if (error instanceof NetworkError || error instanceof TimeoutError) {
        console.error(`Network error for ${url}:`, error.message);
        throw error;
      }
      
      console.error(`API PUT request failed for ${url}:`, error);
      throw new NetworkError();
    }
  },
  
  delete: async <T = any>(
    endpoint: string, 
    options: RequestInit = {}, 
    retryCount: number = 0
  ): Promise<T> => {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/api${endpoint}`;
    
    const config: RequestInit = {
      method: 'DELETE',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };
    
    try {
      const response = await fetchWithTimeout(url, config);
      
      if (!response.ok) {
        let errorResponse;
        try {
          errorResponse = await response.json();
        } catch (e) {
          errorResponse = await response.text();
        }
        
        const error = new ApiError(
          `API request failed with status ${response.status}`,
          response.status,
          errorResponse
        );
        
        // Retry on network errors or server errors
        if (
          (response.status >= 500 && retryCount < API_CONFIG.RETRY_LIMIT) || 
          response.status === 429 // Too many requests
        ) {
          console.warn(`Retrying request to ${url} (attempt ${retryCount + 1})`);
          await new Promise(r => setTimeout(r, API_CONFIG.RETRY_DELAY * (retryCount + 1)));
          return api.delete<T>(endpoint, options, retryCount + 1);
        }
        
        throw error;
      }
      
      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text() as unknown as T;
      }
    } catch (error) {
      if (error instanceof NetworkError || error instanceof TimeoutError) {
        console.error(`Network error for ${url}:`, error.message);
        throw error;
      }
      
      console.error(`API DELETE request failed for ${url}:`, error);
      throw new NetworkError();
    }
  },
};

// Export config and error types
export const apiConfig = API_CONFIG;
export { ApiError, NetworkError, TimeoutError };
export default getApiBaseUrl();
