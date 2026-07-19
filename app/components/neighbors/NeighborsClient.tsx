"use client";

import "@/app/styles/main.css";
import "@/app/styles/mypage.css";
import "@/app/styles/neighbors.css";
import CommunitySidebar from "@/app/components/community/CommunitySidebar";
import showSwal from "@/app/components/modal/Swal";
import { useAuth } from "@/app/providers/AuthProvider";
import { toProfileImageUrl } from "@/app/utils/imageUrl";
import memberApi from "@/service/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const RADIUS_PRESETS = [1, 5, 10, 50, 100];
const PAGE_SIZE = 20;

type NearbyMember = {
  memberIdx: number;
  name: string;
  nickName?: string;
  bio?: string;
  thumbnailProfileImagePath?: string;
  distanceKm: number;
  canMessage?: boolean;
  isFollowing?: boolean;
};

type ViewerUser = { hasCurrentLocation?: boolean };

export default function NeighborsClient() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const hasCurrentLocation = Boolean(((user ?? {}) as ViewerUser).hasCurrentLocation);

  const [radiusKm, setRadiusKm] = useState(1);
  const [isCustom, setIsCustom] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [items, setItems] = useState<NearbyMember[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const loadPage = useCallback(
    async (targetPage: number) => {
      setIsLoading(true);
      try {
        const res = await memberApi.getNearbyMembers(radiusKm, targetPage, PAGE_SIZE);
        const response = (res.data?.response ?? { content: [], hasNext: false }) as {
          content: NearbyMember[];
          hasNext: boolean;
        };
        setItems((prev) =>
          targetPage === 0 ? response.content ?? [] : [...prev, ...(response.content ?? [])],
        );
        setHasNext(Boolean(response.hasNext));
        setPage(targetPage);
        setFetchError("");
      } catch (error: any) {
        console.error(error);
        setItems([]);
        setHasNext(false);
        setFetchError(error?.response?.data?.error?.message || "동네 사람을 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    },
    [radiusKm],
  );

  useEffect(() => {
    if (loading || !user || !hasCurrentLocation) return;
    void loadPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radiusKm, hasCurrentLocation, loading, user]);

  const onSelectPreset = (value: number) => {
    setIsCustom(false);
    setRadiusKm(value);
  };

  const onApplyCustom = () => {
    const value = Number(customInput);
    if (!Number.isFinite(value) || value < 1 || value > 1000) {
      return;
    }
    setRadiusKm(Math.round(value));
  };

  const onSliderChange = (value: number) => {
    setCustomInput(String(value));
    setRadiusKm(value);
  };

  const onFollowUser = useCallback(async (event: React.MouseEvent, memberIdx: number) => {
    event.stopPropagation();
    try {
      await memberApi.toggleFollow(memberIdx);
      setItems((prev) =>
        prev.map((item) =>
          item.memberIdx === memberIdx ? { ...item, isFollowing: true } : item,
        ),
      );
    } catch (error) {
      console.error("팔로우 처리 실패:", error);
      showSwal("error", "팔로우 처리에 실패했습니다.");
    }
  }, []);

  const onMessageUser = useCallback(
    async (event: React.MouseEvent, memberIdx: number) => {
      event.stopPropagation();
      try {
        await memberApi.createOrGetThread(memberIdx);
        router.push(`/dm?target=${memberIdx}`);
      } catch (error: any) {
        showSwal(
          "error",
          error?.response?.data?.error?.message || "메시지를 보낼 수 없습니다.",
        );
      }
    },
    [router],
  );

  return (
    <section className="main-page">
      <CommunitySidebar activeMenuKey="neighbors" />

      <div className="feed-area">
        <section className="mypage-shell">
          <h1>동네 친구</h1>

          <div className="feed-search-tabs" role="tablist" aria-label="반경 선택">
            {RADIUS_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                className={`feed-search-tab ${!isCustom && radiusKm === preset ? "is-active" : ""}`}
                onClick={() => onSelectPreset(preset)}
              >
                {preset}km
              </button>
            ))}
            <button
              type="button"
              className={`feed-search-tab ${isCustom ? "is-active" : ""}`}
              onClick={() => setIsCustom(true)}
            >
              사용자 지정
            </button>
          </div>

          {isCustom ? (
            <div className="neighbors-custom-radius">
              <div className="neighbors-custom-radius-row">
                <input
                  type="number"
                  min={1}
                  max={1000}
                  placeholder="1~1000"
                  value={customInput}
                  onChange={(event) => setCustomInput(event.target.value)}
                />
                <span>km</span>
                <button type="button" className="settings-action-button" onClick={onApplyCustom}>
                  적용
                </button>
              </div>

              <input
                type="range"
                className="neighbors-custom-radius-slider"
                min={1}
                max={1000}
                value={Number(customInput) || radiusKm}
                onChange={(event) => onSliderChange(Number(event.target.value))}
              />
            </div>
          ) : null}

          {loading ? (
            <p className="mypage-empty">불러오는 중입니다.</p>
          ) : !user ? (
            <p className="mypage-empty">로그인 후 이용할 수 있습니다.</p>
          ) : !hasCurrentLocation ? (
            <p className="mypage-empty">
              먼저 현재 위치를 설정해주세요.{" "}
              <Link href="/settings/location-distance">위치 설정하러 가기</Link>
            </p>
          ) : (
            <>
              <div className="mypage-follow-list">
                {!isLoading && fetchError && <p className="mypage-empty">{fetchError}</p>}
                {!isLoading && !fetchError && items.length === 0 && (
                  <p className="mypage-empty">반경 {radiusKm}km 안에 동네 사람이 없습니다.</p>
                )}

                {items.map((item) => (
                  <div key={item.memberIdx} className="mypage-follow-item">
                    <button
                      type="button"
                      className="mypage-follow-item-main"
                      onClick={() => router.push(`/members/${item.memberIdx}`)}
                    >
                      <img
                        src={toProfileImageUrl(item.thumbnailProfileImagePath)}
                        alt={`${item.nickName || item.name} profile`}
                        className="mypage-follow-image"
                      />
                      <div className="mypage-follow-meta">
                        <strong>{item.nickName || item.name}</strong>
                        {item.bio?.trim() ? <p>{item.bio.trim()}</p> : null}
                      </div>
                    </button>

                    <div className="neighbors-item-actions">
                      {!item.isFollowing ? (
                        <button
                          type="button"
                          className="follow-plus-btn"
                          onClick={(event) => onFollowUser(event, item.memberIdx)}
                        >
                          +
                        </button>
                      ) : null}
                      {item.canMessage ? (
                        <button
                          type="button"
                          className="neighbors-message-btn"
                          aria-label="메시지 보내기"
                          onClick={(event) => onMessageUser(event, item.memberIdx)}
                        >
                          <i className="bi bi-chat-dots"></i>
                        </button>
                      ) : null}
                      <span className="feed-follow-status is-soft">{item.distanceKm}km</span>
                    </div>
                  </div>
                ))}
              </div>

              {hasNext && (
                <button
                  type="button"
                  className="mypage-load-more"
                  onClick={() => void loadPage(page + 1)}
                  disabled={isLoading}
                >
                  {isLoading ? "불러오는 중..." : "더 보기"}
                </button>
              )}
            </>
          )}
        </section>
      </div>
    </section>
  );
}
