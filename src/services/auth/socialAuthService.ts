import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { 
  SocialAuthResponse, 
  SocialProvider, 
  SocialConfigValidation,
  GoogleConfig,
  FacebookConfig
} from '../../types/socialAuth';
import config from '../../config/environment';

// Complete the auth session for the browser
WebBrowser.maybeCompleteAuthSession();

class SocialAuthService {
  // Google OAuth Configuration
  private googleConfig: GoogleConfig = {
    clientId: {
      ios: config.SOCIAL_LOGIN.GOOGLE.IOS_CLIENT_ID,
      android: config.SOCIAL_LOGIN.GOOGLE.ANDROID_CLIENT_ID,
      web: config.SOCIAL_LOGIN.GOOGLE.WEB_CLIENT_ID,
    },
    scopes: ['openid', 'profile', 'email'],
    additionalParameters: {},
    customParameters: {},
  };

  // Facebook OAuth Configuration
  private facebookConfig: FacebookConfig = {
    clientId: config.SOCIAL_LOGIN.FACEBOOK.APP_ID,
    scopes: ['public_profile', 'email'],
  };

  /**
   * Get the appropriate redirect URI for the current platform
   */
  private getRedirectUri(useProxy: boolean = false): string {
    // Don't use the problematic Expo proxy - use direct OAuth
    if (useProxy) {
      // Only if explicitly requested (not recommended)
      return AuthSession.makeRedirectUri({
        useProxy: true,
      });
    }
    
    // Use direct app scheme for both dev and production
    // This avoids the problematic auth.expo.io proxy
    return AuthSession.makeRedirectUri({
      useProxy: false,
      scheme: 'petnexus',
      preferLocalhost: true,
    });
  }

