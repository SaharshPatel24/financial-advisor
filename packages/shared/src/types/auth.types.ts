// ---------------------------------------------------------------------------
// Auth Types
// Shared between the NestJS API and the React Native mobile app.
// ---------------------------------------------------------------------------

/**
 * How the user authenticated.
 * LOCAL = email/password. Add GOOGLE and APPLE when OAuth is implemented.
 * The Prisma User model stores this so we never need a schema migration for OAuth.
 */
export type AuthProvider = 'LOCAL' | 'GOOGLE' | 'APPLE';

export interface RegisterDto {
  email: string;
  password: string;
  name?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

/** Payload for OAuth sign-in (Google / Apple). Password is not required. */
export interface OAuthLoginDto {
  provider: Exclude<AuthProvider, 'LOCAL'>;
  /** ID token from the OAuth provider (verified server-side) */
  idToken: string;
  email: string;
  name?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  authProvider: AuthProvider;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface RefreshTokenDto {
  refreshToken: string;
}
