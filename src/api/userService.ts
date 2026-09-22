import { apiClient } from '../api/client';

export interface User {
    id: string;
    name: string;
    email: string;
}

export interface UpdateUserPayload {
    name: string;
}

export const userService = {
    getProfile: async (): Promise<User> => {
        const response = await apiClient.get<User>('/users/me');
        return response.data;
    },

    updateProfile: async (payload: UpdateUserPayload): Promise<User> => {
        const response = await apiClient.put<User>('/users/me', payload);
        return response.data;
    },
};