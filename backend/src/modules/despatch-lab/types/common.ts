export interface DespatchLabAuthCredentials {
  key: string;
  secret: string;
}

export interface DespatchLabTokens {
  access: string;
  refresh: string;
}

export interface DespatchLabAuthResponse {
  tokens: DespatchLabTokens;
}

export interface DespatchLabImpersonationTokens {
  accessToken: string;
  refreshToken: string;
}

export interface DespatchLabImpersonationResponse {
  tokens: DespatchLabImpersonationTokens;
}

export interface DespatchLabAuthError {
  error: string;
}

export interface DespatchLabModuleOptions {
  apiUrl?: string;
  key: string;
  secret: string;
}

export interface DespatchLabAuthContext {
  tokens?: DespatchLabTokens;
  expiresAt?: Date;
  isAuthenticated: boolean;
}

export interface DespatchLabOrder {
  id: string;
  [key: string]: any;
}