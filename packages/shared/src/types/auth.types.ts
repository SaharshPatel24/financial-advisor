// ---------------------------------------------------------------------------
// Auth Types
// Shared between the NestJS API and the React Native mobile app.
// ---------------------------------------------------------------------------

export interface RegisterDto {
  email: string;
  password: string;
  name?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface RefreshTokenDto {
  refreshToken: string;
}
