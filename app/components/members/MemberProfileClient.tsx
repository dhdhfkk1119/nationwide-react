"use client";

import "@/app/styles/main.css";
import "@/app/styles/mypage.css";
import CommunitySidebar from "@/app/components/community/CommunitySidebar";
import { confirmSwal } from "@/app/components/modal/Swal";
import { useAuth } from "@/app/providers/AuthProvider";
import { normalizeFollowStatus } from "@/app/utils/followState";
import { toProfileImageUrl, toPublicImageUrl } from "@/app/utils/imageUrl";
import memberApi from "@/service/api";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type MemberSummary = {
  memberIdx: number;
  name: string;
  nickName?: string;
  bio?: string;
  thumbnailProfileImagePath?: string;
  boardCnt: number;
  followerCnt: number;
  followingCnt: number;
  isFollowing: boolean;
  isFollowedBy: boolean;
  isMutualFollow: boolean;
};

type BoardListItem = {
  id: number;
  memberIdx: number;
  name: string;
  thumbnailProfileImagePath?: string;
  content: string;
  viewCnt: number;
  likeCnt: number;
  commentCnt: number;
  createdAt: string;
  imagePath?: string[];
};

type SliceResponse<T> = {
  content: T[];
  hasNext?: boolean;
  last?: boolean;
};

type PaginatedState<T> = {
  items: T[];
  page: number;
  hasNext: boolean;
  loading: boolean;
  loaded: boolean;
};

const PAGE_SIZE = 10;

