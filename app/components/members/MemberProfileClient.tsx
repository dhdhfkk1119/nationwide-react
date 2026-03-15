"use client";

import "@/app/styles/main.css";
import "@/app/styles/mypage.css";
import CommunitySidebar from "@/app/components/community/CommunitySidebar";
import FollowListSection, {
  type FollowMemberItem,
} from "@/app/components/members/FollowListSection";
import { confirmSwal } from "@/app/components/modal/Swal";
import { useAuth } from "@/app/providers/AuthProvider";
import { normalizeFollowStatus } from "@/app/utils/followState";
import { toProfileImageUrl, toPublicImageUrl } from "@/app/utils/imageUrl";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import memberApi from "@/service/api";

type TabKey = "boards" | "followers" | "following";

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
  hasPendingFollowRequest?: boolean;
  canViewProfile?: boolean;
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

  const [activeTab, setActiveTab] = useState<TabKey>("boards");
  const [summary, setSummary] = useState<MemberSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [boardsState, setBoardsState] = useState<PaginatedState<BoardListItem>>(
    () => createPaginatedState<BoardListItem>(),
  );
  const [followerState, setFollowerState] = useState<PaginatedState<FollowMemberItem>>(
    () => createPaginatedState<FollowMemberItem>(),
  );
  const [followingState, setFollowingState] = useState<PaginatedState<FollowMemberItem>>(
    () => createPaginatedState<FollowMemberItem>(),
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

  const loadBoards = useCallback(
    async (page: number) => {
      setBoardsState((prev) => ({ ...prev, loading: true }));

      try {
        const res = await memberApi.getMemberBoards(memberId, page, PAGE_SIZE);
        const response = (res.data?.response ?? {
          content: [],
          hasNext: false,
        }) as SliceResponse<BoardListItem>;

        setBoardsState((prev) => ({
          items:
            page === 0
              ? response.content ?? []
              : [...prev.items, ...(response.content ?? [])],
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
    },
    [memberId],
  );

  const loadFollowers = useCallback(
    async (page: number) => {
      setFollowerState((prev) => ({ ...prev, loading: true }));

      try {
        const res = await memberApi.getFollowers(memberId, page, PAGE_SIZE);
        const response = (res.data?.response ?? {
          content: [],
          hasNext: false,
        }) as SliceResponse<FollowMemberItem>;

        setFollowerState((prev) => ({
          items:
            page === 0
              ? (response.content ?? []).map(normalizeFollowStatus)
              : [...prev.items, ...(response.content ?? []).map(normalizeFollowStatus)],
          page,
          hasNext: normalizeHasNext(response),
          loading: false,
          loaded: true,
        }));
      } catch (error) {
        console.error(error);
        setFollowerState((prev) => ({
          ...prev,
          loading: false,
          loaded: true,
          hasNext: false,
        }));
      }
    },
    [memberId],
  );

  const loadFollowing = useCallback(
    async (page: number) => {
      setFollowingState((prev) => ({ ...prev, loading: true }));

      try {
        const res = await memberApi.getFollowing(memberId, page, PAGE_SIZE);
        const response = (res.data?.response ?? {
          content: [],
          hasNext: false,
        }) as SliceResponse<FollowMemberItem>;

        setFollowingState((prev) => ({
          items:
            page === 0
              ? (response.content ?? []).map(normalizeFollowStatus)
              : [...prev.items, ...(response.content ?? []).map(normalizeFollowStatus)],
          page,
          hasNext: normalizeHasNext(response),
          loading: false,
          loaded: true,
        }));
      } catch (error) {
        console.error(error);
        setFollowingState((prev) => ({
          ...prev,
          loading: false,
          loaded: true,
          hasNext: false,
        }));
      }
    },
    [memberId],
  );

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

    if (activeTab === "boards" && !boardsState.loaded && !boardsState.loading) {
      void loadBoards(0);
    }

    if (activeTab === "followers" && !followerState.loaded && !followerState.loading) {
      void loadFollowers(0);
    }

    if (activeTab === "following" && !followingState.loaded && !followingState.loading) {
      void loadFollowing(0);
    }
  }, [
    activeTab,
    boardsState.loaded,
    boardsState.loading,
    currentUserId,
    followerState.loaded,
    followerState.loading,
    followingState.loaded,
    followingState.loading,
    loadBoards,
    loadFollowers,
    loadFollowing,
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

  const syncFollowMember = useCallback(
    (targetMemberId: number, nextState: Pick<
      FollowMemberItem,
      "isFollowing" | "isFollowedBy" | "isMutualFollow"
    >) => {
      setFollowerState((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.memberIdx !== targetMemberId ? item : { ...item, ...nextState },
        ),
      }));
      setFollowingState((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.memberIdx !== targetMemberId ? item : { ...item, ...nextState },
        ),
      }));
    },
    [],
  );

  const onToggleFollow = useCallback(async () => {
    if (!summary || isTogglingFollow) return;

    if (summary.isFollowing) {
      const result = await confirmSwal({
        icon: "question",
        title: "팔로우 취소",
        html: summary.isMutualFollow
          ? "서로 팔로우 중입니다. 팔로잉을 취소하시겠습니까?"
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
  }, [fetchSummary, isTogglingFollow, memberId, summary]);

  const onToggleFollowMember = useCallback(
    async (item: FollowMemberItem) => {
      if (item.isFollowing) {
        const result = await confirmSwal({
          icon: "question",
          title: "팔로우 취소",
          html: item.isMutualFollow
            ? "서로 팔로우 중입니다. 팔로잉을 취소하시겠습니까?"
            : "팔로잉을 취소하시겠습니까?",
          showCancelButton: true,
          confirmButtonText: "확인",
          cancelButtonText: "취소",
        });

        if (!result.isConfirmed) {
          return;
        }
      }

      const res = await memberApi.toggleFollow(item.memberIdx);
      const nextState = normalizeFollowStatus(res.data?.response);

      syncFollowMember(item.memberIdx, {
        isFollowing: nextState.isFollowing,
        isFollowedBy: nextState.isFollowedBy,
        isMutualFollow: nextState.isMutualFollow,
      });
    },
    [syncFollowMember],
  );

  const relationLabel = summary?.isMutualFollow
    ? "서로 팔로우 중"
    : summary?.isFollowedBy
      ? "나를 팔로우 중"
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
                    {summary.isFollowing
                      ? "팔로잉"
                      : summary.hasPendingFollowRequest
                        ? "요청됨"
                        : "팔로우"}
                  </button>
                </div>
              </div>

              <div className="mypage-profile-stats">
                <button
                  type="button"
                  className="mypage-stat-button"
                  onClick={() => setActiveTab("boards")}
                >
                  <strong>{summary.boardCnt}</strong>
                  게시글
                </button>
                <button
                  type="button"
                  className="mypage-stat-button"
                  onClick={() => setActiveTab("followers")}
                >
                  <strong>{summary.followerCnt}</strong>
                  팔로워
                </button>
                <button
                  type="button"
                  className="mypage-stat-button"
                  onClick={() => setActiveTab("following")}
                >
                  <strong>{summary.followingCnt}</strong>
                  팔로잉
                </button>
              </div>

              {summary.bio?.trim() ? (
                <div className="mypage-profile-bio">{summary.bio.trim()}</div>
              ) : null}
            </div>
          </div>

          <div className="mypage-tabs">
            <button
              type="button"
              className={activeTab === "boards" ? "is-active" : ""}
              onClick={() => setActiveTab("boards")}
            >
              게시글
            </button>
            <button
              type="button"
              className={activeTab === "followers" ? "is-active" : ""}
              onClick={() => setActiveTab("followers")}
            >
              팔로워
            </button>
            <button
              type="button"
              className={activeTab === "following" ? "is-active" : ""}
              onClick={() => setActiveTab("following")}
            >
              팔로잉
            </button>
          </div>

          {activeTab === "boards" && (
            <>
              <div className="feed-list mypage-feed-list">
                {summary.canViewProfile === false ? (
                  <p className="mypage-empty">비공개 프로필입니다. 요청이 수락되면 게시글을 볼 수 있습니다.</p>
                ) : boardsState.loaded && boardsState.items.length === 0 ? (
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

                        <div className="feed-actions" onClick={(event) => event.stopPropagation()}>
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

              {summary.canViewProfile !== false && boardsState.hasNext && (
                <button
                  type="button"
                  className="mypage-load-more"
                  onClick={() => void loadBoards(boardsState.page + 1)}
                  disabled={boardsState.loading}
                >
                  {boardsState.loading ? "불러오는 중..." : "게시글 더 보기"}
                </button>
              )}
            </>
          )}

          {activeTab === "followers" && (
            <>
              <FollowListSection
                items={followerState.items}
                emptyMessage="팔로워가 없습니다."
                onOpenProfile={onOpenProfile}
                currentUserId={currentUserId}
                onToggleFollow={onToggleFollowMember}
              />

              {followerState.hasNext && (
                <button
                  type="button"
                  className="mypage-load-more"
                  onClick={() => void loadFollowers(followerState.page + 1)}
                  disabled={followerState.loading}
                >
                  {followerState.loading ? "불러오는 중..." : "팔로워 더 보기"}
                </button>
              )}
            </>
          )}

          {activeTab === "following" && (
            <>
              <FollowListSection
                items={followingState.items}
                emptyMessage="팔로잉이 없습니다."
                onOpenProfile={onOpenProfile}
                currentUserId={currentUserId}
                onToggleFollow={onToggleFollowMember}
              />

              {followingState.hasNext && (
                <button
                  type="button"
                  className="mypage-load-more"
                  onClick={() => void loadFollowing(followingState.page + 1)}
                  disabled={followingState.loading}
                >
                  {followingState.loading ? "불러오는 중..." : "팔로잉 더 보기"}
                </button>
              )}
            </>
          )}
        </section>
      </div>
    </section>
  );
}
