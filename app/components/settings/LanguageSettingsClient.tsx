"use client";

import "@/app/styles/main.css";
import "@/app/styles/settings.css";
import { confirmSwal } from "@/app/components/modal/Swal";
import { type AppLocale, formatMessage } from "@/app/i18n/messages";
import { useAuth } from "@/app/providers/AuthProvider";
import { useLocale } from "@/app/providers/LocaleProvider";
import CommunitySidebar from "@/app/components/community/CommunitySidebar";
import Link from "next/link";

export default function LanguageSettingsClient() {
  const { user, loading } = useAuth();
  const { locale, setLocale, messages, supportedLanguages } = useLocale();
  const item = messages.settings.menu.language;
  const languageCopy = messages.settings.language;

  const onSelectLanguage = async (nextLocale: AppLocale) => {
    if (nextLocale === locale) {
      return;
    }

    const nextLanguage = supportedLanguages.find(
      (language) => language.code === nextLocale,
    );

    if (!nextLanguage) {
      return;
    }

    const result = await confirmSwal({
      icon: "question",
      title: languageCopy.confirmTitle,
      html: formatMessage(languageCopy.confirmMessage, {
        language: nextLanguage.nativeLabel,
      }),
      showCancelButton: true,
      confirmButtonText: messages.common.confirm,
      cancelButtonText: messages.common.cancel,
    });

    if (!result.isConfirmed) {
      return;
    }

    setLocale(nextLocale);
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
              <div className="settings-language-panel">
                <div className="settings-language-summary">
                  <strong>{languageCopy.currentLanguage}</strong>
                  <span>
                    {
                      supportedLanguages.find((language) => language.code === locale)
                        ?.nativeLabel
                    }
                  </span>
                </div>

                <div className="settings-language-copy">
                  <strong>{languageCopy.availableLanguages}</strong>
                  <p>{languageCopy.helper}</p>
                </div>

                <ul className="settings-language-list">
                  {supportedLanguages.map((language) => {
                    const isActive = language.code === locale;

                    return (
                      <li key={language.code}>
                        <button
                          type="button"
                          className={`settings-language-button ${
                            isActive ? "is-active" : ""
                          }`}
                          onClick={() => onSelectLanguage(language.code)}
                          disabled={isActive}
                        >
                          <div className="settings-language-labels">
                            <strong>{language.nativeLabel}</strong>
                            <span>{language.englishLabel}</span>
                          </div>

                          {isActive ? (
                            <span className="settings-language-badge">
                              {languageCopy.selected}
                            </span>
                          ) : (
                            <i
                              className="bi bi-chevron-right"
                              aria-hidden="true"
                            ></i>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
