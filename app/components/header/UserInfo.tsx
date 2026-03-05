"use client";

import Link from "next/link";
import { useAuth } from "@/app/providers/AuthProvider";

export default function UserInfo() {
  const { user, logout, loading } = useAuth();

  if (loading) return null;

  const getProfileImageUrl = (profileImage?: string) => {
    if (!profileImage) {
      return "/images/default-profile.png";
    }

    // 이미 전체 URL인 경우 (http:// 또는 https://로 시작)
    if (profileImage.startsWith("http")) {
      return profileImage;
    }

    // 상대 경로인 경우 백엔드 서버 URL 붙이기
    // profileImage: /uploads/member-images/profile1.png
    // 결과: http://localhost/uploads/member-images/profile1.png
    return `http://localhost${profileImage}`;
  };

  return (
    <div className="userInfo">
      {!user ? (
        // 🔹 로그인 안 된 경우
        <div className="user">
          <Link href="/login">로그인</Link>
          <Link href="/register">회원가입</Link>
        </div>
      ) : (
        // 🔹 로그인 된 경우
        <div className="user">
          <Link href="/mypage" className="d-flex align-items-center">
            <img
              src={getProfileImageUrl(user.profileImage)}
              alt="profile"
              width={30}
              style={{
                paddingRight: "5px",
                borderRadius: "50%",
                objectFit: "cover",
              }}
              onError={(e) => {
                console.error("이미지 로드 실패:", e.currentTarget.src);
                e.currentTarget.src = "/images/default-profile.png";
              }}
            />
            <span>{user.name} 님</span>
          </Link>

          <button className="btn btn-link ms-2" onClick={logout}>
            로그아웃
          </button>
        </div>
      )}

      <div className="alrams">
        <Link href="/notifications">
          <i className="bi bi-bell"></i>
        </Link>
      </div>
    </div>
  );
}
