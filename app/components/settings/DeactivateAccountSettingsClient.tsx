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
import { useEffect, useMemo, useState } from "react";

type ViewerUser = {
  isDeactivate?: boolean;
  deactivateUntil?: string | null;
  deactivateDate?: string | null;
  deactivateCancelDate?: string | null;
  deactivateCount?: number;
  remainingDeactivateCount?: number;
  canDeactivate?: boolean;
};

const monthOptions = Array.from({ length: 12 }, (_, index) => index + 1);

const readErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: unknown }).response === "object"
  ) {
    const response = (error as {
      response?: {
        data?: {
          error?: {
            message?: string;
          };
        };
      };
    }).response;

    return response?.data?.error?.message ?? fallbackMessage;
  }

  return fallbackMessage;
};

const toKoreanDateTime = (value?: string | null) => {
  if (!value) return "-";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
};

export default function DeactivateAccountSettingsClient() {
  const { user, loading, refreshUser, logout } = useAuth();
  const { messages } = useLocale();
  const item = messages.settings.menu["delete-account"];

  const [selectedMonths, setSelectedMonths] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const deactivationState = useMemo(() => {
    const currentUser = (user ?? {}) as ViewerUser;
    return {
      isDeactivate: Boolean(currentUser.isDeactivate),
      deactivateUntil: currentUser.deactivateUntil ?? null,
      deactivateDate: currentUser.deactivateDate ?? null,
      deactivateCancelDate: currentUser.deactivateCancelDate ?? null,
      deactivateCount: currentUser.deactivateCount ?? 0,
      remainingDeactivateCount: currentUser.remainingDeactivateCount ?? 3,
      canDeactivate: currentUser.canDeactivate ?? true,
    };
  }, [user]);

  useEffect(() => {
    if (deactivationState.isDeactivate) {
      setSelectedMonths(1);
    }
  }, [deactivationState.isDeactivate]);

  const onDeactivate = async () => {
    const result = await confirmSwal({
      icon: "warning",
      title: "계정을 비활성화하시겠습니까?",
      html: `${selectedMonths}개월 동안 게시글과 이름이 숨겨집니다.`,
      showCancelButton: true,
      confirmButtonText: "비활성화",
      cancelButtonText: "취소",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setIsSubmitting(true);
      await memberApi.deactivateMember(selectedMonths);
      await showSwal(
        "success",
        "계정이 비활성화되었습니다. 지금 로그아웃되며, 다시 로그인하면 비활성화 해제 여부를 확인할 수 있습니다.",
      );
      logout();
    } catch (error: unknown) {
      console.error(error);
      await showSwal("error", readErrorMessage(error, "계정 비활성화 처리에 실패했습니다."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onCancelDeactivation = async () => {
    const result = await confirmSwal({
      icon: "question",
      title: "계정 비활성화를 해지 하시겠습니까?",
      html: "확인을 누르면 비활성화가 해제되고 다시 활동할 수 있습니다.",
      showCancelButton: true,
      confirmButtonText: "확인",
      cancelButtonText: "취소",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setIsSubmitting(true);
      await memberApi.cancelDeactivation();
      await refreshUser();
      await showSwal("success", "계정 비활성화가 해제되었습니다.");
    } catch (error: unknown) {
      console.error(error);
      await showSwal("error", readErrorMessage(error, "계정 비활성화 해제에 실패했습니다."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDeleteAccount = async () => {
    await showSwal(
      "info",
      "회원 탈퇴 버튼은 준비해두었고, 실제 탈퇴 처리 API는 아직 연결 전입니다.",
    );
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
              <div className="settings-account-panel">
                <div className="settings-section-copy">
                  <strong>계정 상태 관리</strong>
                  <p>
                    계정 비활성화는 최대 3번까지 가능하며, 기간은 현재 시점
                    기준 1개월부터 12개월까지 한 달 단위로 선택할 수 있습니다.
                  </p>
                </div>

                <div className="settings-account-list">
                  <article className="settings-account-card">
                    <div className="settings-account-copy">
                      <strong>계정 비활성화</strong>
                      <p>3번까지 비활성화 가능합니다.</p>
                      <p>
                        사용 횟수 {deactivationState.deactivateCount} / 3회
                        <br />
                        남은 횟수 {deactivationState.remainingDeactivateCount}회
                      </p>
                      {deactivationState.isDeactivate ? (
                        <p>
                          시작일 {toKoreanDateTime(deactivationState.deactivateDate)}
                          <br />
                          종료 예정일{" "}
                          {toKoreanDateTime(deactivationState.deactivateUntil)}
                        </p>
                      ) : deactivationState.deactivateCancelDate ? (
                        <p>
                          최근 해제일{" "}
                          {toKoreanDateTime(
                            deactivationState.deactivateCancelDate,
                          )}
                        </p>
                      ) : null}
                    </div>

                    <div className="settings-account-actions">
                      {!deactivationState.isDeactivate && (
                        <label className="settings-account-select-wrap">
                          <span>비활성화 기간</span>
                          <select
                            className="settings-account-select"
                            value={selectedMonths}
                            onChange={(event) =>
                              setSelectedMonths(Number(event.target.value))
                            }
                            disabled={
                              isSubmitting || !deactivationState.canDeactivate
                            }
                          >
                            {monthOptions.map((month) => (
                              <option key={month} value={month}>
                                {month}개월
                              </option>
                            ))}
                          </select>
                        </label>
                      )}

                      <button
                        type="button"
                        className={`settings-action-button ${
                          deactivationState.isDeactivate ? "is-secondary" : ""
                        }`}
                        onClick={() =>
                          void (
                            deactivationState.isDeactivate
                              ? onCancelDeactivation()
                              : onDeactivate()
                          )
                        }
                        disabled={
                          isSubmitting ||
                          (!deactivationState.isDeactivate &&
                            !deactivationState.canDeactivate)
                        }
                      >
                        {deactivationState.isDeactivate
                          ? "비활성화 해제"
                          : deactivationState.canDeactivate
                            ? "계정 비활성화"
                            : "비활성화 횟수 소진"}
                      </button>
                    </div>
                  </article>

                  <article className="settings-account-card">
                    <div className="settings-account-copy">
                      <strong>회원 탈퇴</strong>
                      <p>
                        설정 목록에서 바로 선택할 수 있도록 버튼을 두었습니다.
                        실제 탈퇴 API는 별도로 연결하면 됩니다.
                      </p>
                    </div>

                    <div className="settings-account-actions">
                      <button
                        type="button"
                        className="settings-action-button is-danger"
                        onClick={() => void onDeleteAccount()}
                      >
                        회원 탈퇴
                      </button>
                    </div>
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
