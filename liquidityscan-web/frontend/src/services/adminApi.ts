import { ApiClient } from './api';

// Create a separate API client for admin endpoints
// Use the same base URL pattern as the main API client
const API_URL = import.meta.env.DEV 
  ? '/api'  // In development, use Vite proxy
  : (import.meta.env.VITE_API_URL || window.location.origin + '/api');

const adminApi = new ApiClient(`${API_URL}/admin`);

// ==================== USER MANAGEMENT ====================

export const userManagementApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    const query = queryParams.toString();
    return adminApi.get(`/users${query ? `?${query}` : ''}`);
  },
  
  getById: (id: string) =>
    adminApi.get(`/users/${id}`),
  
  update: (id: string, data: any) =>
    adminApi.put(`/users/${id}`, data),
  
  delete: (id: string) =>
    adminApi.delete(`/users/${id}`),
};

// ==================== COURSE MANAGEMENT ====================

export const courseManagementApi = {
  getAll: (params?: { page?: number; limit?: number; category?: string; published?: boolean; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.published !== undefined) queryParams.append('published', params.published.toString());
    if (params?.search) queryParams.append('search', params.search);
    const query = queryParams.toString();
    return adminApi.get(`/courses${query ? `?${query}` : ''}`);
  },
  
  getById: (id: string) =>
    adminApi.get(`/courses/${id}`),
  
  create: (data: any) =>
    adminApi.post('/courses', data),
  
  update: (id: string, data: any) =>
    adminApi.put(`/courses/${id}`, data),
  
  delete: (id: string) =>
    adminApi.delete(`/courses/${id}`),
  
  publish: (id: string, published: boolean) =>
    adminApi.post(`/courses/${id}/publish`, { published }),
};

// ==================== LESSON MANAGEMENT ====================

export const lessonManagementApi = {
  getByCourse: (courseId: string) =>
    adminApi.get(`/courses/${courseId}/lessons`),
  
  create: (courseId: string, data: any) =>
    adminApi.post(`/courses/${courseId}/lessons`, data),
  
  update: (id: string, data: any) =>
    adminApi.put(`/lessons/${id}`, data),
  
  delete: (id: string) =>
    adminApi.delete(`/lessons/${id}`),
  
  reorder: (courseId: string, lessonOrders: { id: string; order: number }[]) =>
    adminApi.put('/lessons/reorder', { courseId, lessonOrders }),
};

// ==================== SIGNAL MANAGEMENT ====================

export const signalManagementApi = {
  getAll: (params?: { page?: number; limit?: number; strategyType?: string; symbol?: string; status?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.strategyType) queryParams.append('strategyType', params.strategyType);
    if (params?.symbol) queryParams.append('symbol', params.symbol);
    if (params?.status) queryParams.append('status', params.status);
    const query = queryParams.toString();
    return adminApi.get(`/signals${query ? `?${query}` : ''}`);
  },
  
  delete: (id: string) =>
    adminApi.delete(`/signals/${id}`),
  
  updateStatus: (id: string, status: string) =>
    adminApi.put(`/signals/${id}/status`, { status }),
};

// ==================== ANALYTICS ====================

export const analyticsApi = {
  getDashboard: () =>
    adminApi.get('/analytics/dashboard'),
  
  getUsers: (period?: 'day' | 'week' | 'month') => {
    const queryParams = new URLSearchParams();
    if (period) queryParams.append('period', period);
    const query = queryParams.toString();
    return adminApi.get(`/analytics/users${query ? `?${query}` : ''}`);
  },
  
  getCourses: () =>
    adminApi.get('/analytics/courses'),
  
  getSignals: (period?: 'day' | 'week' | 'month') => {
    const queryParams = new URLSearchParams();
    if (period) queryParams.append('period', period);
    const query = queryParams.toString();
    return adminApi.get(`/analytics/signals${query ? `?${query}` : ''}`);
  },
};

// ==================== CONTENT MANAGEMENT ====================

export const contentManagementApi = {
  getAll: (params?: { page?: number; limit?: number; type?: string; published?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.published !== undefined) queryParams.append('published', params.published.toString());
    const query = queryParams.toString();
    return adminApi.get(`/content${query ? `?${query}` : ''}`);
  },
  
  create: (data: any) =>
    adminApi.post('/content', data),
  
  update: (id: string, data: any) =>
    adminApi.put(`/content/${id}`, data),
  
  delete: (id: string) =>
    adminApi.delete(`/content/${id}`),
  
  publish: (id: string, published: boolean) =>
    adminApi.post(`/content/${id}/publish`, { published }),
};

// ==================== SETTINGS ====================

export const settingsApi = {
  get: () =>
    adminApi.get('/settings'),
};

export default adminApi;
