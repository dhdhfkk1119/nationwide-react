"use client";

import "@/app/styles/main.css";
import "@/app/styles/notifications.css";
import CommunitySidebar from "@/app/components/community/CommunitySidebar";
import { useAuth } from "@/app/providers/AuthProvider";
import { useAlarm } from "@/app/providers/AlarmProvider";
import { toProfileImageUrl, toPublicImageUrl } from "@/app/utils/imageUrl";
import memberApi from "@/service/api";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type AlarmItem = {
  alarmIdx: number;
  type: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  actorMemberIdx: number;
  actorName: string;
  actorThumbnailProfileImagePath?: string;
  boardIdx?: number | null;
  boardThumbnailImagePath?: string | null;
};

type SliceResponse<T> = {
  content: T[];
  hasNext?: boolean;
  last?: boolean;
};

type AlarmState = {
  items: AlarmItem[];
  page: number;
  hasNext: boolean;
  loading: boolean;
  loaded: boolean;
};

const PAGE_SIZE = 20;

const createState = (): AlarmState => ({
  items: [],
  page: -1,
  hasNext: true,
  loading: false,
  loaded: false,
});

const normalizeHasNext = <T,>(slice: SliceResponse<T>) => {
  if (typeof slice.hasNext === "boolean") return slice.hasNext;
  if (typeof slice.last === "boolean") return !slice.last;
  return slice.content.length === PAGE_SIZE;
};

export default function NotificationsClient() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { latestAlarm, markAlarmRead } = useAlarm();
  const currentUserId =
    user && typeof user === "object"
      ? ((user as { id?: number; memberIdx?: number }).id ??
          (user as { id?: number; memberIdx?: number }).memberIdx ??
          null)
      : null;
  const [alarmState, setAlarmState] = useState<AlarmState>(() => createState());

  const loadAlarms = useCallback(async (page: number) => {
    setAlarmState((prev) => ({ ...prev, loading: true }));

    try {
      const res = await memberApi.getAlarms(page, PAGE_SIZE);
      const response = (res.data?.response ?? {
        content: [],
        hasNext: false,
      }) as SliceResponse<AlarmItem>;

      setAlarmState((prev) => ({
        items:
          page === 0 ? response.content ?? [] : [...prev.items, ...(response.content ?? [])],
        page,
        hasNext: normalizeHasNext(response),
        loading: false,
        loaded: true,
      }));
    } catch (error) {
      console.error("알림 목록 조회 실패:", error);
      setAlarmState((prev) => ({
        ...prev,
        loading: false,
        loaded: true,
        hasNext: false,
      }));
    }
  }, []);

  useEffect(() => {
    if (loading || !user) return;
    if (!alarmState.loaded && !alarmState.loading) {
      const timeoutId = window.setTimeout(() => {
        void loadAlarms(0);
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, [alarmState.loaded, alarmState.loading, loadAlarms, loading, user]);

  useEffect(() => {
    if (!latestAlarm) return;

    const timeoutId = window.setTimeout(() => {
      setAlarmState((prev) => {
        if (prev.items.some((item) => item.alarmIdx === latestAlarm.alarmIdx)) {
          return prev;
        }

        return {
          ...prev,
          items: [latestAlarm, ...prev.items],
          loaded: true,
        };
      });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [latestAlarm]);

  const onOpenProfile = useCallback(
    (memberId: number) => {
      if (currentUserId === memberId) {
        router.push("/mypage");
        return;
      }

      router.push(`/members/${memberId}`);
    },
    [currentUserId, router],
  );

  const onOpenAlarm = useCallback(
    async (item: AlarmItem) => {
      try {
        if (!item.isRead) {
          await memberApi.readAlarm(item.alarmIdx);
          markAlarmRead(item.alarmIdx);
          setAlarmState((prev) => ({
            ...prev,
            items: prev.items.map((alarm) =>
              alarm.alarmIdx !== item.alarmIdx ? alarm : { ...alarm, isRead: true },
            ),
          }));
        }
      } catch (error) {
        console.error("알림 읽음 처리 실패:", error);
      }

      if (item.boardIdx) {
        router.push(`/community/${item.boardIdx}`);
        return;
      }

      onOpenProfile(item.actorMemberIdx);
    },
    [markAlarmRead, onOpenProfile, router],
  );

  if (loading) {
    return (
      <section className="main-page">
        <CommunitySidebar activeMenuKey="notification" />
        <div className="feed-area">
          <section className="notifications-shell">
            <p className="mypage-empty">알림 정보를 불러오는 중입니다.</p>
          </section>
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="main-page">
        <CommunitySidebar activeMenuKey="notification" />
        <div className="feed-area">
          <section className="notifications-shell">
            <p className="mypage-empty">로그인 후 알림을 확인할 수 있습니다.</p>
          </section>
        </div>
      </section>
    );
  }

  return (
    <section className="main-page">
      <CommunitySidebar activeMenuKey="notification" />
      <div className="feed-area">
        <section className="notifications-shell">
          <header className="notifications-header">
            <h1>알림</h1>
            <p>나를 팔로우하거나, 내 게시글과 댓글에 반응한 내역을 확인합니다.</p>
          </header>

          <div className="notifications-list">
            {alarmState.loaded && alarmState.items.length === 0 ? (
              <p className="mypage-empty">도착한 알림이 없습니다.</p>
            ) : (
              alarmState.items.map((item) => (
                <article
                  key={item.alarmIdx}
                  className={`notification-item ${item.isRead ? "" : "is-unread"}`}
                  onClick={() => void onOpenAlarm(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      void onOpenAlarm(item);
                    }
                  }}
                >
                  <button
                    type="button"
                    className="notification-actor"
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenProfile(item.actorMemberIdx);
                    }}
                  >
                    <img
                      src={toProfileImageUrl(item.actorThumbnailProfileImagePath)}
                      alt={`${item.actorName} profile`}
                      className="notification-actor-image"
                    />
                  </button>

                  <div className="notification-content">
                    <p>{item.message}</p>
                    <span>{item.createdAt}</span>
                  </div>

                  {item.boardThumbnailImagePath ? (
                    <img
                      src={toPublicImageUrl(item.boardThumbnailImagePath)}
                      alt="알림 관련 게시글 이미지"
                      className="notification-board-image"
                    />
                  ) : (
                    <div className="notification-board-image placeholder"></div>
                  )}
                </article>
              ))
            )}
          </div>

          {alarmState.hasNext && (
            <button
              type="button"
              className="mypage-load-more"
              onClick={() => void loadAlarms(alarmState.page + 1)}
              disabled={alarmState.loading}
            >
              {alarmState.loading ? "불러오는 중..." : "알림 더보기"}
            </button>
          )}
        </section>
      </div>
    </section>
  );
}
