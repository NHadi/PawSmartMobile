// Social Authentication Types

export type SocialProvider = 'google' | 'facebook' | 'apple';

export interface SocialAuthUser {
  id: string;
  name?: string;
  email?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

export interface SocialAuthResponse {
  provider: SocialProvider;
  accessToken: string;
  idToken?: string;
  user: SocialAuthUser;
}

export interface SocialLoginConfig {
  google: GoogleConfig;
  facebook: FacebookConfig;
  apple: AppleConfig;
}

export interface GoogleConfig {
  clientId: {
    ios: string;
    android: string;
    web: string;
  };
  scopes: string[];
  additionalParameters: Record<string, string>;
  customParameters: Record<string, string>;
}

export interface FacebookConfig {
  clientId: string;
  scopes: string[];
}

export interface AppleConfig {
  // Apple Sign In doesn't require additional configuration
  // Configuration is handled by expo-apple-authentication
}

export interface SocialAuthError extends Error {
  code?: string;
  provider?: SocialProvider;
}

// Apple Sign In specific types (from expo-apple-authentication)
export interface AppleCredential {
  user: string;
  email?: string;
  identityToken?: string;
  authorizationCode?: string;
  realUserStatus?: number;
  state?: string;
  fullName?: {
    givenName?: string;
    familyName?: string;
    middleName?: string;
    namePrefix?: string;
    nameSuffix?: string;
    nickname?: string;
  };
}

// Configuration validation result
export interface SocialConfigValidation {
  google: boolean;
  facebook: boolean;
  apple: boolean;
}

// Social auth method parameters
export interface SocialAuthParams {
  provider: SocialProvider;
  socialData?: AppleCredential; // For Apple, or other provider-specific data
}