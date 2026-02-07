import { ApiError } from './types';
import NetInfo from '@react-native-community/netinfo';

export const fetchWithErrorHandling = async (url: string, options?: RequestInit) => {
    try {
        const netState = await NetInfo.fetch();
        if (!netState.isConnected) {
            throw new ApiError('No internet connection', 0, 'NETWORK_ERROR');
        }

        const response = await fetch(url, options);

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new ApiError(
                error.message || `Request failed with status ${response.status}`,
                response.status,
                error.code
            );
        }

        // Check if content type is json
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return response.json();
        }

        return response.text();
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        // Network error (no internet, timeout, etc.)
        throw new ApiError(error instanceof Error ? error.message : 'Network error', 0, 'NETWORK_ERROR');
    }
};

export const fetchWithRetry = async (
    url: string,
    options?: RequestInit,
    retries = 3
) => {
    for (let i = 0; i < retries; i++) {
        try {
            return await fetchWithErrorHandling(url, options);
        } catch (error) {
            if (i === retries - 1) throw error;
            // Exponential backoff
            await new Promise((r) => setTimeout(r, Math.pow(2, i) * 1000));
        }
    }
};
