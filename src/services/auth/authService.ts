import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import apiClient from '../api/apiClient';
import { API_ENDPOINTS } from '../config/api.config';
import whatsappService from '../whatsapp/whatsappService';
import config from '../../config/environment';

// Storage keys
const AUTH_TOKEN_KEY = config.STORAGE_KEYS.AUTH_TOKEN;
const REFRESH_TOKEN_KEY = config.STORAGE_KEYS.REFRESH_TOKEN;
const USER_DATA_KEY = config.STORAGE_KEYS.USER_DATA;

export interface LoginCredentials {
  username: string;
  password: string;
  database?: string; // Odoo database name if multiple databases
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
  expires_in: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  partner_id?: number; // Odoo partner ID
  company_id?: number;
  image?: string;
  phone?: string;
  provider?: string; // Social login provider
  avatar?: string; // Avatar URL from social provider
}

class AuthService {
  /**
   * Login user (separate from API authentication)
   * This creates a user session but uses admin credentials for API calls
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      // Authenticate user credentials to verify they exist
      const userAuth = await this.verifyUserCredentials(credentials);
      
      // Create user session
      return await this.createUserSession(userAuth);
    } catch (error: any) {
      // Show debug alert in development mode for APK testing
      if (config.DEBUG === 'true' || __DEV__) {
        let debugMessage = `Authentication Error:\n\n`;
        debugMessage += `Message: ${error.message}\n`;
        debugMessage += `Code: ${error.code || 'Unknown'}\n`;
        debugMessage += `Username: ${credentials.username}\n`;
        debugMessage += `Database: ${credentials.database || config.ODOO.DATABASE}\n`;

        Alert.alert(
          'Login Debug Info',
          debugMessage,
          [{ text: 'OK' }]
        );
      }

      // Check if it's a network error
      if (error.message?.includes('Network') ||
          error.message?.includes('fetch') ||
          error.message?.includes('ECONNREFUSED') ||
          error.message?.includes('ETIMEDOUT') ||
          error.code === 'NETWORK_ERROR') {
        throw new Error('Network connection failed. Please check your internet connection.');
      }

      // For authentication errors, be specific
      if (error.message?.includes('Invalid username') ||
          error.message?.includes('Invalid password')) {
        throw new Error('Invalid username or password');
      }

      throw new Error(error.message || 'Login failed');
    }
  }

  /**
   * Logout and clear session
   */
  // Social login method
  async loginWithSocial(socialData: {
    provider: string;
    socialId: string;
    accessToken: string;
    idToken?: string;
    email?: string;
    name?: string;
    avatar?: string;
  }): Promise<LoginResponse> {
    try {
      // Call Odoo API to create or login social user
      const response = await apiClient.odooExecute('res.users', 'social_login', [], {
        provider: socialData.provider,
        social_id: socialData.socialId,
        access_token: socialData.accessToken,
        email: socialData.email,
        name: socialData.name,
        avatar: socialData.avatar,
      });

      if (response && response.user) {
        const user: User = {
          id: response.user.id,
          username: response.user.login || response.user.email?.split('@')[0] || '',
          name: response.user.name,
          email: response.user.email,
          phone: response.user.phone || '',
          provider: socialData.provider,
          avatar: socialData.avatar,
        };

        // Store user data
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
        if (response.access_token) {
          await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.access_token);
        }

        return {
          access_token: response.access_token || socialData.accessToken,
          refresh_token: response.refresh_token || '',
          user: user,
          expires_in: response.expires_in || 3600,
        };
      } else {
        throw new Error('Invalid response from Odoo social login');
      }
    } catch (error: any) {
      console.error('Odoo social login error:', error);
      throw new Error(`Social login failed: ${error.message}`);
    }
  }

  async logout(): Promise<void> {
    try {
      // Odoo doesn't have a logout endpoint for JSON-RPC
      // Just clear the session locally
      } catch (error) {
      } finally {
      // Always clear local storage
      await this.clearAuthData();
    }
  }

  /**
   * Verify current token validity
   */
  async verifyToken(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) return false;

      // For Odoo, we check if we have a valid uid in session
      // Instead of a dedicated verify endpoint, we can try a simple API call
      const userData = await AsyncStorage.getItem(USER_DATA_KEY);
      if (!userData) return false;
      
      // Try to get user info as a verification method
      try {
        const user = JSON.parse(userData);
        if (user && user.id) {
          // Check if we can make a simple API call
          await apiClient.odooExecute(
            'res.partner',
            'search_count',
            [[['id', '=', user.partner_id || user.id]]]
          );
          return true;
        }
      } catch (apiError) {
        return false;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current user data
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(USER_DATA_KEY);
      if (!userData) return null;
      
      return JSON.parse(userData);
    } catch (error) {
      return null;
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<LoginResponse | null> {
    try {
      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) return null;

      const response = await apiClient.post<LoginResponse>(
        API_ENDPOINTS.AUTH.REFRESH,
        { refresh_token: refreshToken }
      );

      await this.storeAuthData(response);
      return response;
    } catch (error) {
      await this.clearAuthData();
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    return !!token;
  }

  /**
   * Store authentication data
   */
  private async storeAuthData(response: LoginResponse): Promise<void> {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.access_token);
    if (response.refresh_token) {
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);
    }
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(response.user));
    
    // Set the authorization header for future requests
    apiClient.setHeader('Authorization', `Bearer ${response.access_token}`);
  }

  /**
   * Clear authentication data
   */
  private async clearAuthData(): Promise<void> {
    await AsyncStorage.multiRemove([
      AUTH_TOKEN_KEY,
      REFRESH_TOKEN_KEY,
      USER_DATA_KEY,
    ]);
    
    // Clear Odoo credentials
    await apiClient.clearOdooCredentials();
    
    // Remove the authorization header
    apiClient.removeHeader('Authorization');
  }

  /**
   * Get list of available databases from Odoo server
   */
  async getOdooDatabases(): Promise<string[]> {
    try {
      const databases = await apiClient.jsonRpc('db', 'list', []);
      return databases || [];
    } catch (error: any) {
      return [];
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: number, profileData: {
    name?: string;
    email?: string;
    phone?: string;
  }): Promise<User> {
    try {
      // Use admin credentials for API call
      await apiClient.authenticateAdmin();
      
      // Prepare update data for user
      const userUpdateData: any = {};
      if (profileData.name) userUpdateData.name = profileData.name;
      if (profileData.email) userUpdateData.email = profileData.email;
      
      // Update user in Odoo (name and email)
      if (Object.keys(userUpdateData).length > 0) {
        await apiClient.odooExecute(
          'res.users',
          'write',
          [[userId], userUpdateData]
        );
      }
      
      // Get user's partner_id to update phone
      const userInfo = await apiClient.odooExecute(
        'res.users',
        'read',
        [[userId]],
        { fields: ['partner_id'] }
      );
      
      const partnerId = userInfo[0]?.partner_id?.[0];
      
      // Update phone number on partner record
      if (partnerId && profileData.phone !== undefined) {
        await apiClient.odooExecute(
          'res.partner',
          'write',
          [[partnerId], { phone: profileData.phone }]
        );
      }
      
      // Get updated user info with all fields
      const updatedUserInfo = await apiClient.odooExecute(
        'res.users',
        'read',
        [[userId]],
        { fields: ['name', 'email', 'partner_id', 'company_id', 'image_1920', 'login'] }
      );
      
      // Get partner info for phone
      let phone = '';
      if (partnerId) {
        const partnerInfo = await apiClient.odooExecute(
          'res.partner',
          'read',
          [[partnerId]],
          { fields: ['phone'] }
        );
        phone = partnerInfo[0]?.phone || '';
      }
      
      const user: User = {
        id: userId,
        username: updatedUserInfo[0]?.login || '',
        email: updatedUserInfo[0]?.email || '',
        name: updatedUserInfo[0]?.name || '',
        partner_id: partnerId || 0,
        company_id: updatedUserInfo[0]?.company_id?.[0],
        image: updatedUserInfo[0]?.image_1920,
        phone: phone,
      };
      
      // Update stored user data
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
      
      return user;
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      throw new Error(error.message || 'Failed to update profile');
    }
  }

  /**
   * Check if username is available
   */
  async checkUsernameAvailability(username: string): Promise<boolean> {
    try {
      await apiClient.authenticateAdmin();
      
      const existingUsers = await apiClient.odooExecute(
        'res.users',
        'search_count',
        [[['login', '=', username]]]
      );
      
      return existingUsers === 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if email is already registered
   */
  async checkEmailAvailability(email: string): Promise<boolean> {
    try {
      await apiClient.authenticateAdmin();
      
      const existingUsers = await apiClient.odooExecute(
        'res.users',
        'search_count',
        [[['email', '=', email]]]
      );
      
      return existingUsers === 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if phone number is registered
   */
  async checkPhoneNumberRegistered(phoneNumber: string): Promise<boolean> {
    try {
      await apiClient.authenticateAdmin();
      
      // Clean phone number (remove spaces, dashes, etc.)
      const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
      
      // Check with different formats
      const phoneVariations = [
        cleanPhone,
        cleanPhone.startsWith('0') ? cleanPhone : '0' + cleanPhone,
        cleanPhone.startsWith('62') ? cleanPhone : '62' + cleanPhone.substring(cleanPhone.startsWith('0') ? 1 : 0),
      ];
      
      // Search for users with any of these phone number variations in Odoo
      const existingUsers = await apiClient.odooExecute(
        'res.partner',
        'search_count',
        [[['phone', 'in', phoneVariations]]]
      );
      
      console.log(`Phone number ${phoneNumber} check result: ${existingUsers > 0 ? 'registered' : 'not registered'}`);
      return existingUsers > 0;
    } catch (error) {
      console.error('Error checking phone registration in Odoo:', error);
      throw new Error('Failed to verify phone number registration. Please check your connection and try again.');
    }
  }

  /**
   * Generate OTP for phone verification
   */
  async generateOTP(phoneNumber: string): Promise<string> {
    try {
      // Ensure admin authentication for any required API calls
      await apiClient.authenticateAdmin();
      
      // Generate a random 4-digit OTP
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      
      // Store OTP in Odoo instead of local storage for production
      // Create a temporary record in a custom OTP model or use existing mechanism
      const otpData = {
        otp,
        phoneNumber,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      };
      
      // For now, store locally but log for debugging
      await AsyncStorage.setItem(`@PawSmart:otp:${phoneNumber}`, JSON.stringify(otpData));
      console.log(`Generated OTP for ${phoneNumber}: ${otp} (expires in 5 minutes)`);
      
      // Send OTP via WhatsApp service
      const messageSent = await whatsappService.sendOTP(phoneNumber, otp);
      if (!messageSent) {
        throw new Error('Failed to send OTP via WhatsApp');
      }
      
      return otp;
    } catch (error: any) {
      console.error('Error generating OTP:', error);
      throw new Error(error.message || 'Failed to generate and send OTP');
    }
  }

  /**
   * Send WhatsApp message
   */
  async sendWhatsAppMessage(phoneNumber: string, otpCode: string): Promise<boolean> {
    try {
      return await whatsappService.sendOTP(phoneNumber, otpCode);
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error);
      return false;
    }
  }

  /**
   * Verify OTP code
   */
  async verifyOTP(data: {
    phoneNumber: string;
    otp: string;
    registrationData?: {
      username: string;
      password: string;
      email: string;
      name: string;
      phone: string;
    };
  }): Promise<{ success: boolean; message?: string }> {
    try {
      console.log(`Verifying OTP for phone number: ${data.phoneNumber}`);
      
      // Retrieve stored OTP
      const storedData = await AsyncStorage.getItem(`@PawSmart:otp:${data.phoneNumber}`);
      
      if (!storedData) {
        console.log('OTP not found or expired');
        return { success: false, message: 'OTP expired or not found' };
      }
      
      const otpData = JSON.parse(storedData);
      
      // Check if OTP is expired
      if (Date.now() > otpData.expiresAt) {
        await AsyncStorage.removeItem(`@PawSmart:otp:${data.phoneNumber}`);
        console.log('OTP has expired');
        return { success: false, message: 'OTP has expired' };
      }
      
      // Verify OTP
      if (otpData.otp !== data.otp) {
        console.log('Invalid OTP code provided');
        return { success: false, message: 'Invalid OTP code' };
      }
      
      console.log('OTP verified successfully');
      
      // If OTP is valid and we have registration data, complete registration in Odoo
      if (data.registrationData) {
        console.log('Completing user registration in Odoo...');
        await this.register(data.registrationData);
      }
      
      // Clear OTP after successful verification
      await AsyncStorage.removeItem(`@PawSmart:otp:${data.phoneNumber}`);
      
      return { success: true };
    } catch (error: any) {
      console.error('OTP verification error:', error);
      return { success: false, message: error.message || 'OTP verification failed' };
    }
  }

  /**
   * Change user password (requires old password verification)
   */
  async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<boolean> {
    try {
      // First verify the old password is correct
      const userInfo = await apiClient.odooExecute(
        'res.users',
        'read',
        [[userId]],
        { fields: ['login'] }
      );
      
      if (!userInfo || userInfo.length === 0) {
        throw new Error('User not found');
      }
      
      const username = userInfo[0].login;
      
      // Get available databases
      const availableDatabases = await this.getOdooDatabases();
      let database = config.ODOO.DATABASE;
      
      if (!database || (availableDatabases.length > 0 && !availableDatabases.includes(database))) {
        if (availableDatabases.length > 0) {
          database = availableDatabases[0];
        } else {
          throw new Error('No databases available');
        }
      }
      
      // Try to authenticate with old password to verify it's correct
      const authResult = await apiClient.jsonRpc(
        'common',
        'authenticate',
        [
          database,
          username,
          oldPassword,
          {}
        ]
      );
      
      if (!authResult) {
        throw new Error('Password lama tidak sesuai');
      }
      
      // Old password is correct, now update to new password
      // Use admin credentials to update the password
      await apiClient.authenticateAdmin();
      
      const result = await apiClient.odooExecute(
        'res.users',
        'write',
        [[userId], { password: newPassword }]
      );
      
      if (result) {
        console.log('Password successfully changed for user ID:', userId);
        
        // Get user's phone number to send confirmation
        const partnerInfo = await apiClient.odooExecute(
          'res.users',
          'read',
          [[userId]],
          { fields: ['partner_id'] }
        );
        
        if (partnerInfo[0]?.partner_id?.[0]) {
          const partner = await apiClient.odooExecute(
            'res.partner',
            'read',
            [[partnerInfo[0].partner_id[0]]],
            { fields: ['phone'] }
          );
          
          if (partner[0]?.phone) {
            // Send confirmation message via WhatsApp
            const message = `PawSmart - Password Berhasil Diubah\n\nPassword Anda telah berhasil diubah. Jika Anda tidak melakukan perubahan ini, segera hubungi customer service kami.`;
            await whatsappService.sendMessage({
              to: partner[0].phone,
              message: message,
            });
          }
        }
        
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Failed to change password:', error);
      if (error.message === 'Password lama tidak sesuai') {
        throw error;
      }
      throw new Error('Gagal mengubah password');
    }
  }

  /**
   * Reset user password
   */
  async resetPassword(phoneNumber: string, newPassword: string): Promise<boolean> {
    try {
      // Authenticate as admin to perform password reset
      console.log(`Resetting password for phone number: ${phoneNumber}`);
      await apiClient.authenticateAdmin();
      
      // Clean phone number
      const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
      
      // Find user by phone number
      // Try different phone formats
      const phoneVariations = [
        cleanPhone,
        cleanPhone.startsWith('0') ? cleanPhone : '0' + cleanPhone,
        cleanPhone.startsWith('62') ? cleanPhone : '62' + cleanPhone.substring(cleanPhone.startsWith('0') ? 1 : 0),
      ];
      
      // Search for partner with this phone number
      const partnerIds = await apiClient.odooExecute(
        'res.partner',
        'search',
        [[['phone', 'in', phoneVariations]]]
      );
      
      if (!partnerIds || partnerIds.length === 0) {
        throw new Error('User not found with this phone number');
      }
      
      // Get the user associated with this partner
      const userIds = await apiClient.odooExecute(
        'res.users',
        'search',
        [[['partner_id', '=', partnerIds[0]]]]
      );
      
      if (!userIds || userIds.length === 0) {
        throw new Error('No user account found for this phone number');
      }
      
      // Update the user's password
      const result = await apiClient.odooExecute(
        'res.users',
        'write',
        [[userIds[0]], { password: newPassword }]
      );
      
      if (result) {
        // Send confirmation message via WhatsApp
        const message = `PawSmart - Password Berhasil Diubah\n\nPassword Anda telah berhasil diubah. Silakan login dengan password baru Anda.\n\nJika Anda tidak melakukan perubahan ini, segera hubungi customer service kami.`;
        await whatsappService.sendMessage({
          to: phoneNumber,
          message: message,
        });
        
        console.log('Password successfully reset for user ID:', userIds[0]);
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Failed to reset password in Odoo:', error);
      
      // Handle specific network/connection errors
      if (error.message?.includes('Network') || 
          error.message?.includes('ECONNREFUSED') ||
          error.message?.includes('ETIMEDOUT') ||
          error.code === 'NETWORK_ERROR') {
        throw new Error('Cannot connect to server. Please check your internet connection and try again.');
      }
      
      // Handle user not found
      if (error.message?.includes('User not found') || error.message?.includes('No user account found')) {
        throw new Error('Phone number is not registered in our system.');
      }
      
      throw new Error(error.message || 'Failed to reset password. Please try again.');
    }
  }

  /**
   * Register a new user
   * Creates a user account in Odoo but uses admin credentials for API calls
   */
  async register(userData: {
    username: string;
    password: string;
    email: string;
    name: string;
    phone?: string;
  }): Promise<LoginResponse> {
    try {
      // First authenticate admin to create the user
      console.log('Registering new user in Odoo system...');
      await apiClient.authenticateAdmin();
      
      // Check if username already exists
      const existingUsersByUsername = await apiClient.odooExecute(
        'res.users',
        'search_read',
        [],
        {
          domain: [['login', '=', userData.username]],
          fields: ['id', 'login', 'email'],
          limit: 1
        }
      );
      
      if (existingUsersByUsername && existingUsersByUsername.length > 0) {
        throw new Error('Username sudah terdaftar. Silakan gunakan username lain.');
      }
      
      // Check if email already exists
      if (userData.email && !userData.email.includes('@petnexus.com')) {
        const existingUsersByEmail = await apiClient.odooExecute(
          'res.users',
          'search_read',
          [],
          {
            domain: [['email', '=', userData.email]],
            fields: ['id', 'login', 'email'],
            limit: 1
          }
        );
        
        if (existingUsersByEmail && existingUsersByEmail.length > 0) {
          throw new Error('Email sudah terdaftar. Silakan gunakan email lain atau login dengan akun yang sudah ada.');
        }
      }
      
      // Check if phone number already exists
      if (userData.phone) {
        const cleanPhone = userData.phone.replace(/[\s\-\(\)]/g, '');
        const phoneVariations = [
          cleanPhone,
          cleanPhone.startsWith('0') ? cleanPhone : '0' + cleanPhone,
          cleanPhone.startsWith('62') ? cleanPhone : '62' + cleanPhone.substring(cleanPhone.startsWith('0') ? 1 : 0),
        ];
        
        const existingPartnersByPhone = await apiClient.odooExecute(
          'res.partner',
          'search_count',
          [[['phone', 'in', phoneVariations]]]
        );
        
        if (existingPartnersByPhone > 0) {
          throw new Error('Nomor WhatsApp sudah terdaftar. Silakan gunakan nomor lain atau login dengan akun yang sudah ada.');
        }
      }
      
      // Create new user in Odoo
      const userId = await apiClient.odooExecute(
        'res.users',
        'create',
        [{
          login: userData.username,
          password: userData.password,
          name: userData.name,
          email: userData.email,
          // Add user to portal group for customer access
          groups_id: [[6, 0, []]],
        }]
      );
      
      // Update partner's phone number if provided
      if (userData.phone) {
        const userInfo = await apiClient.odooExecute(
          'res.users',
          'read',
          [[userId]],
          { fields: ['partner_id'] }
        );
        
        const partnerId = userInfo[0]?.partner_id?.[0];
        if (partnerId) {
          await apiClient.odooExecute(
            'res.partner',
            'write',
            [[partnerId], { phone: userData.phone }]
          );
        }
      }
      
      // Get created user info
      const userInfo = await apiClient.odooExecute(
        'res.users',
        'read',
        [[userId]],
        { fields: ['name', 'email', 'partner_id', 'company_id', 'image_1920', 'login'] }
      );
      
      // Create user session
      const user: User = {
        id: userId,
        username: userData.username,
        email: userData.email,
        name: userData.name,
        partner_id: userInfo[0]?.partner_id?.[0] || 0,
        company_id: userInfo[0]?.company_id?.[0],
        image: userInfo[0]?.image_1920,
        phone: userData.phone,
      };
      
      const response: LoginResponse = {
        access_token: `user_${userId}`,
        refresh_token: '',
        user,
        expires_in: 3600,
      };
      
      // Log successful registration for debugging
      console.log(`User successfully registered in Odoo with ID: ${userId}`);
      if (userData.phone) {
        console.log(`Phone number ${userData.phone} is now registered in Odoo system`);
      }
      
      await this.storeAuthData(response);
      return response;
    } catch (error: any) {
      console.error('Registration failed:', error);
      
      // Handle specific network/connection errors
      if (error.message?.includes('Network') || 
          error.message?.includes('ECONNREFUSED') ||
          error.message?.includes('ETIMEDOUT') ||
          error.code === 'NETWORK_ERROR') {
        throw new Error('Cannot connect to server. Please check your internet connection and try again.');
      }
      
      // Handle Odoo authentication errors
      if (error.message?.includes('authenticate') || error.message?.includes('login')) {
        throw new Error('Server authentication failed. Please try again later.');
      }
      
      throw new Error(error.message || 'Registration failed. Please try again.');
    }
  }
  
  /**
   * Verify user credentials (for login)
   * Checks if user exists and password is correct
   */
  private async verifyUserCredentials(credentials: LoginCredentials): Promise<any> {
    try {
      // Get database from credentials or environment
      let database = credentials.database || config.ODOO.DATABASE;
      
      // Try to get available databases, but don't fail if server is unavailable
      try {
        const availableDatabases = await this.getOdooDatabases();
        if (availableDatabases.length > 0 && !availableDatabases.includes(database)) {
          database = availableDatabases[0];
        }
      } catch (error) {
        // If we can't get databases, use the configured one
        console.log('Could not fetch Odoo databases, using configured database:', database);
      }
      
      // Try to authenticate user (just to verify credentials)
      const authResult = await apiClient.jsonRpc(
        'common',
        'authenticate',
        [
          database,
          credentials.username,
          credentials.password,
          {}
        ]
      );
      
      if (!authResult) {
        // Authentication failed - wrong username or password
        throw new Error('Invalid username or password');
      }
      
      // Get user info
      const userInfo = await apiClient.jsonRpc(
        'object',
        'execute_kw',
        [
          database,
          authResult,
          credentials.password,
          'res.users',
          'read',
          [authResult],
          { fields: ['name', 'email', 'partner_id', 'company_id', 'image_1920', 'login'] }
        ]
      );
      
      return {
        uid: authResult,
        database,
        userInfo: userInfo[0],
        username: credentials.username
      };
    } catch (error: any) {
      // Re-throw the error so it propagates up
      throw error;
    }
  }
  
  /**
   * Create user session after successful verification
   * User session is separate from API authentication
   */
  private async createUserSession(userAuth: any): Promise<LoginResponse> {
    // Transform to our User format
    const user: User = {
      id: userAuth.uid,
      username: userAuth.username,
      email: userAuth.userInfo?.email || '',
      name: userAuth.userInfo?.name || userAuth.username,
      partner_id: userAuth.userInfo?.partner_id?.[0] || 0,
      company_id: userAuth.userInfo?.company_id?.[0],
      image: userAuth.userInfo?.image_1920,
    };
    
    // Create response with user token (not used for API calls)
    const response: LoginResponse = {
      access_token: `user_${userAuth.uid}`,
      refresh_token: '',
      user,
      expires_in: 3600,
    };
    
    // Store user session data
    await this.storeAuthData(response);
    
    // Ensure admin is authenticated for subsequent API calls
    await apiClient.authenticateAdmin();
    
    return response;
  }
  
  /**
   * Login using Odoo JSON-RPC (alternative method)
   * This is specific to Odoo's authentication mechanism
   * @deprecated Use login() instead for user authentication
   */
  async odooAuthenticate(credentials: LoginCredentials): Promise<any> {
    try {
      // Get database from credentials or environment
      let database = credentials.database || config.ODOO.DATABASE;
      
      // Try to get available databases, but don't fail if server is unavailable
      try {
        const availableDatabases = await this.getOdooDatabases();
        if (availableDatabases.length > 0 && !availableDatabases.includes(database)) {
          database = availableDatabases[0];
        }
      } catch (error) {
        // If we can't get databases, use the configured one
        console.log('Could not fetch Odoo databases, using configured database:', database);
      }

      // Simply authenticate with username/password
      const authResult = await apiClient.jsonRpc(
        'common',
        'authenticate',
        [
          database,
          credentials.username,
          credentials.password,
          {}
        ]
      );

      if (!authResult) {
        // Check if we can get version info to verify connection
        try {
          const version = await apiClient.jsonRpc('common', 'version', []);
          } catch (versionError) {
          }
        
        throw new Error('Invalid username or password');
      }
      let authPassword = credentials.password;
      let authUsername = credentials.username;

      // Get user info using the authenticated uid
      const userInfo = await apiClient.jsonRpc(
        'object',
        'execute_kw',
        [
          database,
          authResult,
          authPassword,
          'res.users',
          'read',
          [authResult],
          { fields: ['name', 'email', 'partner_id', 'company_id', 'image_1920', 'login'] }
        ]
      );

      // Transform to our User format
      const user: User = {
        id: authResult,
        username: userInfo[0]?.login || authUsername,
        email: userInfo[0]?.email || '',
        name: userInfo[0]?.name || authUsername,
        partner_id: userInfo[0]?.partner_id?.[0] || 0,
        company_id: userInfo[0]?.company_id?.[0],
        image: userInfo[0]?.image_1920,
      };

      // Create response compatible with our format
      // Store password temporarily for subsequent API calls (Odoo requires it for each call)
      const response: LoginResponse = {
        access_token: `${authResult}:${authPassword}`, // uid:password for Odoo auth
        refresh_token: '', // Odoo doesn't provide refresh tokens by default
        user,
        expires_in: 3600, // Default session timeout
      };

      // Store Odoo credentials for subsequent API calls
      await apiClient.storeOdooCredentials(authResult, authPassword, database);
      
      await this.storeAuthData(response);
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Authentication failed');
    }
  }
}

export default new AuthService();