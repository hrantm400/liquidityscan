// Используем относительный путь для proxy
// В development всегда используем '/api' для прокси Vite
// В production можно использовать VITE_API_URL если нужен абсолютный URL
const API_URL = import.meta.env.DEV 
  ? '/api'  // В development всегда используем прокси Vite
  : (import.meta.env.VITE_API_URL || window.location.origin + '/api');

export class ApiClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshPromise: Promise<string> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthData() {
    const authStorage = localStorage.getItem('auth-storage');
    if (!authStorage) return null;
    
    try {
      const parsed = JSON.parse(authStorage);
      return {
        token: parsed?.state?.token,
        refreshToken: parsed?.state?.refreshToken,
      };
    } catch (e) {
      return null;
    }
  }

  private setAuthData(token: string, refreshToken?: string) {
    const authStorage = localStorage.getItem('auth-storage');
    if (!authStorage) return;
    
    try {
      const parsed = JSON.parse(authStorage);
      parsed.state.token = token;
      if (refreshToken) {
        parsed.state.refreshToken = refreshToken;
      }
      localStorage.setItem('auth-storage', JSON.stringify(parsed));
    } catch (e) {
      console.error('Failed to update auth storage:', e);
    }
  }

  private async refreshAccessToken(): Promise<string> {
    // If already refreshing, return the existing promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const authData = this.getAuthData();
    if (!authData?.refreshToken) {
      throw new Error('No refresh token available');
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken: authData.refreshToken }),
        });

        if (!response.ok) {
          throw new Error('Failed to refresh token');
        }

        const data = await response.json();
        const newToken = data.accessToken || data.token;
        const newRefreshToken = data.refreshToken;

        if (newToken) {
          this.setAuthData(newToken, newRefreshToken);
          return newToken;
        }

        throw new Error('No token in refresh response');
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0,
  ): Promise<T> {
    const authData = this.getAuthData();
    let authHeaders: HeadersInit = {};

    if (authData?.token) {
      authHeaders = {
        Authorization: `Bearer ${authData.token}`,
      };
    }

    // Убеждаемся что URL правильный - должен быть относительный путь для proxy
    // В development используем относительный путь для прокси Vite
    // В production можно использовать абсолютный URL
    let url: string;
    if (import.meta.env.DEV) {
      // В development всегда относительный путь для прокси
      url = endpoint.startsWith('/') 
        ? `${this.baseUrl}${endpoint}` 
        : `${this.baseUrl}/${endpoint}`;
    } else {
      // В production используем как есть (может быть абсолютный URL)
      url = endpoint.startsWith('http') 
        ? endpoint 
        : (endpoint.startsWith('/') 
          ? `${this.baseUrl}${endpoint}` 
          : `${this.baseUrl}/${endpoint}`);
    }
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          ...options.headers,
        },
      });

      // If 401 and we have a refresh token, try to refresh and retry
      if (response.status === 401 && authData?.refreshToken && retryCount === 0 && !endpoint.includes('/auth/')) {
        try {
          const newToken = await this.refreshAccessToken();
          // Retry the request with new token
          return this.request<T>(endpoint, options, retryCount + 1);
        } catch (refreshError) {
          // Refresh failed, clear auth and redirect to login
          console.error('Token refresh failed:', refreshError);
          localStorage.removeItem('auth-storage');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          throw new Error('Session expired. Please login again.');
        }
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { message: errorText || `HTTP error! status: ${response.status}` };
        }
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      // Check if response has content
      const text = await response.text();
      if (!text || text.trim().length === 0) {
        console.warn('Empty response from API:', url);
        return null;
      }

      try {
        return JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', text.substring(0, 100));
        throw new Error('Invalid JSON response from server');
      }
    } catch (error) {
      // Better error handling for connection issues
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.error('API request failed - is backend running?', url);
        throw new Error('Cannot connect to backend server. Please make sure the backend is running on http://localhost:3000');
      }
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient(API_URL);

// Auth endpoints
export const authApi = {
  register: (data: { email: string; password: string; name?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
  getProfile: () => api.get('/auth/me'),
};

// Signals endpoints
export const signalsApi = {
  getSignals: (filters?: {
    strategyType?: string;
    symbol?: string;
    timeframe?: string;
    limit?: number;
    offset?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.strategyType) params.append('strategyType', filters.strategyType);
    if (filters?.symbol) params.append('symbol', filters.symbol);
    if (filters?.timeframe) params.append('timeframe', filters.timeframe);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());
    return api.get(`/signals?${params.toString()}`);
  },
  getSignalById: (id: string) => api.get(`/signals/${id}`),
  getCandles: (symbol: string, timeframe: string, limit?: number) => {
    const params = new URLSearchParams();
    params.append('symbol', symbol);
    params.append('timeframe', timeframe);
    if (limit) params.append('limit', limit.toString());
    return api.get(`/signals/candles?${params.toString()}`);
  },
};
