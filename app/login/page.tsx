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
      </BaseCard>
    </div>
  );
}
