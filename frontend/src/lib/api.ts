const configuredApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
const API_BASE_URL = configuredApiUrl ? configuredApiUrl.replace(/\/$/, "") : "/api";

export const TOKEN_STORAGE_KEY = "msh_auth_token";

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "employee" | "buyer";
  status: "active" | "inactive";
  department?: string;
  phone?: string;
  lastLogin?: string | null;
}

interface RequestOptions extends RequestInit {
  token?: string | null;
}

export const apiRequest = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const { token, headers, ...rest } = options;

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...(headers ?? {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch {
    throw new Error("Unable to connect to server. Please ensure backend is running.");
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = typeof payload?.message === "string" ? payload.message : "Request failed";
    throw new Error(message);
  }

  return payload as T;
};

export interface LoginResponse {
  token: string;
  user: ApiUser;
}

export interface SignupPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export const loginApi = (email: string, password: string) =>
  apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const signupBuyerApi = (payload: SignupPayload) =>
  apiRequest<LoginResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getMeApi = (token: string) =>
  apiRequest<{ user: ApiUser }>("/auth/me", {
    method: "GET",
    token,
  });
