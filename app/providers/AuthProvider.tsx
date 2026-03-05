"use client";

import { createContext, useContext, useEffect, useState } from "react";
import memberApi from "@/service/api";

interface User {
  id: number;
  name: string;
  profileImage?: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  loading: boolean;
  refreshUser: () => Promise<void>; // 추가
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await memberApi.me();
      setUser(res.data.response);
    } catch (error) {
      console.error("사용자 정보 로드 실패:", error);

      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
    setUser(null);
    window.location.href = "/login";
  };

  useEffect(() => {
    // 회원가입 페이지에서는 인증 체크 건너뛰기
    if (
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/register")
    ) {
      setLoading(false);
      return;
    }

    refreshUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, setUser, logout, loading, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
