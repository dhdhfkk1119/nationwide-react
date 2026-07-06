"use client";

import "@/app/styles/main.css";
import "@/app/styles/settings.css";
import { useRouter } from "next/navigation";
import CommunitySidebar from "@/app/components/community/CommunitySidebar";
import { formatMessage } from "@/app/i18n/messages";
import { useAuth } from "@/app/providers/AuthProvider";
import { useLocale } from "@/app/providers/LocaleProvider";
import { toPublicImageUrl } from "@/app/utils/imageUrl";
import memberApi from "@/service/api";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type ReportTab = "BOARD" | "COMMENT";

type ReportItem = {
  reportId: number;
  targetType: ReportTab;
  targetId: number;
  status: "RECEIVED" | "APPROVED" | "REJECTED";
  reporterComment: string;
  adminComment?: string | null;
  createdAt: string;
  processedAt?: string | null;
  targetContent: string;
  boardId?: number;
  targetImagePath?: string | null;
};

type ReportResponse = {
  items: ReportItem[];
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
};

const statusLabelMap: Record<ReportItem["status"], string> = {
  RECEIVED: "접수",
  APPROVED: "처리",
  REJECTED: "반려",
};

export default function ReportStatusSettingsClient() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { messages } = useLocale();
  const item = messages.settings.menu["report-status"];

  const [activeTab, setActiveTab] = useState<ReportTab>("BOARD");
  const [items, setItems] = useState<ReportItem[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    void (async () => {
      try {
        setIsFetching(true);
        setFetchError("");
        const res = await memberApi.getMyReports(activeTab);
        if (cancelled) return;

        const response = (res.data?.response ?? { items: [] }) as ReportResponse;
        setItems(Array.isArray(response.items) ? response.items : []);
      } catch (error) {
        if (cancelled) return;
        console.error(error);
        setItems([]);
        setFetchError("신고 현황을 불러오지 못했습니다.");
      } finally {
        if (!cancelled) {
          setIsFetching(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, user]);

  const onOpenReportTarget = useCallback(
    (report: ReportItem) => {
      const boardId = report.targetType === "BOARD" ? (report.boardId ?? report.targetId) : report.boardId;
      if (!boardId) return;

      const href =
        report.targetType === "BOARD"
          ? `/community/${boardId}`
          : `/community/${boardId}?highlightCommentId=${report.targetId}`;

      router.push(href);
    },
    [router],
  );

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
                <div className="feed-search-tabs" role="tablist" aria-label="신고 대상">
                  <button
                    type="button"
                    className={`feed-search-tab ${activeTab === "BOARD" ? "is-active" : ""}`}
                    onClick={() => setActiveTab("BOARD")}
                  >
                    게시물 신고
                  </button>
                  <button
                    type="button"
                    className={`feed-search-tab ${activeTab === "COMMENT" ? "is-active" : ""}`}
                    onClick={() => setActiveTab("COMMENT")}
                  >
                    댓글 신고
                  </button>
                </div>

                <div className="settings-account-list">
                  {isFetching && <div className="settings-empty-card">신고 현황을 불러오는 중입니다.</div>}
                  {!isFetching && fetchError && (
                    <div className="settings-empty-card">{fetchError}</div>
                  )}
                  {!isFetching && !fetchError && items.length === 0 && (
                    <div className="settings-empty-card">접수된 신고 내역이 없습니다.</div>
                  )}

                  {!isFetching &&
                    !fetchError &&
                    items.map((report) => (
                      <article
                        key={report.reportId}
                        className="settings-account-card settings-account-card-clickable"
                        role="button"
                        tabIndex={0}
                        onClick={() => onOpenReportTarget(report)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            onOpenReportTarget(report);
                          }
                        }}
                      >
                        <div className="settings-account-copy">
                          <strong>
                            {activeTab === "BOARD" ? "게시물 신고" : "댓글 신고"} / {statusLabelMap[report.status]}
                          </strong>
                          <p>{report.targetContent}</p>
                          <p>신고 내용: {report.reporterComment}</p>
                          <p>접수일: {formatDate(report.createdAt)}</p>
                          {report.processedAt ? <p>처리일: {formatDate(report.processedAt)}</p> : null}
                          {report.adminComment ? <p>관리자 사유: {report.adminComment}</p> : null}
                        </div>

                        <div className="settings-account-actions">
                          {report.targetImagePath ? (
                            <img
                              src={toPublicImageUrl(report.targetImagePath, "")}
                              alt="reported target"
                              className="settings-report-thumbnail"
                            />
                          ) : (
                            <span className="feed-user-action">{statusLabelMap[report.status]}</span>
                          )}
                        </div>
                      </article>
                    ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
