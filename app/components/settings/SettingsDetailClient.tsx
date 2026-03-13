"use client";

import "@/app/styles/main.css";
import "@/app/styles/settings.css";
import CommunitySidebar from "@/app/components/community/CommunitySidebar";
import Link from "next/link";
import type { SettingsMenuSlug } from "@/app/components/settings/settingsMenu";
import { formatMessage } from "@/app/i18n/messages";
import { useAuth } from "@/app/providers/AuthProvider";
import { useLocale } from "@/app/providers/LocaleProvider";

type SettingsDetailClientProps = {
  slug: SettingsMenuSlug;
};

export default function SettingsDetailClient({
  slug,
}: SettingsDetailClientProps) {
  const { user, loading } = useAuth();
  const { messages } = useLocale();
  const item = messages.settings.menu[slug];

  return (
    <section className="main-page">
      <CommunitySidebar activeMenuKey="setting" />

      <div className="feed-area">
        <section className="settings-shell">
          <div className="settings-detail-card">
            <Link href="/settings" className="settings-back-link">
              <i className="bi bi-arrow-left" aria-hidden="true"></i>
              <span>{messages.settings.backToList}</span>
            </Link>

            <p className="settings-kicker">{messages.settings.detailKicker}</p>
            <h1>{item.title}</h1>
            <p className="settings-description">{item.description}</p>

            {loading ? (
              <div className="settings-empty-card">{messages.settings.loading}</div>
            ) : !user ? (
              <div className="settings-empty-card">
                {formatMessage(messages.settings.loginRequiredForItem, {
                  title: item.title,
                })}
              </div>
            ) : (
              <div className="settings-placeholder-card">
                <strong>{messages.settings.placeholderTitle}</strong>
                <p>{messages.settings.placeholderDescription}</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
