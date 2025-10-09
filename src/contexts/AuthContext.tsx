import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService, { User as AuthUser } from '../services/auth/authService';
import standaloneAuthService, { User as StandaloneUser, LoginResponse } from '../services/auth/standaloneAuthService';
import socialAuthService from '../services/auth/socialAuthService';
import { SocialAuthResponse, SocialProvider } from '../types/socialAuth';
import config from '../config/environment';

// Unified User type that works with both Odoo and Standalone API
type User = AuthUser | StandaloneUser;

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  loginWithSocial: (provider: SocialProvider, socialData?: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  setUser: (user: User | null) => void;
  register: (userData: { username: string; password: string; email: string; name: string; phone?: string }) => Promise<void>;
  registerWithSocial: (provider: SocialProvider, socialData?: any) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const AUTH_TOKEN_KEY = '@PawSmart:authToken';
const USER_DATA_KEY = '@PawSmart:userData';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in when app starts
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);

      // Choose authentication service based on configuration
      if (config.USE_STANDALONE_API) {
        // Use Standalone API (JWT)
        const userData = await standaloneAuthService.getCurrentUser();

        if (userData) {
          // Verify token is still valid
          const isValid = await standaloneAuthService.verifyToken();

          if (isValid) {
            setIsAuthenticated(true);
            setUser(userData);
          } else {
            // Try to refresh token
            const refreshResponse = await standaloneAuthService.refreshToken();

            if (refreshResponse) {
              setIsAuthenticated(true);
              setUser(refreshResponse.user);
            } else {
              // Refresh failed, logout
              await logout();
            }
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        // Use Odoo API
        const userData = await authService.getCurrentUser();

        if (userData) {
          // Verify the token is still valid
          const isValid = await authService.verifyToken();

          if (isValid) {
            setIsAuthenticated(true);
            setUser(userData);
          } else {
            // Token is invalid, try to refresh
            const refreshResponse = await authService.refreshToken();

            if (refreshResponse) {
              setIsAuthenticated(true);
              setUser(refreshResponse.user);
            } else {
              // Refresh failed, logout
              await logout();
            }
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      }
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);

      // Choose authentication service based on configuration
      if (config.USE_STANDALONE_API) {
        // Use Standalone API (JWT)
        const response = await standaloneAuthService.login({
          username,
          password,
        });

        setIsAuthenticated(true);
        setUser(response.user);
      } else {
        // Use Odoo API
        // If we have an API key configured, we don't need password
        if (config.ODOO.API_KEY) {
          // API key authentication will be handled by authService
        }

        // Use configured username if available and no username provided
        const finalUsername = username || config.ODOO.USERNAME || '';

        const response = await authService.login({
          username: finalUsername,
          password: password || config.ODOO.PASSWORD || '',
          database: config.ODOO.DATABASE,
        });

        setIsAuthenticated(true);
        setUser(response.user);
      }

    } catch (error: any) {
      // Check for network errors
      if (error.message?.includes('Network') ||
          error.message?.includes('fetch') ||
          error.message?.includes('ECONNREFUSED') ||
          error.message?.includes('ETIMEDOUT') ||
          error.message?.includes('Failed to fetch')) {
        throw new Error('Server tidak tersedia. Silakan coba lagi nanti.');
      } else if (error.message?.includes('Invalid username') ||
                 error.message?.includes('Invalid password') ||
                 error.message?.includes('Login failed')) {
        throw new Error('Username atau password salah');
      } else {
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);

      // Choose authentication service based on configuration
      if (config.USE_STANDALONE_API) {
        await standaloneAuthService.logout();
      } else {
        await authService.logout();
      }

      // Clear all stored data
      await AsyncStorage.multiRemove([
        AUTH_TOKEN_KEY,
        USER_DATA_KEY,
        '@PawSmart:cartItems',
        '@PawSmart:odooCredentials',
        '@PawSmart:adminCredentials',
      ]);

      // Update state
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      // Even if logout fails on the server, clear local state
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: { username: string; password: string; email: string; name: string; phone?: string }) => {
    try {
      setIsLoading(true);

      // Choose authentication service based on configuration
      if (config.USE_STANDALONE_API) {
        // Use Standalone API (JWT)
        const response = await standaloneAuthService.register({
          username: userData.username,
          email: userData.email,
          password: userData.password,
          name: userData.name,
          phone: userData.phone || '',
        });

        setIsAuthenticated(true);
        setUser(response.user);
      } else {
        // Use Odoo API
        const response = await authService.register(userData);

        setIsAuthenticated(true);
        setUser(response.user);

        // Store token and user data for Odoo
        if (response.access_token) {
          await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.access_token);
        }
        if (response.user) {
          await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(response.user));
        }
      }
    } catch (error: any) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithSocial = async (provider: SocialProvider, socialData?: any) => {
    try {
      setIsLoading(true);

      let socialResponse: SocialAuthResponse;

      if (provider === 'google') {
        socialResponse = await socialAuthService.signInWithGoogle();
      } else if (provider === 'facebook') {
        socialResponse = await socialAuthService.signInWithFacebook();
      } else if (provider === 'apple') {
        if (!socialData) {
          throw new Error('Data Apple Sign In tidak tersedia');
        }
        socialResponse = {
          provider: 'apple',
          accessToken: socialData.identityToken || '',
          user: {
            id: socialData.user,
            name: socialData.fullName ? `${socialData.fullName.givenName || ''} ${socialData.fullName.familyName || ''}`.trim() : undefined,
            email: socialData.email,
          },
        };
      } else {
        throw new Error('Provider tidak didukung');
      }

      // Choose authentication service based on configuration
      if (config.USE_STANDALONE_API) {
        // Use Standalone API (JWT)
        const response = await standaloneAuthService.socialLogin(provider, {
          provider,
          access_token: socialResponse.accessToken,
          id_token: socialResponse.idToken,
          email: socialResponse.user.email,
          name: socialResponse.user.name,
        });

        setIsAuthenticated(true);
        setUser(response.user);
      } else {
        // Use Odoo API
        try {
          const response = await authService.loginWithSocial({
            provider: provider,
            socialId: socialResponse.user.id,
            accessToken: socialResponse.accessToken,
            idToken: socialResponse.idToken,
            email: socialResponse.user.email,
            name: socialResponse.user.name,
            avatar: socialResponse.user.picture,
          });

          setIsAuthenticated(true);
          setUser(response.user);

          if (response.access_token) {
            await AsyncStorage.setItem('@PawSmart:authToken', response.access_token);
          }

        } catch (error: any) {
          // Fallback: create local user if Odoo fails
          const fallbackUser: User = {
            id: parseInt(socialResponse.user.id) || Date.now(),
            username: socialResponse.user.email?.split('@')[0] || `${provider}_user_${Date.now()}`,
            name: socialResponse.user.name || 'User',
            email: socialResponse.user.email || '',
            phone: '',
            provider: provider,
            avatar: socialResponse.user.picture,
          } as AuthUser;

          await AsyncStorage.setItem(AUTH_TOKEN_KEY, socialResponse.accessToken);
          await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(fallbackUser));

          setIsAuthenticated(true);
          setUser(fallbackUser);
        }
      }

    } catch (error: any) {
      if (error.message === 'LOGIN_CANCELLED') {
        return;
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithSocial = async (provider: SocialProvider, socialData?: any) => {
    // For now, delegate to loginWithSocial as registration is handled by the backend
    await loginWithSocial(provider, socialData);
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    try {
      setIsLoading(true);

      if (config.USE_STANDALONE_API) {
        await standaloneAuthService.changePassword({
          current_password: oldPassword,
          new_password: newPassword,
        });
      } else {
        // Use Odoo API - need user ID for this
        if (!user || !('id' in user)) {
          throw new Error('User not found');
        }
        await authService.changePassword(user.id, oldPassword, newPassword);
      }
    } catch (error: any) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      setIsLoading(true);

      if (config.USE_STANDALONE_API) {
        await standaloneAuthService.forgotPassword(email);
      } else {
        // Odoo doesn't have a direct forgot password endpoint in this setup
        // You might need to implement custom logic or use a different approach
        throw new Error('Password reset not available for Odoo backend');
      }
    } catch (error: any) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      setIsLoading(true);

      if (config.USE_STANDALONE_API) {
        await standaloneAuthService.resetPassword({
          token,
          password: newPassword,
        });
      } else {
        throw new Error('Password reset not available for Odoo backend');
      }
    } catch (error: any) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        isLoading,
        login,
        loginWithSocial,
        logout,
        checkAuthStatus,
        setUser,
        register,
        registerWithSocial,
        changePassword,
        forgotPassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};