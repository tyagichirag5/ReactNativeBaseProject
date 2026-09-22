import axios, {
    AxiosError,
    AxiosInstance,
    InternalAxiosRequestConfig,
} from 'axios';
import { Platform } from 'react-native';
import {
    getAuthTokens,
    saveAuthTokens,
    clearAuthTokens,
} from '../services/auth/authStorage';

const BASE_URL = Platform.select({
    android: 'http://10.0.2.2:3000/api',
    ios: 'http://localhost:3000/api',
    default: 'https://api.yourdomain.com/api',
});

export const apiClient: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Extend Axios config type to handle retry flags
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

// 1. Request Interceptor: Attach Token
apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        const tokens = await getAuthTokens();
        if (tokens?.accessToken && config.headers) {
            config.headers.Authorization = `Bearer ${tokens.accessToken}`;
        }
        return config;
    },
    (error: AxiosError) => Promise.reject(error)
);

// 2. Response Interceptor: 401 Catch & Token Refresh
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null) => {
    failedQueue.forEach((promise) => {
        if (error) {
            promise.reject(error);
        } else {
            promise.resolve();
        }
    });
    failedQueue = [];
};

apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as CustomAxiosRequestConfig;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // Queue concurrent requests while token is refreshing
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(() => apiClient(originalRequest))
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const tokens = await getAuthTokens();
                if (!tokens?.refreshToken) {
                    throw new Error('No refresh token available');
                }

                // Call refresh endpoint directly using a clean axios instance (avoids loop)
                const response = await axios.post<{
                    accessToken: string;
                    refreshToken: string;
                }>(`${BASE_URL}/auth/refresh`, {
                    refreshToken: tokens.refreshToken,
                });

                const newTokens = response.data;
                await saveAuthTokens(newTokens);

                processQueue(null);

                // Retry original request with the new access token
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
                }
                return apiClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError as AxiosError);
                await clearAuthTokens(); // Token expired or invalid -> log out
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);