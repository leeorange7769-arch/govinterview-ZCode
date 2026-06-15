import axios, { type AxiosError } from 'axios';

// 开发环境用 Vite 代理，生产环境用环境变量指定的地址
const API_BASE = (import.meta as any).env?.VITE_API_URL ?? '/api';

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// 请求拦截器：自动附加 Token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：统一处理错误
apiClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError<{ error?: { code?: string; message?: string } }>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

// ---- 类型 ----
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  error?: { code: string; message: string };
}

export interface PaginatedData<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type { AxiosError };

export default apiClient;
