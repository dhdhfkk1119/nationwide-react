"use client";

import "@/app/styles/main.css";
import "@/app/styles/settings.css";
import CommunitySidebar from "@/app/components/community/CommunitySidebar";
import showSwal, { confirmSwal } from "@/app/components/modal/Swal";
import { formatMessage } from "@/app/i18n/messages";
import { useAuth } from "@/app/providers/AuthProvider";
import { useLocale } from "@/app/providers/LocaleProvider";
import memberApi from "@/service/api";
import Link from "next/link";
import { useEffect, useState } from "react";

type ViewerUser = {
  hasCurrentLocation?: boolean;
  currentLocationAddress?: string;
  currentLocationAddress1?: string;
  currentLocationAddress2?: string;
  locationSource?: string;
};

type DaumPostcodeData = {
  zonecode: string;
  address: string;
  roadAddress: string;
  jibunAddress: string;
  buildingName: string;
  sido: string;
  sigungu: string;
};

export default function LocationDistanceSettingsClient() {
  const { user, loading, refreshUser } = useAuth();
  const { messages } = useLocale();
  const item = messages.settings.menu["location-distance"];

  const [hasCurrentLocation, setHasCurrentLocation] = useState(false);
  const [addressLine, setAddressLine] = useState("");
  const [locationSource, setLocationSource] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const viewer = (user ?? {}) as ViewerUser;
    setHasCurrentLocation(Boolean(viewer.hasCurrentLocation));
    setAddressLine(
      [viewer.currentLocationAddress, viewer.currentLocationAddress1, viewer.currentLocationAddress2]
        .filter((part) => part && part.trim())
        .join(" "),
    );
    setLocationSource(viewer.locationSource ?? null);
  }, [user]);

  const onSetCurrentLocation = async () => {
    if (isSubmitting) return;

    const result = await confirmSwal({
      icon: "question",
      title: "위치 정보 제공 동의",
      html: "현재 위치 정보를 제공하시겠습니까?",
      showCancelButton: true,
      confirmButtonText: "동의",
      cancelButtonText: "취소",
    });
    if (!result.isConfirmed) return;

    if (!navigator.geolocation) {
      showSwal("error", "이 브라우저에서는 위치 정보를 사용할 수 없습니다.");
      return;
    }

    setIsSubmitting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await memberApi.updateCurrentLocation(
            position.coords.latitude,
            position.coords.longitude,
          );
          await refreshUser();
          await showSwal("success", "현재 위치가 설정되었습니다.");
        } catch (error: any) {
          showSwal(
            "error",
            error?.response?.data?.error?.message || "위치 설정에 실패했습니다.",
          );
        } finally {
          setIsSubmitting(false);
        }
      },
      () => {
        showSwal("error", "위치 정보 접근 권한이 필요합니다.");
        setIsSubmitting(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  const onSetCurrentLocationManually = () => {
    if (isSubmitting) return;

    const daum = (window as any).daum;
    if (!daum?.Postcode) {
      showSwal("error", "주소 검색 서비스를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    new daum.Postcode({
      oncomplete: (data: DaumPostcodeData) => {
        void (async () => {
          setIsSubmitting(true);
          try {
            const region = `${data.sido} ${data.sigungu}`.trim();
            const roadAddress = data.roadAddress || data.jibunAddress || data.address;
            const address1 = roadAddress.startsWith(region)
              ? roadAddress.slice(region.length).trim()
              : roadAddress;
            const address2 = data.buildingName?.trim() || undefined;

            await memberApi.updateCurrentLocationManually(
              roadAddress,
              region,
              address1 || roadAddress,
              address2,
            );
            await refreshUser();
            await showSwal("success", "현재 위치가 설정되었습니다.");
          } catch (error: any) {
            showSwal(
              "error",
              error?.response?.data?.error?.message || "위치 설정에 실패했습니다.",
            );
          } finally {
            setIsSubmitting(false);
          }
        })();
      },
    }).open();
  };

  const onClearCurrentLocation = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await memberApi.clearCurrentLocation();
      await refreshUser();
    } catch (error) {
      console.error(error);
      showSwal("error", "위치 해제에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onToggleConsent = async () => {
    if (hasCurrentLocation) {
      await onClearCurrentLocation();
      return;
    }
    await onSetCurrentLocation();
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
                <div className="settings-toggle-list">
                  <article className="settings-toggle-card">
                    <div className="settings-toggle-copy">
                      <strong>현재 위치 동의</strong>
                      <p>
                        {addressLine
                          ? `현재 설정된 위치: ${addressLine}`
                          : "설정된 위치가 없습니다."}
                      </p>
                      {locationSource === "AUTO" ? (
                        <p className="settings-hint-text">
                          현재 위치와 차이가 날 수 있습니다. 현재 위치 직접 설정으로 다시 설정해주시면 감사하겠습니다.
                        </p>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      className={`settings-toggle-button ${hasCurrentLocation ? "is-active" : ""}`}
                      onClick={() => void onToggleConsent()}
                      aria-pressed={hasCurrentLocation}
                      disabled={isSubmitting}
                    >
                      <span className="settings-toggle-track">
                        <span className="settings-toggle-thumb"></span>
                      </span>
                      <span className="settings-toggle-state">
                        {hasCurrentLocation ? "Y" : "N"}
                      </span>
                    </button>
                  </article>
                </div>

                <div className="settings-location-actions">
                  <button
                    type="button"
                    className="settings-action-button"
                    onClick={() => void onSetCurrentLocation()}
                    disabled={isSubmitting}
                  >
                    현재 위치 자동 설정
                  </button>
                  <button
                    type="button"
                    className="settings-action-button is-secondary"
                    onClick={onSetCurrentLocationManually}
                    disabled={isSubmitting}
                  >
                    직접 설정
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
