"use client";

import { confirmSwal } from "@/app/components/modal/Swal";
import memberApi from "@/service/api";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface User {
  id: number;
  name: string;
  nickName?: string;
  displayName?: string;
  thumbnailProfileImagePath?: string;
  profileImagePath?: string[];
  isDeactivate?: boolean;
  deactivateUntil?: string | null;
  deactivateDate?: string | null;
  deactivateCancelDate?: string | null;
  deactivateCount?: number;
  remainingDeactivateCount?: number;
  canDeactivate?: boolean;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const promptKeyRef = useRef<string | null>(null);

  const refreshUser = useCallback(async () => {
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await memberApi.me();
      setUser(res.data.response);
    } catch (error) {
      console.error("사용자 정보를 불러오지 못했습니다.", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.clear();
      window.location.href = "/login";
    }
    setUser(null);
  }, []);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/register")
    ) {
      setLoading(false);
      return;
    }

    void refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (!user?.isDeactivate) {
      promptKeyRef.current = null;
      return;
    }

    const promptKey = `${user.id}:${user.deactivateUntil ?? "active"}`;
    if (promptKeyRef.current === promptKey) {
      return;
    }

    promptKeyRef.current = promptKey;
    let cancelled = false;

    void (async () => {
      const result = await confirmSwal({
        icon: "question",
        title: "계정 비활성화를 해제 하시겠습니까?",
        html: "해제 시에는 정상적인 활동이 가능합니다.",
        showCancelButton: true,
        confirmButtonText: "해제",
        cancelButtonText: "취소",
        allowOutsideClick: false,
        allowEscapeKey: false,
        backdrop: "rgba(255, 255, 255, 0.22)",
        customClass: {
          container: "swal-blur-backdrop",
        },
      });

      if (cancelled) {
        return;
      }

      if (result.dismiss) {
        logout();
        return;
      }

      if (!result.isConfirmed) {
        return;
      }

      try {
        await memberApi.cancelDeactivation();
        promptKeyRef.current = null;
        await refreshUser();
      } catch (error) {
        console.error("계정 비활성화 해제에 실패했습니다.", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [logout, refreshUser, user?.deactivateUntil, user?.id, user?.isDeactivate]);

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
