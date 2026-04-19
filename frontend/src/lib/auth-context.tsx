import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import {
  getMeApi,
  loginApi,
  signupBuyerApi,
  TOKEN_STORAGE_KEY,
  type SignupPayload,
} from "@/lib/api";

export type UserRole = "admin" | "employee" | "buyer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signupBuyer: (payload: SignupPayload) => Promise<void>;
  logout: () => void;
  token: string | null;
  isAuthLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const applySession = useCallback((sessionToken: string, sessionUser: User) => {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, sessionToken);
    setToken(sessionToken);
    setUser(sessionUser);
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);

      if (!storedToken) {
        setIsAuthLoading(false);
        return;
      }

      try {
        const response = await getMeApi(storedToken);
        setToken(storedToken);
        setUser(response.user);
      } catch {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setIsAuthLoading(false);
      }
    };

    void restoreSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginApi(email, password);
    applySession(response.token, response.user);
  }, [applySession]);

  const signupBuyer = useCallback(async (payload: SignupPayload) => {
    const response = await signupBuyerApi(payload);
    applySession(response.token, response.user);
  }, [applySession]);

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    setUser(null);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signupBuyer,
        logout,
        token,
        isAuthLoading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
