"use client";

import "@/app/styles/main.css";
import "@/app/styles/settings.css";
import CommunitySidebar from "@/app/components/community/CommunitySidebar";
import showSwal from "@/app/components/modal/Swal";
import { formatMessage } from "@/app/i18n/messages";
import { useAuth } from "@/app/providers/AuthProvider";
import { useLocale } from "@/app/providers/LocaleProvider";
import memberApi from "@/service/api";
import Link from "next/link";
import { useEffect, useState } from "react";

type ViewerUser = {
  isPrivateProfile?: boolean;
  isLocationVisible?: boolean;
  privateProfile?: boolean;
  locationVisible?: boolean;
};

const readPrivateProfile = (value: ViewerUser) =>
  Boolean(value.isPrivateProfile ?? value.privateProfile);

const readLocationVisible = (value: ViewerUser) =>
  value.isLocationVisible ?? value.locationVisible ?? true;

export default function PrivacySecuritySettingsClient() {
  const { user, loading, refreshUser } = useAuth();
  const { messages } = useLocale();
  const item = messages.settings.menu["privacy-security"];
  const privacyCopy = messages.settings.privacySecurity;

  const [isPrivateProfile, setIsPrivateProfile] = useState(false);
  const [isLocationVisible, setIsLocationVisible] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const currentUser = (user ?? {}) as ViewerUser;
    setIsPrivateProfile(readPrivateProfile(currentUser));
    setIsLocationVisible(readLocationVisible(currentUser));
  }, [user]);

  const onSave = async (
    nextPrivateProfile: boolean,
    nextLocationVisible: boolean,
  ) => {
    try {
      setIsSaving(true);
      await memberApi.updatePrivacySettings({
        isPrivateProfile: nextPrivateProfile,
        isLocationVisible: nextLocationVisible,
      });
      await refreshUser();
    } catch (error) {
      console.error(error);
      await showSwal("error", "설정 저장에 실패했습니다.");
      const currentUser = (user ?? {}) as ViewerUser;
      setIsPrivateProfile(readPrivateProfile(currentUser));
      setIsLocationVisible(readLocationVisible(currentUser));
    } finally {
      setIsSaving(false);
    }
  };

  const onTogglePrivateProfile = async () => {
    const nextPrivateProfile = !isPrivateProfile;
    setIsPrivateProfile(nextPrivateProfile);
    await onSave(nextPrivateProfile, isLocationVisible);
  };

  const onToggleLocationVisible = async () => {
    const nextLocationVisible = !isLocationVisible;
    setIsLocationVisible(nextLocationVisible);
    await onSave(isPrivateProfile, nextLocationVisible);
  };

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
              <div className="settings-toggle-panel">
                <div className="settings-section-copy">
                  <strong>{privacyCopy.sectionTitle}</strong>
                  <p>{privacyCopy.sectionDescription}</p>
                </div>

                <div className="settings-toggle-list">
                  <article className="settings-toggle-card">
                    <div className="settings-toggle-copy">
                      <strong>{privacyCopy.privateProfileTitle}</strong>
                      <p>{privacyCopy.privateProfileDescription}</p>
                    </div>

                    <button
                      type="button"
                      className={`settings-toggle-button ${
                        isPrivateProfile ? "is-active" : ""
                      }`}
                      onClick={() => void onTogglePrivateProfile()}
                      aria-pressed={isPrivateProfile}
                      disabled={isSaving}
                    >
                      <span className="settings-toggle-track">
                        <span className="settings-toggle-thumb"></span>
                      </span>
                      <span className="settings-toggle-state">
                        {isPrivateProfile
                          ? privacyCopy.toggleOnLabel
                          : privacyCopy.toggleOffLabel}
                      </span>
                    </button>
                  </article>

                  <article className="settings-toggle-card">
                    <div className="settings-toggle-copy">
                      <strong>{privacyCopy.locationTitle}</strong>
                      <p>{privacyCopy.locationDescription}</p>
                    </div>

                    <button
                      type="button"
                      className={`settings-toggle-button ${
                        isLocationVisible ? "is-active" : ""
                      }`}
                      onClick={() => void onToggleLocationVisible()}
                      aria-pressed={isLocationVisible}
                      disabled={isSaving}
                    >
                      <span className="settings-toggle-track">
                        <span className="settings-toggle-thumb"></span>
                      </span>
                      <span className="settings-toggle-state">
                        {isLocationVisible
                          ? privacyCopy.toggleOnLabel
                          : privacyCopy.toggleOffLabel}
                      </span>
                    </button>
                  </article>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
