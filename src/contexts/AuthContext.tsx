import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService, { User as AuthUser } from '../services/auth/authService';
import socialAuthService from '../services/auth/socialAuthService';
import { SocialAuthResponse, SocialProvider } from '../types/socialAuth';
import config from '../config/environment';

// Use the User type from authService
type User = AuthUser;

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
      
      // First check if we have a stored user
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
      
      // If we have an API key configured, we don't need password
      // The API key will be used automatically
      if (config.ODOO.API_KEY) {
        // API key authentication will be handled by authService
      }
      
      // Use configured username if available and no username provided
      const finalUsername = username || config.ODOO.USERNAME || '';
      
      // Use the auth service to login
      // The auth service will automatically try API key if available
      const response = await authService.login({
        username: finalUsername,
        password: password || config.ODOO.PASSWORD || '', // Use config password if none provided
        database: config.ODOO.DATABASE,
      });

      // Update state with the user from the response
      setIsAuthenticated(true);
      setUser(response.user);
      
    } catch (error: any) {
      // Check for network errors
      if (error.message?.includes('Network') || 
          error.message?.includes('fetch') || 
          error.message?.includes('ECONNREFUSED') ||
          error.message?.includes('ETIMEDOUT') ||
          error.message?.includes('Failed to fetch')) {
        // Server is unavailable
        throw new Error('Server tidak tersedia. Silakan coba lagi nanti.');
      } else if (error.message?.includes('Invalid username') || 
                 error.message?.includes('Invalid password') ||
                 error.message?.includes('Login failed')) {
        // Wrong credentials
        throw new Error('Username atau password salah');
      } else {
        // Other errors
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Use the auth service to logout
      await authService.logout();
      
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
      
      // Use the auth service to register
      const response = await authService.register(userData);
      
      // Update state with the user from the response
      setIsAuthenticated(true);
      setUser(response.user);
      
      // Store token and user data
      if (response.access_token) {
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.access_token);
      }
      if (response.user) {
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(response.user));
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
        // For Apple, we'll pass the credential data from the component
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
      
      // Send social auth data to Odoo backend for user creation/login
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

        // Update state with the user from Odoo
        setIsAuthenticated(true);
        setUser(response.user);
        
        // Store auth token
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
        };
        
        // Store token and user data locally
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, socialResponse.accessToken);
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(fallbackUser));
        
        // Update state
        setIsAuthenticated(true);
        setUser(fallbackUser);
        
      }
      
    } catch (error: any) {
      if (error.message === 'LOGIN_CANCELLED') {
        // User cancelled, don't show error
        return;
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithSocial = async (provider: SocialProvider, socialData?: any) => {
    try {
      setIsLoading(true);
      
      let socialResponse: SocialAuthResponse;
      
      if (provider === 'google') {
        socialResponse = await socialAuthService.signInWithGoogle();
      } else if (provider === 'facebook') {
        socialResponse = await socialAuthService.signInWithFacebook();
      } else if (provider === 'apple') {
        // For Apple, we'll pass the credential data from the component
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
      
      // Here you would typically send the social auth data to your backend for registration
      // For now, we'll create a mock user based on social data
      const mockUser: User = {
        id: parseInt(socialResponse.user.id) || Date.now(),
        username: socialResponse.user.email?.split('@')[0] || `${provider}_user_${Date.now()}`,
        name: socialResponse.user.name || 'User',
        email: socialResponse.user.email || '',
        phone: '',
        provider: provider,
        avatar: socialResponse.user.picture,
      };
      
      // Store token and user data
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, socialResponse.accessToken);
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(mockUser));
      
      // Update state
      setIsAuthenticated(true);
      setUser(mockUser);
      
    } catch (error: any) {
      if (error.message === 'LOGIN_CANCELLED') {
        // User cancelled, don't show error
        return;
      }
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};