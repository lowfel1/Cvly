// API client for communicating with FastAPI backend
import type { TokenResponse, User } from "@/types/index";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface FastApiErrorPayload {
  detail?: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = "An unexpected error occurred.";

    try {
      const errorData = (await response.json()) as FastApiErrorPayload;

      if (errorData?.detail) {
        errorMessage = errorData.detail;
      }
    } catch {
      errorMessage = response.statusText || errorMessage;
    }

    throw new Error(errorMessage);
  }

  return (await response.json()) as T;
}

export async function registerUser(
  fullName: string,
  email: string,
  password: string
): Promise<TokenResponse> {
  try {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        full_name: fullName,
        email,
        password,
      }),
    });

    return await handleResponse<TokenResponse>(response);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to register user.");
  }
}

export async function loginUser(email: string, password: string): Promise<TokenResponse> {
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    return await handleResponse<TokenResponse>(response);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to login user.");
  }
}

export async function getMe(token: string): Promise<User> {
  try {
    const response = await fetch(`${BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return await handleResponse<User>(response);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to fetch current user.");
  }
}
