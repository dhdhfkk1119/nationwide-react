"use client";

import Link from "next/link";
import { useAlarm } from "@/app/providers/AlarmProvider";
import { toProfileImageUrl } from "@/app/utils/imageUrl";
import { useAuth } from "@/app/providers/AuthProvider";
import { useLocale } from "@/app/providers/LocaleProvider";

export default function UserInfo() {
  const { user, logout, loading } = useAuth();
  const { messages } = useLocale();
  const { unreadCount } = useAlarm();

  if (loading) return null;

  return (
    <div className="userInfo">
      {!user ? (
        <div className="user">
          <Link href="/login">{messages.header.login}</Link>
          <Link href="/register">{messages.header.register}</Link>
        </div>
      ) : (
        <div className="user">
          <Link href="/mypage" className="d-flex align-items-center">
            <img
              src={toProfileImageUrl(user.profileImagePath?.[0])}
              alt={messages.header.profileAlt}
              width={30}
              style={{
                paddingRight: "5px",
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
            <span>{user.name}</span>
          </Link>

          <button className="btn btn-link ms-2" onClick={logout}>
            {messages.header.logout}
          </button>
        </div>
      )}

      <div className="alrams">
        <Link href="/notifications" className="alarm-link">
          <i className="bi bi-bell"></i>
          {user && unreadCount > 0 ? (
            <span className="alarm-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
          ) : null}
        </Link>
      </div>
    </div>
  );
}
