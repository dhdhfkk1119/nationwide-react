"use client";

import Link from "next/link";
import { MouseEvent } from "react";
import showSwal from "@/app/components/modal/Swal";
import { useAlarm } from "@/app/providers/AlarmProvider";
import { useAuth } from "@/app/providers/AuthProvider";
import { useDm } from "@/app/providers/DmProvider";
import { useLocale } from "@/app/providers/LocaleProvider";

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

export default function CommunitySidebar({
  activeMenuKey,
  isWritePage = false,
}: CommunitySidebarProps) {
  const { user } = useAuth();
  const { messages } = useLocale();
  const { unreadCount } = useAlarm();
  const { unreadCount: unreadMessageCount } = useDm();

  const menuItems: MenuItem[] = [
    {
      key: "profile",
      label: messages.sidebar.profile,
      icon: "bi-person-circle",
      href: "/mypage",
    },
    {
      key: "neighbors",
      label: messages.sidebar.neighbors,
      icon: "bi-geo-alt-fill",
      href: "/neighbors",
    },
    {
      key: "message",
      label: messages.sidebar.message,
      icon: "bi-chat-dots-fill",
      href: "/dm",
    },
    {
      key: "notification",
      label: messages.sidebar.notification,
      icon: "bi-bell-fill",
      href: "/notifications",
    },
    {
      key: "support",
      label: messages.sidebar.support,
      icon: "bi-headset",
      href: "/support",
    },
    {
      key: "setting",
      label: messages.sidebar.setting,
      icon: "bi-gear-fill",
      href: "/settings",
    },
    {
      key: "shop",
      label: messages.sidebar.shop,
      icon: "bi-bag-fill",
      href: "/shop",
    },
  ];

  const onProtectedClick = async (event: MouseEvent<HTMLAnchorElement>) => {
    if (user) return;

    event.preventDefault();
    await showSwal(
      "warning",
      messages.sidebar.loginRequiredMessage,
      undefined,
      messages.common.confirm,
    );
  };

  return (
    <aside className="main-sidebar" aria-label="community menu">
      <div className="sidebar-title black">{messages.sidebar.title}</div>
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
                <span className="menu-link-label">
                  <span>{item.label}</span>
                  {item.key === "notification" && user && unreadCount > 0 ? (
                    <span className="sidebar-notification-badge">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  ) : null}
                  {item.key === "message" && user && unreadMessageCount > 0 ? (
                    <span className="sidebar-notification-badge">
                      {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                    </span>
                  ) : null}
                </span>
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
        <span>
          {isWritePage ? messages.sidebar.writingPost : messages.sidebar.writePost}
        </span>
      </Link>
    </aside>
  );
}
