import { apiClient } from '../api/client';
import {
    saveAuthTokens,
    clearAuthTokens,
    AuthTokens,
} from './auth/authStorage';

interface LoginResponse {
    user: { id: string; email: string };
    tokens: AuthTokens;
}

export const authService = {
    login: async (email: string, password: string): Promise<void> => {
        const response = await apiClient.post<LoginResponse>('/auth/login', {
            email,
            password,
        });

        // Save tokens securely in device Keychain/Keystore
        await saveAuthTokens(response.data.tokens);
    },

    logout: async (): Promise<void> => {
        try {
            await apiClient.post('/auth/logout');
        } finally {
            // Always clear local keychain on logout
            await clearAuthTokens();
        }
    },
};