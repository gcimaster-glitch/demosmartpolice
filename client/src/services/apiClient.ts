import axios, { AxiosInstance, AxiosError } from 'axios';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies in requests
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ success: boolean; error: string }>) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================
// Auth API
// ============================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  companyName: string;
  planId: string;
  phone: string;
  postalCode: string;
  prefecture: string;
  city: string;
  address1: string;
  address2?: string;
  affiliateCode?: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: {
      id: number;
      name: string;
      email: string;
      role: string;
      clientId?: number;
      staffId?: number;
      affiliateId?: string;
    };
    token: string;
  };
  message?: string;
}

export const authAPI = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', { email, password });
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/register', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
    localStorage.removeItem('token');
  },

  getMe: async (): Promise<any> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};

// ============================================
// Dashboard API
// ============================================

export const dashboardAPI = {
  getClientDashboard: async (): Promise<any> => {
    const response = await apiClient.get('/dashboard');
    return response.data;
  },

  getAdminDashboard: async (): Promise<any> => {
    const response = await apiClient.get('/dashboard/admin');
    return response.data;
  },
};

// ============================================
// Announcements API
// ============================================

export const announcementsAPI = {
  getAll: async (): Promise<any> => {
    const response = await apiClient.get('/announcements');
    return response.data;
  },

  getById: async (id: number): Promise<any> => {
    const response = await apiClient.get(`/announcements/${id}`);
    return response.data;
  },

  create: async (data: any): Promise<any> => {
    const response = await apiClient.post('/announcements', data);
    return response.data;
  },

  update: async (id: number, data: any): Promise<any> => {
    const response = await apiClient.put(`/announcements/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<any> => {
    const response = await apiClient.delete(`/announcements/${id}`);
    return response.data;
  },

  getAllForAdmin: async (): Promise<any> => {
    const response = await apiClient.get('/announcements/admin');
    return response.data;
  },
};

// ============================================
// Tickets API
// ============================================

export const ticketsAPI = {
  getAll: async (): Promise<any> => {
    const response = await apiClient.get('/tickets');
    return response.data;
  },

  getById: async (id: number): Promise<any> => {
    const response = await apiClient.get(`/tickets/${id}`);
    return response.data;
  },

  create: async (data: {
    subject: string;
    category: string;
    priority: '高' | '中' | '低';
    message: string;
  }): Promise<any> => {
    const response = await apiClient.post('/tickets', data);
    return response.data;
  },

  addMessage: async (ticketId: number, text: string): Promise<any> => {
    const response = await apiClient.post(`/tickets/${ticketId}/messages`, { text });
    return response.data;
  },

  updateStatus: async (ticketId: number, status: '受付中' | '対応中' | '完了'): Promise<any> => {
    const response = await apiClient.put(`/tickets/${ticketId}/status`, { status });
    return response.data;
  },

  assignStaff: async (ticketId: number, assigneeId: number | null): Promise<any> => {
    const response = await apiClient.put(`/tickets/${ticketId}/assign`, { assigneeId });
    return response.data;
  },
};

// ============================================
// Clients API
// ============================================

export const clientsAPI = {
  getAll: async (): Promise<any> => {
    const response = await apiClient.get('/clients');
    return response.data;
  },

  getById: async (id: number): Promise<any> => {
    const response = await apiClient.get(`/clients/${id}`);
    return response.data;
  },

  update: async (id: number, data: any): Promise<any> => {
    const response = await apiClient.put(`/clients/${id}`, data);
    return response.data;
  },

  updateStatus: async (id: number, status: 'active' | 'suspended'): Promise<any> => {
    const response = await apiClient.put(`/clients/${id}/status`, { status });
    return response.data;
  },

  getTickets: async (id: number): Promise<any> => {
    const response = await apiClient.get(`/clients/${id}/tickets`);
    return response.data;
  },

  getConsumption: async (id: number): Promise<any> => {
    const response = await apiClient.get(`/clients/${id}/consumption`);
    return response.data;
  },
};

// ============================================
// Users API
// ============================================

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  position?: string;
  department?: string;
  isPrimaryContact?: boolean;
  role?: 'CLIENT' | 'CLIENTADMIN';
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
  isPrimaryContact?: boolean;
  role?: 'CLIENT' | 'CLIENTADMIN';
}

export const usersAPI = {
  getClientUsers: async (clientId: number): Promise<any> => {
    const response = await apiClient.get(`/users/client/${clientId}`);
    return response.data;
  },

  create: async (clientId: number, data: CreateUserRequest): Promise<any> => {
    const response = await apiClient.post(`/users/client/${clientId}`, data);
    return response.data;
  },

  update: async (userId: number, data: UpdateUserRequest): Promise<any> => {
    const response = await apiClient.put(`/users/${userId}`, data);
    return response.data;
  },

  delete: async (userId: number): Promise<any> => {
    const response = await apiClient.delete(`/users/${userId}`);
    return response.data;
  },
};

// ============================================
// Billing API
// ============================================

export const billingAPI = {
  getClientInvoices: async (clientId: number): Promise<any> => {
    const response = await apiClient.get(`/billing/client/${clientId}`);
    return response.data;
  },

  getInvoiceById: async (id: string): Promise<any> => {
    const response = await apiClient.get(`/billing/${id}`);
    return response.data;
  },

  getAllInvoices: async (): Promise<any> => {
    const response = await apiClient.get('/billing');
    return response.data;
  },
};

// ============================================
// Plans API
// ============================================

export const plansAPI = {
  getAll: async (): Promise<any> => {
    const response = await apiClient.get('/plans');
    return response.data;
  },

  getById: async (id: string): Promise<any> => {
    const response = await apiClient.get(`/plans/${id}`);
    return response.data;
  },

  changePlan: async (clientId: number, newPlanId: string): Promise<any> => {
    const response = await apiClient.post('/plans/change', { clientId, newPlanId });
    return response.data;
  },
};

// ============================================
// Error Handler
// ============================================

export const handleAPIError = (error: any): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ success: boolean; error: string }>;
    if (axiosError.response?.data?.error) {
      return axiosError.response.data.error;
    }
    if (axiosError.response?.status === 401) {
      return '認証エラー: ログインしてください';
    }
    if (axiosError.response?.status === 403) {
      return 'アクセス権限がありません';
    }
    if (axiosError.response?.status === 404) {
      return 'データが見つかりません';
    }
    if (axiosError.response?.status === 500) {
      return 'サーバーエラーが発生しました';
    }
  }
  return 'エラーが発生しました';
};

export default apiClient;
