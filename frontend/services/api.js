import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Add token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 - redirect to login (except for auth endpoints)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const isAuthRequest = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
      if (!isAuthRequest) {
        Cookies.remove('token');
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

// Settings endpoints
export const settingsAPI = {
  getSettings: () => api.get('/settings'),
  updateSettings: (data) => api.put('/settings', data),
  changePassword: (data) => api.put('/settings/change-password', data),
};

// WhatsApp endpoints
export const whatsappAPI = {
  getQRCode: () => api.get('/whatsapp/qr'),
  initialize: () => api.post('/whatsapp/initialize'),
  getStatus: () => api.get('/whatsapp/status'),
  disconnect: () => api.post('/whatsapp/disconnect'),
  getChats: () => api.get('/whatsapp/chats'),
  getChatMessages: (chatId, limit) => api.get(`/whatsapp/chats/${encodeURIComponent(chatId)}/messages`, { params: { limit } }),
  sendChatMessage: (chatId, message) => api.post('/whatsapp/chats/send', { chatId, message }),
  sendChatDocument: (formData) => api.post('/whatsapp/chats/send-document', formData),
  downloadMessageMedia: (chatId, messageId) => api.get(`/whatsapp/chats/${encodeURIComponent(chatId)}/messages/${encodeURIComponent(messageId)}/media`, { responseType: 'blob' }),
};

// Schedule endpoints
export const scheduleAPI = {
  getSchedules: () => api.get('/schedules'),
  getSchedule: (id) => api.get(`/schedules/${id}`),
  getScheduleHistory: (id) => api.get(`/schedules/${id}/history`),
  createSchedule: (data) => api.post('/schedules', data),
  rescheduleSchedule: (id, data) => api.put(`/schedules/${id}/reschedule`, data),
  cancelSchedule: (id) => api.put(`/schedules/${id}/cancel`),
  deleteSchedule: (id) => api.delete(`/schedules/${id}`),
};

// Template endpoints
export const templateAPI = {
  getTemplates: () => api.get('/templates'),
  getTemplate: (id) => api.get(`/templates/${id}`),
  getTemplateFile: (id) => api.get(`/templates/${id}/file`, { responseType: 'blob' }),
  createTemplate: (data) => api.post('/templates', data),
  updateTemplate: (id, data) => api.put(`/templates/${id}`, data),
  deleteTemplate: (id) => api.delete(`/templates/${id}`),
};

// Contact endpoints
export const contactAPI = {
  getGroups: () => api.get('/contacts/groups'),
  createGroup: (data) => api.post('/contacts/groups', data),
  updateGroup: (id, data) => api.put(`/contacts/groups/${id}`, data),
  deleteGroup: (id) => api.delete(`/contacts/groups/${id}`),
  getContacts: (groupId) => api.get('/contacts/contacts', { params: groupId ? { group_id: groupId } : {} }),
  createContact: (data) => api.post('/contacts/contacts', data),
  updateContact: (id, data) => api.put(`/contacts/contacts/${id}`, data),
  deleteContact: (id) => api.delete(`/contacts/contacts/${id}`),
  importContacts: (formData, groupId) => api.post(`/contacts/import${groupId ? `?group_id=${groupId}` : ''}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  exportContacts: (groupId) => {
    const params = groupId ? { group_id: groupId } : {};
    return api.get('/contacts/export', { params, responseType: 'blob' });
  },
  downloadSample: () => api.get('/contacts/sample', { responseType: 'blob' }),
};

// API endpoints
export const messageAPI = {
  sendMessage: (data, apiKey) => {
    const config = {
      headers: {
        'x-api-key': apiKey,
      },
    };
    return api.post('/api/send', data, config);
  },
  sendMessageFromDashboard: (data) => api.post('/api/send-message', data),
  sendMedia: (formData, apiKey) => {
    const config = {
      headers: {
        'x-api-key': apiKey,
      },
    };
    return api.post('/api/send-media', formData, config);
  },
  sendMediaFromDashboard: (formData) => api.post('/api/send-media-message', formData),
  sendMediaUrl: (data, apiKey) => {
    const config = {
      headers: {
        'x-api-key': apiKey,
      },
    };
    return api.post('/api/send-media-url', data, config);
  },
  sendMediaUrlFromDashboard: (data) => api.post('/api/send-media-url-message', data),
  testMessage: (data) => api.post('/api/test', data),
};

export default api;
