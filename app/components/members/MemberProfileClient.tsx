"use client";

import "@/app/styles/main.css";
import "@/app/styles/mypage.css";
import CommunitySidebar from "@/app/components/community/CommunitySidebar";
import FollowListSection, {
  type FollowMemberItem,
} from "@/app/components/members/FollowListSection";
import AccountInfoModal from "@/app/components/modal/AccountInfoModal";
import openReportPrompt from "@/app/components/modal/openReportPrompt";
import showSwal, { confirmSwal } from "@/app/components/modal/Swal";
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
  isBlocking?: boolean;
  isBlockedByOther?: boolean;
  isHidingFromOther?: boolean;
  createdAt?: string;
  location?: string;
  isPhoneVerified?: boolean;
  canMessage?: boolean;
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
  const [isTogglingBlock, setIsTogglingBlock] = useState(false);
  const [isTogglingHide, setIsTogglingHide] = useState(false);
  const [showAccountInfo, setShowAccountInfo] = useState(false);

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

  const onMessageUser = useCallback(async () => {
    try {
      await memberApi.createOrGetThread(memberId);
      router.push(`/dm?target=${memberId}`);
    } catch (error: any) {
      showSwal(
        "error",
        error?.response?.data?.error?.message || "메시지를 보낼 수 없습니다.",
      );
    }
  }, [memberId, router]);

  const onToggleBlock = useCallback(async () => {
    if (!summary || isTogglingBlock) return;

    const willBlock = !summary.isBlocking;
    const result = await confirmSwal({
      icon: "warning",
      title: willBlock ? "차단" : "차단 해제",
      html: willBlock
        ? "차단하시겠습니까? 차단하면 서로의 프로필과 게시물이 보이지 않게 됩니다."
        : "차단을 해제하시겠습니까?",
      showCancelButton: true,
      confirmButtonText: "확인",
      cancelButtonText: "취소",
    });

    if (!result.isConfirmed) return;

    try {
      setIsTogglingBlock(true);
      // API: POST /api/blocks/{targetMemberId}/toggle -> 차단/차단 해제 토글
      await memberApi.toggleBlock(memberId);

      if (willBlock) {
        await showSwal("success", "차단했습니다.");
        router.push("/");
        return;
      }

      await showSwal("success", "차단을 해제했습니다.");
      await fetchSummary();
    } catch (error: any) {
      showSwal("error", error?.response?.data?.error?.message || "요청 처리에 실패했습니다.");
    } finally {
      setIsTogglingBlock(false);
    }
  }, [fetchSummary, isTogglingBlock, memberId, router, summary]);

  const onToggleHide = useCallback(async () => {
    if (!summary || isTogglingHide) return;

    const willHide = !summary.isHidingFromOther;
    const result = await confirmSwal({
      icon: "question",
      title: willHide ? "내 게시물 숨기기" : "게시물 숨기기 해제",
      html: willHide
        ? "이 사용자에게 내 게시물과 댓글을 숨기시겠습니까?"
        : "게시물 숨기기를 해제하시겠습니까?",
      showCancelButton: true,
      confirmButtonText: "확인",
      cancelButtonText: "취소",
    });

    if (!result.isConfirmed) return;

    try {
      setIsTogglingHide(true);
      // API: POST /api/post-hides/{targetMemberId}/toggle -> 게시물 숨기기 토글
      await memberApi.toggleHideMyPosts(memberId);
      await showSwal("success", willHide ? "게시물을 숨겼습니다." : "게시물 숨기기를 해제했습니다.");
      await fetchSummary();
    } catch (error: any) {
      showSwal("error", error?.response?.data?.error?.message || "요청 처리에 실패했습니다.");
    } finally {
      setIsTogglingHide(false);
    }
  }, [fetchSummary, isTogglingHide, memberId, summary]);

  const onReportMember = useCallback(async () => {
    if (!summary) return;

    // API: POST /api/reports/members/{memberId} { reporterComment } -> 유저 신고 접수
    const reporterComment = await openReportPrompt({
      title: "유저 신고",
      targetLabel: summary.nickName || summary.name,
      content: summary.bio ?? "",
    });

    if (!reporterComment) return;

    try {
      await memberApi.reportMember(memberId, reporterComment);
      await showSwal("success", "신고가 접수되었습니다.");
    } catch (error: any) {
      showSwal("error", error?.response?.data?.error?.message || "신고 접수에 실패했습니다.");
    }
  }, [memberId, summary]);

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

  if (summary.isBlockedByOther) {
    return (
      <section className="main-page">
        <CommunitySidebar activeMenuKey="profile" />
        <div className="feed-area">
          <section className="mypage-shell">
            <p className="mypage-empty">차단된 사용자입니다.</p>
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

                  {summary.canMessage ? (
                    <button
                      type="button"
                      className="member-profile-message-btn"
                      aria-label="메시지 보내기"
                      onClick={() => void onMessageUser()}
                    >
                      <i className="bi bi-chat-dots"></i>
                    </button>
                  ) : null}

                  <details className="member-profile-menu">
                    <summary className="member-profile-menu-trigger" aria-label="프로필 메뉴 열기">
                      <i className="bi bi-three-dots"></i>
                    </summary>
                    <ul className="member-profile-menu-list">
                      <li>
                        <button
                          type="button"
                          onClick={() => void onToggleBlock()}
                          disabled={isTogglingBlock}
                        >
                          {summary.isBlocking ? "차단 해제" : "차단"}
                        </button>
                      </li>
                      <li>
                        <button type="button" onClick={() => void onReportMember()}>
                          신고
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          onClick={() => void onToggleHide()}
                          disabled={isTogglingHide}
                        >
                          {summary.isHidingFromOther ? "게시물 숨기기 해제" : "내 게시물 숨기기"}
                        </button>
                      </li>
                      <li>
                        <button type="button" onClick={() => setShowAccountInfo(true)}>
                          이 계정 정보
                        </button>
                      </li>
                    </ul>
                  </details>
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

      {showAccountInfo ? (
        <AccountInfoModal summary={summary} onClose={() => setShowAccountInfo(false)} />
      ) : null}
    </section>
  );
}
