import * as Keychain from 'react-native-keychain';

const AUTH_SERVICE = 'com.myapp.auth_tokens';

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

/**
 * Persist tokens securely in the Keychain/Keystore.
 */
export const saveAuthTokens = async (tokens: AuthTokens): Promise<boolean> => {
    try {
        await Keychain.setGenericPassword('auth_session', JSON.stringify(tokens), {
            service: AUTH_SERVICE,
            accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        });
        return true;
    } catch (error) {
        console.error('Failed to save tokens to keychain:', error);
        return false;
    }
};

/**
 * Retrieve stored tokens.
 */
export const getAuthTokens = async (): Promise<AuthTokens | null> => {
    try {
        const credentials = await Keychain.getGenericPassword({
            service: AUTH_SERVICE,
        });

        if (credentials) {
            return JSON.parse(credentials.password) as AuthTokens;
        }
        return null;
    } catch (error) {
        console.error('Failed to retrieve tokens from keychain:', error);
        return null;
    }
};

/**
 * Clear stored tokens on logout.
 */
export const clearAuthTokens = async (): Promise<boolean> => {
    try {
        await Keychain.resetGenericPassword({ service: AUTH_SERVICE });
        return true;
    } catch (error) {
        console.error('Failed to clear tokens from keychain:', error);
        return false;
    }
};