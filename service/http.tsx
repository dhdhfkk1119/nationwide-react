import axios from "axios";

const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 요청 시 토큰 자동 첨부
http.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    console.log("🔑 요청 전 토큰 확인:", token ? "존재함" : "없음");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("✅ Authorization 헤더 추가됨");
    } else {
      console.warn("⚠️ 토큰이 없어서 헤더에 추가하지 않음");
    }
  }
  return config;
});

// 응답 에러 공통 처리
http.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("❌ HTTP 에러:", error);

    // /me API 호출 실패는 리다이렉트하지 않음
    const isAuthCheck = error.config?.url?.includes("/member/me");

    // 회원가입 관련 페이지에서는 401 에러 무시
    const isRegisterPage =
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/register");

    if (error.response?.status === 401 && !isAuthCheck && !isRegisterPage) {
      console.log("🚪 401 에러 - 로그인 페이지로 이동");
      localStorage.clear();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default http;
