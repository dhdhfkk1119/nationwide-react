"use client";

import "@/app/styles/main.css";
import "@/app/styles/settings.css";
import CommunitySidebar from "@/app/components/community/CommunitySidebar";
import { useAuth } from "@/app/providers/AuthProvider";
import { useLocale } from "@/app/providers/LocaleProvider";
import { toProfileImageUrl } from "@/app/utils/imageUrl";
import memberApi from "@/service/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type BlockedUsersTab = "BLOCKED" | "HIDDEN";

type ListItem = {
  memberIdx: number;
  name: string;
  nickName?: string;
  thumbnailProfileImagePath?: string;
  blockedAt?: string;
  hiddenAt?: string;
};

type SliceResponse<T> = {
  content: T[];
};

const formatDate = (value?: string) => {
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

const PAGE_SIZE = 20;

export default function BlockedUsersSettingsClient() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { messages } = useLocale();
  const item = messages.settings.menu["blocked-users"];

  const [activeTab, setActiveTab] = useState<BlockedUsersTab>("BLOCKED");
  const [items, setItems] = useState<ListItem[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [pendingIds, setPendingIds] = useState<number[]>([]);

  const loadItems = useCallback(async (tab: BlockedUsersTab) => {
    try {
      setIsFetching(true);
      setFetchError("");
      const res =
        tab === "BLOCKED"
          ? await memberApi.getBlockedUsers(0, PAGE_SIZE)
          : await memberApi.getHiddenUsers(0, PAGE_SIZE);
      const response = (res.data?.response ?? { content: [] }) as SliceResponse<ListItem>;
      setItems(Array.isArray(response.content) ? response.content : []);
    } catch (error) {
      console.error(error);
      setItems([]);
      setFetchError("목록을 불러오지 못했습니다.");
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    void loadItems(activeTab);
  }, [activeTab, loadItems, user]);

  const onRelease = useCallback(
    async (targetMemberId: number) => {
      if (pendingIds.includes(targetMemberId)) return;

      setPendingIds((prev) => [...prev, targetMemberId]);

      try {
        // API: POST /api/blocks/{targetMemberId}/toggle, /api/post-hides/{targetMemberId}/toggle -> 토글이므로 재호출 시 해제됨
        if (activeTab === "BLOCKED") {
          await memberApi.toggleBlock(targetMemberId);
        } else {
          await memberApi.toggleHideMyPosts(targetMemberId);
        }
        setItems((prev) => prev.filter((entry) => entry.memberIdx !== targetMemberId));
      } catch (error) {
        console.error(error);
      } finally {
        setPendingIds((prev) => prev.filter((id) => id !== targetMemberId));
      }
    },
    [activeTab, pendingIds],
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
                로그인 후 이용할 수 있습니다.
              </div>
            ) : (
              <div className="settings-account-panel">
                <div className="feed-search-tabs" role="tablist" aria-label="차단/숨기기 유저">
                  <button
                    type="button"
                    className={`feed-search-tab ${activeTab === "BLOCKED" ? "is-active" : ""}`}
                    onClick={() => setActiveTab("BLOCKED")}
                  >
                    차단 유저
                  </button>
                  <button
                    type="button"
                    className={`feed-search-tab ${activeTab === "HIDDEN" ? "is-active" : ""}`}
                    onClick={() => setActiveTab("HIDDEN")}
                  >
                    숨기기 한 유저
                  </button>
                </div>

                <div className="settings-account-list">
                  {isFetching && <div className="settings-empty-card">불러오는 중입니다.</div>}
                  {!isFetching && fetchError && (
                    <div className="settings-empty-card">{fetchError}</div>
                  )}
                  {!isFetching && !fetchError && items.length === 0 && (
                    <div className="settings-empty-card">
                      {activeTab === "BLOCKED" ? "차단한 유저가 없습니다." : "숨기기 한 유저가 없습니다."}
                    </div>
                  )}

                  {!isFetching &&
                    !fetchError &&
                    items.map((entry) => (
                      <article key={entry.memberIdx} className="settings-account-card">
                        <button
                          type="button"
                          className="settings-account-copy settings-account-copy-clickable"
                          onClick={() => router.push(`/members/${entry.memberIdx}`)}
                        >
                          <strong>{entry.nickName || entry.name}</strong>
                          <p>
                            {activeTab === "BLOCKED" ? "차단일" : "숨김일"}:{" "}
                            {formatDate(activeTab === "BLOCKED" ? entry.blockedAt : entry.hiddenAt)}
                          </p>
                        </button>

                        <div className="settings-account-actions">
                          <img
                            src={toProfileImageUrl(entry.thumbnailProfileImagePath)}
                            alt={`${entry.nickName || entry.name} profile`}
                            className="settings-account-avatar"
                          />
                          <button
                            type="button"
                            className="settings-action-button is-secondary"
                            onClick={() => void onRelease(entry.memberIdx)}
                            disabled={pendingIds.includes(entry.memberIdx)}
                          >
                            {activeTab === "BLOCKED" ? "차단 해제" : "숨김 해제"}
                          </button>
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
