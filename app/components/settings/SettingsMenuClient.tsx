"use client";

import "@/app/styles/main.css";
import "@/app/styles/settings.css";
import CommunitySidebar from "@/app/components/community/CommunitySidebar";
import Link from "next/link";
import { settingsMenuItems } from "@/app/components/settings/settingsMenu";
import { useAuth } from "@/app/providers/AuthProvider";
import { useLocale } from "@/app/providers/LocaleProvider";

export default function SettingsMenuClient() {
  const { user, loading } = useAuth();
  const { messages } = useLocale();

  return (
    <section className="main-page">
      <CommunitySidebar activeMenuKey="setting" />

      <div className="feed-area">
        <section className="settings-shell">
          <header className="settings-header">
            <p className="settings-kicker">SETTINGS</p>
            <h1>{messages.settings.heading}</h1>
            <p className="settings-description">{messages.settings.description}</p>
          </header>

          {loading ? (
            <div className="settings-empty-card">{messages.settings.loading}</div>
          ) : !user ? (
            <div className="settings-empty-card">{messages.settings.loginRequired}</div>
          ) : (
            <nav
              aria-label={messages.settings.menuAriaLabel}
              className="settings-menu"
            >
              {settingsMenuItems.map((item) => (
                <Link
                  key={item.slug}
                  href={`/settings/${item.slug}`}
                  className="settings-menu-item"
                >
                  <div className="settings-menu-copy">
                    <strong>{messages.settings.menu[item.slug].title}</strong>
                    <span>{messages.settings.menu[item.slug].description}</span>
                  </div>
                  <i className="bi bi-chevron-right" aria-hidden="true"></i>
                </Link>
              ))}
            </nav>
          )}
        </section>
      </div>
    </section>
  );
}
