// Core user model returned by the backend.
export interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

// Auth token payload returned after a successful login/register.
export interface TokenResponse {
  access_token: string;
  token_type: "bearer";
}

// Form payload for user login.
export interface LoginFormData {
  email: string;
  password: string;
}

// Form payload for user registration.
export interface RegisterFormData {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
}

// Standard API error shape from FastAPI endpoints.
export interface ApiError {
  detail: string;
  status: number;
}

// Generic API response wrapper used across the app.
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}
