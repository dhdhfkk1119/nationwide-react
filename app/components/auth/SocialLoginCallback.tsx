"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import showSwal from "@/app/components/modal/Swal";
import { useAuth } from "@/app/providers/AuthProvider";
import { Messages } from "@/app/constants/Messages";

export default function SocialLoginCallback() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");
    const error = params.get("error");

    if (error || !accessToken) {
      showSwal("error", Messages.LOGIN_FAIL);
      router.replace("/login");
      return;
    }

    localStorage.setItem("accessToken", accessToken);
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    }

    void (async () => {
      await refreshUser();
      router.replace("/");
    })();
  }, [refreshUser, router]);

  return (
    <div className="d-flex justify-content-center mt-5">
      <p>로그인 처리 중입니다...</p>
    </div>
  );
}