const createPaginatedState = <T,>(): PaginatedState<T> => ({
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

export default function MemberProfileClient({ memberId }: { memberId: number }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const currentUserId =
    user && typeof user === "object"
      ? ((user as { id?: number; memberIdx?: number }).id ??
          (user as { id?: number; memberIdx?: number }).memberIdx ??
          null)
      : null;
  const [summary, setSummary] = useState<MemberSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [boardsState, setBoardsState] = useState<PaginatedState<BoardListItem>>(
    () => createPaginatedState<BoardListItem>(),
  );
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);

    try {
      const res = await memberApi.getMemberProfileSummary(memberId);
      const response = res.data?.response;
      setSummary(response ? normalizeFollowStatus(response) : null);
    } catch (error) {
      console.error(error);
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }, [memberId]);

  const loadBoards = useCallback(async (page: number) => {
    setBoardsState((prev) => ({ ...prev, loading: true }));

    try {
      const res = await memberApi.getMemberBoards(memberId, page, PAGE_SIZE);
      const response = (res.data?.response ?? {
        content: [],
        hasNext: false,
      }) as SliceResponse<BoardListItem>;

      setBoardsState((prev) => ({
        items:
          page === 0 ? response.content ?? [] : [...prev.items, ...(response.content ?? [])],
        page,
        hasNext: normalizeHasNext(response),
        loading: false,
        loaded: true,
      }));
    } catch (error) {
      console.error(error);
      setBoardsState((prev) => ({
        ...prev,
        loading: false,
        loaded: true,
        hasNext: false,
      }));
    }
  }, [memberId]);

  useEffect(() => {
    if (loading) return;
    if (!user) return;

    if (currentUserId === memberId) {
      router.replace("/mypage");
      return;
    }

    void fetchSummary();
  }, [currentUserId, fetchSummary, loading, memberId, router, user]);

  useEffect(() => {
    if (loading || !user || currentUserId === memberId) return;
    if (!boardsState.loaded && !boardsState.loading) {
      void loadBoards(0);
    }
  }, [
    boardsState.loaded,
    boardsState.loading,
    currentUserId,
    loadBoards,
    loading,
    memberId,
    user,
  ]);

  const onOpenDetail = useCallback(
    (boardId: number) => {
      router.push(`/community/${boardId}`);
    },
    [router],
  );

  const onOpenProfile = useCallback(
    (targetMemberId: number) => {
      if (currentUserId === targetMemberId) {
        router.push("/mypage");
        return;
      }

      router.push(`/members/${targetMemberId}`);
    },
    [currentUserId, router],
  );

  const onToggleFollow = useCallback(async () => {
    if (!summary || isTogglingFollow) return;

    if (summary.isFollowing) {
      const result = await confirmSwal({
        icon: "question",
        title: "팔로잉 취소",
        html: summary.isMutualFollow
          ? "서로 팔로우중입니다. 팔로잉을 취소하시겠습니까?"
          : "팔로잉을 취소하시겠습니까?",
        showCancelButton: true,
        confirmButtonText: "확인",
        cancelButtonText: "취소",
      });

      if (!result.isConfirmed) {
        return;
      }
    }

    try {
      setIsTogglingFollow(true);
      await memberApi.toggleFollow(memberId);
      await fetchSummary();
    } catch (error) {
      console.error(error);
    } finally {
      setIsTogglingFollow(false);
    }
  }, [
    fetchSummary,
    isTogglingFollow,
    memberId,
    summary,
  ]);

  const relationLabel = summary?.isMutualFollow
    ? "서로 팔로우중"
    : summary?.isFollowedBy
      ? "나를 팔로우하고있음"
      : "";

  if (loading) {
    return (
      <section className="main-page">
        <CommunitySidebar activeMenuKey="profile" />
        <div className="feed-area">
          <section className="mypage-shell">
            <p className="mypage-empty">프로필 정보를 불러오는 중입니다.</p>
          </section>
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="main-page">
        <CommunitySidebar activeMenuKey="profile" />
        <div className="feed-area">
          <section className="mypage-shell">
            <p className="mypage-empty">로그인 후 프로필을 확인할 수 있습니다.</p>
          </section>
        </div>
      </section>
    );
  }

  if (summaryLoading) {
    return (
      <section className="main-page">
        <CommunitySidebar activeMenuKey="profile" />
        <div className="feed-area">
          <section className="mypage-shell">
            <p className="mypage-empty">프로필 정보를 불러오는 중입니다.</p>
          </section>
        </div>
      </section>
    );
  }

  if (!summary) {
    return (
      <section className="main-page">
        <CommunitySidebar activeMenuKey="profile" />
        <div className="feed-area">
          <section className="mypage-shell">
            <p className="mypage-empty">프로필 정보를 불러오지 못했습니다.</p>
          </section>
        </div>
      </section>
    );
  }

  return (
    <section className="main-page">
      <CommunitySidebar activeMenuKey="profile" />
      <div className="feed-area">
        <section className="mypage-shell">
          <div className="mypage-profile-card">
            <div className="mypage-profile-image">
              <img
                src={toProfileImageUrl(summary.thumbnailProfileImagePath)}
                alt={`${summary.nickName || summary.name} profile`}
              />
            </div>

            <div className="mypage-profile-main">
              <div className="mypage-profile-name-row">
                <div>
                  <h1>{summary.nickName || summary.name}</h1>
                  <p>{summary.name}</p>
                </div>

                <div className="mypage-profile-action">
                  {relationLabel ? (
                    <span
                      className={`mypage-follow-badge ${
                        summary.isMutualFollow || summary.isFollowedBy ? "is-soft" : ""
                      }`}
                    >
                      {relationLabel}
                    </span>
                  ) : null}

                  <button
                    type="button"
                    className="mypage-edit-link"
                    onClick={() => void onToggleFollow()}
                    disabled={isTogglingFollow}
                  >
                    {summary.isFollowing ? "팔로잉" : "팔로우"}
                  </button>
                </div>
              </div>

              <div className="mypage-profile-stats">
                <span className="mypage-profile-stat">
                  <strong>{summary.boardCnt}</strong>
                  게시글
                </span>
                <span className="mypage-profile-stat">
                  <strong>{summary.followerCnt}</strong>
                  팔로워
                </span>
                <span className="mypage-profile-stat">
                  <strong>{summary.followingCnt}</strong>
                  팔로잉
                </span>
              </div>

              {summary.bio?.trim() ? (
                <div className="mypage-profile-bio">{summary.bio.trim()}</div>
              ) : null}
            </div>
          </div>

          <div className="feed-list mypage-feed-list">
            {boardsState.loaded && boardsState.items.length === 0 ? (
              <p className="mypage-empty">작성한 게시글이 없습니다.</p>
            ) : (
              boardsState.items.map((board) => {
                const previewImage = toPublicImageUrl(board.imagePath?.[0]);

                return (
                  <article
                    key={board.id}
                    className="feed-card mypage-feed-card"
                    onClick={() => onOpenDetail(board.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onOpenDetail(board.id);
                      }
                    }}
                  >
                    <div className="feed-card-header">
                      <div className="feed-author-row">
                        <button
                          type="button"
                          className="feed-author-link"
                          onClick={(event) => {
                            event.stopPropagation();
                            onOpenProfile(board.memberIdx);
                          }}
                        >
                          <img
                            src={toProfileImageUrl(board.thumbnailProfileImagePath)}
                            alt={`${board.name} profile`}
                            className="feed-profile-image"
                          />
                          <strong className="feed-author-name">{board.name}</strong>
                        </button>
                      </div>
                      <span className="feed-distance">{board.createdAt}</span>
                    </div>

                    <p className="feed-content">{board.content}</p>

                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt={`${board.name} board preview`}
                        className="feed-post-image"
                      />
                    ) : null}

                    <div
                      className="feed-actions"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <span className="mypage-feed-stat">
                        <i className="bi bi-heart"></i>
                        <span>{board.likeCnt}</span>
                      </span>
                      <span className="mypage-feed-stat">
                        <i className="bi bi-chat"></i>
                        <span>{board.commentCnt}</span>
                      </span>
                      <span className="mypage-feed-stat">
                        <i className="bi bi-eye"></i>
                        <span>{board.viewCnt}</span>
                      </span>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          {boardsState.hasNext && (
            <button
              type="button"
              className="mypage-load-more"
              onClick={() => void loadBoards(boardsState.page + 1)}
              disabled={boardsState.loading}
            >
              {boardsState.loading ? "불러오는 중..." : "게시글 더보기"}
            </button>
          )}
        </section>
      </div>
    </section>
  );
}