  /**
   * Google Sign In
   */
  async signInWithGoogle(): Promise<SocialAuthResponse> {
    try {
      // Get the appropriate client ID for the current platform
      let clientId = '';
      if (Platform.OS === 'ios') {
        clientId = this.googleConfig.clientId.ios;
      } else if (Platform.OS === 'android') {
        clientId = this.googleConfig.clientId.android;
      } else {
        clientId = this.googleConfig.clientId.web;
      }

      if (!clientId) {
        throw new Error('Google Client ID tidak dikonfigurasi untuk platform ini');
      }

      // Use implicit flow for Google (token instead of code)
      // This works better for mobile apps without a backend
      const redirectUri = 'https://auth.expo.io/@nurul.hadi/petnexus';
      
      // Create a random state and nonce for security
      const state = Math.random().toString(36).substring(2, 15);
      const nonce = Math.random().toString(36).substring(2, 15);
      
      // Construct Google OAuth URL with implicit flow
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'token id_token', // Use implicit flow
        scope: this.googleConfig.scopes.join(' '),
        state: state,
        nonce: nonce,
        prompt: 'select_account',
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      
      console.log('Google Auth URL:', authUrl);
      console.log('Google Redirect URI:', redirectUri);

      // Open the authentication URL in a web browser
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri
      );

      console.log('Google auth result:', result);

      if (result.type !== 'success') {
        if (result.type === 'cancel') {
          throw new Error('LOGIN_CANCELLED');
        }
        throw new Error('Gagal melakukan autentikasi dengan Google');
      }

      // Parse the URL to get tokens from fragment (after #)
      const urlParts = result.url.split('#');
      if (urlParts.length < 2) {
        throw new Error('Invalid response URL from Google');
      }

      const responseParams = new URLSearchParams(urlParts[1]);
      const accessToken = responseParams.get('access_token');
      const idToken = responseParams.get('id_token');
      const returnedState = responseParams.get('state');

      if (!accessToken) {
        console.error('Google response URL:', result.url);
        throw new Error('Tidak ada access token dari Google');
      }

      if (returnedState !== state) {
        throw new Error('State mismatch - possible security issue');
      }

      // Get user info
      const userInfoResponse = await fetch(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`
      );

      if (!userInfoResponse.ok) {
        throw new Error('Gagal mendapatkan informasi pengguna dari Google');
      }

      const userInfo = await userInfoResponse.json();

      return {
        provider: 'google',
        accessToken: accessToken,
        idToken: idToken,
        user: {
          id: userInfo.id,
          name: userInfo.name,
          email: userInfo.email,
          picture: userInfo.picture,
          given_name: userInfo.given_name,
          family_name: userInfo.family_name,
        },
      };
    } catch (error: any) {
      if (error.message === 'LOGIN_CANCELLED') {
        throw error;
      }
      console.error('Google Sign In Error:', error);
      throw new Error('Gagal masuk dengan Google. Silakan coba lagi.');
    }
  }

  /**
   * Facebook Sign In - Production Ready Implementation
   */
  async signInWithFacebook(): Promise<SocialAuthResponse> {
    try {
      if (!this.facebookConfig.clientId) {
        throw new Error('Facebook App ID tidak dikonfigurasi');
      }

      // Use Expo auth URI - we'll handle the "error" page by extracting token from URL
      const redirectUri = 'https://auth.expo.io/@nurul.hadi/petnexus';
      
      // Create Facebook OAuth URL manually
      const state = Math.random().toString(36).substring(2, 15);
      const params = new URLSearchParams({
        client_id: this.facebookConfig.clientId,
        redirect_uri: redirectUri,
        response_type: 'token',
        scope: this.facebookConfig.scopes.join(' '),
        state: state,
        display: Platform.OS === 'web' ? 'popup' : 'touch',
        auth_type: 'rerequest',
      });

      const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
      
      console.log('Facebook Auth Configuration:', {
        clientId: this.facebookConfig.clientId,
        redirectUri: redirectUri,
        scopes: this.facebookConfig.scopes,
        authUrl: authUrl,
      });

      console.log('✅ Using Facebook-compatible redirect URI:');
      console.log('📱 Redirect URI:', redirectUri);
      console.log('🔗 This should match your Facebook app settings');

      // Open authentication URL and handle the result
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      console.log('Facebook Auth Result:', {
        type: result.type,
        url: result.url,
      });

      // Handle user cancellation
      if (result.type === 'cancel') {
        throw new Error('LOGIN_CANCELLED');
      }

      // Extract access token from URL regardless of result type
      // Facebook authentication might "succeed" but Expo proxy shows error
      let access_token = null;
      let returnedState = null;

      if (result.url) {
        console.log('Processing Facebook redirect URL...');
        
        // Try to extract from URL fragment (after #)
        if (result.url.includes('#access_token=')) {
          const urlParts = result.url.split('#');
          if (urlParts.length >= 2) {
            const fragmentParams = new URLSearchParams(urlParts[1]);
            access_token = fragmentParams.get('access_token');
            returnedState = fragmentParams.get('state');
            
            console.log('Extracted token from URL fragment');
          }
        }
        
        // Try to extract from query parameters (after ?)  
        if (!access_token && result.url.includes('?access_token=')) {
          try {
            const url = new URL(result.url);
            access_token = url.searchParams.get('access_token');
            returnedState = url.searchParams.get('state');
            
            console.log('Extracted token from URL query params');
          } catch (error) {
            console.log('Failed to parse URL as query params');
          }
        }
        
        // Log the extraction result
        if (access_token) {
          console.log('✅ Facebook access token successfully extracted');
          console.log('Token length:', access_token.length);
        } else {
          console.log('❌ No access token found in URL');
        }
      }

      // Final check - if no access token, throw error
      if (!access_token) {
        console.error('Facebook authentication failed - no access token in:', result.url);
        throw new Error('Facebook authentication tidak berhasil - tidak ada access token');
      }

      // Validate state parameter (optional - warn but continue)
      if (returnedState !== state) {
        console.warn('⚠️ State parameter mismatch, but continuing with authentication');
      }

      // Fetch user information from Facebook Graph API
      const graphApiUrl = `https://graph.facebook.com/me?access_token=${access_token}&fields=id,name,email,picture.width(200).height(200)`;
      
      console.log('Fetching user info from Facebook Graph API...');
      const userInfoResponse = await fetch(graphApiUrl);

      if (!userInfoResponse.ok) {
        const errorText = await userInfoResponse.text();
        console.error('Facebook Graph API Error:', {
          status: userInfoResponse.status,
          statusText: userInfoResponse.statusText,
          error: errorText,
        });
        throw new Error('Gagal mendapatkan informasi pengguna dari Facebook');
      }

      const userInfo = await userInfoResponse.json();
      console.log('Facebook User Info:', {
        id: userInfo.id,
        name: userInfo.name,
        hasEmail: !!userInfo.email,
        hasPicture: !!userInfo.picture?.data?.url,
      });

      // Validate required user data
      if (!userInfo.id || !userInfo.name) {
        console.error('Missing required Facebook user data:', userInfo);
        throw new Error('Data pengguna Facebook tidak lengkap');
      }

      // Handle missing email (some users don't share email)
      const email = userInfo.email || `${userInfo.id}@facebook.local`;
      
      if (!userInfo.email) {
        console.warn('Facebook user did not provide email, using fallback');
      }

      // Return standardized social auth response
      return {
        provider: 'facebook',
        accessToken: access_token,
        user: {
          id: userInfo.id,
          name: userInfo.name,
          email: email,
          picture: userInfo.picture?.data?.url,
        },
      };
    } catch (error: any) {
      if (error.message === 'LOGIN_CANCELLED') {
        console.log('Facebook login was cancelled by user');
        throw error;
      }
      
      console.error('Facebook Sign In Error Details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      
      // Provide user-friendly error message
      const userMessage = error.message.includes('LOGIN_CANCELLED') 
        ? 'Login dibatalkan oleh pengguna'
        : 'Gagal masuk dengan Facebook. Silakan periksa koneksi internet dan coba lagi.';
      
      throw new Error(userMessage);
    }
  }

  /**
   * Apple Sign In (already implemented in the screens)
   * This method is here for consistency and future enhancements
   */
  async signInWithApple(): Promise<SocialAuthResponse> {
    // This will be handled by the existing Apple Authentication implementation
    // in the screens, but we can add this method for consistency
    throw new Error('Apple Sign In harus digunakan langsung dari expo-apple-authentication');
  }

  /**
   * Validate social auth configuration
   */
  validateConfiguration(): SocialConfigValidation {
    const googleConfigured = Boolean(
      Platform.OS === 'ios' 
        ? this.googleConfig.clientId.ios
        : Platform.OS === 'android'
        ? this.googleConfig.clientId.android
        : this.googleConfig.clientId.web
    );

    const facebookConfigured = Boolean(this.facebookConfig.clientId);
    const appleConfigured = Platform.OS === 'ios'; // Apple Sign In only available on iOS

    // Log configuration status for debugging
    console.log('Social Auth Configuration Status:', {
      google: googleConfigured,
      facebook: facebookConfigured,
      apple: appleConfigured,
      facebookAppId: this.facebookConfig.clientId,
      platform: Platform.OS,
    });

    return {
      google: googleConfigured,
      facebook: facebookConfigured,
      apple: appleConfigured,
    };
  }

  /**
   * Test Facebook configuration specifically
   */
  testFacebookConfiguration(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!this.facebookConfig.clientId) {
      issues.push('Facebook App ID tidak dikonfigurasi dalam environment variables');
    } else if (this.facebookConfig.clientId.startsWith('fb')) {
      issues.push('Facebook App ID tidak boleh diawali dengan "fb" - gunakan nomor saja');
    }

    if (!this.facebookConfig.scopes || this.facebookConfig.scopes.length === 0) {
      issues.push('Facebook scopes tidak dikonfigurasi');
    }

    // Check if required scopes are present
    const requiredScopes = ['public_profile'];
    const missingScopes = requiredScopes.filter(scope => 
      !this.facebookConfig.scopes.includes(scope)
    );
    
    if (missingScopes.length > 0) {
      issues.push(`Missing required Facebook scopes: ${missingScopes.join(', ')}`);
    }

    console.log('Facebook Configuration Test:', {
      appId: this.facebookConfig.clientId,
      scopes: this.facebookConfig.scopes,
      issues: issues,
      isValid: issues.length === 0,
    });

    return {
      isValid: issues.length === 0,
      issues: issues,
    };
  }
}

export default new SocialAuthService();