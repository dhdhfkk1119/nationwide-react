"use client";

import React, { useState } from "react";
import BaseCard from "../components/util_card/BaseCard";
import "@/app/styles/loginpage.css";
import { LoginDTO } from "@/service/generated";
import showSwal from "../components/modal/Swal";
import { Messages } from "../constants/Messages";
import memberApi from "@/service/api";
import { useAuth } from "@/app/providers/AuthProvider";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const { user, setUser, refreshUser } = useAuth();
  const [errorMsg, setErrorMsg] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);

  const [form, setForm] = useState<LoginDTO>({
    loginId: "",
    password: "",
    autoLogin: false,
    provider: LoginDTO.provider.LOCAL,
  });

  const openError = (msg: string) => {
    setErrorMsg(msg);
    setShowErrorModal(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: checked }));
  };

  // API 흐름 (NAVER/KAKAO/GOOGLE 공통):
  //   GET /api/{provider}/authorize -> Provider 인증 페이지로 리다이렉트
  //   -> GET /api/{provider}/callback?code=...&state=... (Provider가 직접 호출)
  //   -> 토큰 교환/회원 조회·가입 후 /login/{provider}/callback#accessToken=...&refreshToken=... 로 리다이렉트
  const handleSocialLogin = (provider: "KAKAO" | "NAVER" | "GOOGLE") => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}${provider.toLowerCase()}/authorize`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.loginId || !form.password) {
      showSwal("error", Messages.LOGIN_REQUIRED);
      return;
    }
    // 로그인 진행
    try {
      const res = await memberApi.login(form);

      localStorage.setItem("accessToken", res.data.response.accessToken);

      if (form.autoLogin) {
        localStorage.setItem("refreshToken", res.data.response.refreshToken);
      }
      await refreshUser();

      router.push("/");
    } catch (error: any) {
      showSwal(
        "error",
        error?.response?.data?.error?.message || Messages.LOGIN_FAIL
      );
    }
  };

  return (
    <div className="d-flex justify-content-center mt-4">
      <BaseCard className="login-card">
        <h3 className="text-center mb-4">로그인</h3>
        <form onSubmit={handleSubmit}>
          <input
            className="form-control mb-2"
            name="loginId"
            placeholder="아이디"
            value={form.loginId}
            onChange={handleChange}
          />

          <input
            className="form-control mb-2"
            type="password"
            name="password"
            placeholder="비밀번호"
            value={form.password}
            onChange={handleChange}
          />

          {/* 자동 로그인 */}
          <div className="form-check mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="autoLogin"
              name="autoLogin"
              checked={form.autoLogin}
              onChange={handleCheckboxChange}
            />
            <label className="form-check-label" htmlFor="autoLogin">
              자동 로그인
            </label>
          </div>

          <button className="btn btn-primary w-100" type="submit">
            로그인
          </button>
        </form>

        <div className="login-divider">
          <span>또는</span>
        </div>

        <div className="social-login-group">
          <button
            type="button"
            className="btn btn-social btn-kakao w-100"
            onClick={() => handleSocialLogin("KAKAO")}
          >
            <i className="bi bi-chat-fill"></i>
            카카오로 시작하기
          </button>

          <button
            type="button"
            className="btn btn-social btn-naver w-100"
            onClick={() => handleSocialLogin("NAVER")}
          >
            <span className="btn-social-naver-logo">N</span>
            네이버로 시작하기
          </button>

          <button
            type="button"
            className="btn btn-social btn-google w-100"
            onClick={() => handleSocialLogin("GOOGLE")}
          >
            <i className="bi bi-google"></i>
            구글로 시작하기
          </button>
        </div>
      </BaseCard>
    </div>
  );
}
