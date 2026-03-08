"use client";

import Link from "next/link";
import { MouseEvent } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import showSwal from "@/app/components/modal/Swal";

type CommunitySidebarProps = {
  activeMenuKey?: string;
  isWritePage?: boolean;
};

type MenuItem = {
  key: string;
  label: string;
  icon: string;
  href: string;
};

const menuItems: MenuItem[] = [
  {
    key: "profile",
    label: "프로필",
    icon: "bi-person-circle",
    href: "/mypage",
  },
  {
    key: "neighbors",
    label: "동네친구",
    icon: "bi-geo-alt-fill",
    href: "/neighbors",
  },
  { key: "message", label: "메시지", icon: "bi-chat-dots-fill", href: "/dm" },
  {
    key: "notification",
    label: "알림",
    icon: "bi-bell-fill",
    href: "/notifications",
  },
  { key: "support", label: "고객센터", icon: "bi-headset", href: "/support" },
  { key: "setting", label: "설정", icon: "bi-gear-fill", href: "/settings" },
  { key: "shop", label: "상점", icon: "bi-bag-fill", href: "/shop" },
];

export default function CommunitySidebar({
  activeMenuKey,
  isWritePage = false,
}: CommunitySidebarProps) {
  const { user } = useAuth();

  const onProtectedClick = async (event: MouseEvent<HTMLAnchorElement>) => {
    if (user) return;

    event.preventDefault();
    await showSwal(
      "warning",
      "해당 서비스는 로그인 이후 사용가능합니다<br/>로그인 해주시기 바랍니다.!!",
    );
  };

  return (
    <aside className="main-sidebar" aria-label="community menu">
      <div className="sidebar-title black">커뮤니티 메뉴</div>
      <nav>
        <ul className="menu-list">
          {menuItems.map((item) => (
            <li key={item.key}>
              <Link
                className={`menu-link ${activeMenuKey === item.key ? "is-active" : ""}`}
                href={item.href}
                onClick={onProtectedClick}
              >
                <i className={`bi ${item.icon}`} aria-hidden="true"></i>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <Link
        className={`sidebar-write-btn ${isWritePage ? "is-active" : ""}`}
        href="/community/write"
        onClick={onProtectedClick}
      >
        <i className="bi bi-pencil-square" aria-hidden="true"></i>
        <span>{isWritePage ? "게시글 작성 중" : "게시글 쓰기"}</span>
      </Link>
    </aside>
  );
}
