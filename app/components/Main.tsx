"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import CommunitySidebar from "@/app/components/community/CommunitySidebar";
import ImageViewer from "@/app/components/modal/ImageViewer";
import openReportPrompt from "@/app/components/modal/openReportPrompt";
import showSwal, { confirmSwal } from "@/app/components/modal/Swal";
import { useKeyedHorizontalDragScroll } from "@/app/hooks/useHorizontalDragScroll";
import { useAuth } from "@/app/providers/AuthProvider";
import {
  normalizeAuthorFollowStatus,
  normalizeFollowStatus,
} from "@/app/utils/followState";
import { toProfileImageUrl, toPublicImageUrl } from "@/app/utils/imageUrl";
import memberApi from "@/service/api";
import "@/app/styles/main.css";

type SortType = "latest" | "views" | "likes";
type SearchTab = "posts" | "users";

type BoardListItem = {
  id: number;
  memberIdx: number;
  name: string;
  thumbnailProfileImagePath?: string;
  title: string;
  content: string;
  viewCnt: number;
  likeCnt: number;
  commentCnt: number;
  createdAt: string;
  isLiked?: boolean;
  liked?: boolean;
  isFollowingAuthor?: boolean;
  isFollowedByAuthor?: boolean;
  isMutualFollow?: boolean;
  hasPendingFollowRequest?: boolean;
  distanceKm?: number | null;
  imageFileId?: string[];
  imagePath?: string[];
};

type BoardSliceResponse = {
  content: BoardListItem[];
  hasNext?: boolean;
  last?: boolean;
};

type FeedPost = {
  id: number;
  memberIdx: number;
  author: string;
  profileImage: string;
  title: string;
  content: string;
  text: string;
  likes: number;
  comments: number;
  views: number;
  createdAt: string;
  isLiked: boolean;
  isFollowingAuthor: boolean;
  isFollowedByAuthor: boolean;
  isMutualFollow: boolean;
  hasPendingFollowRequest: boolean;
  distanceKm: number | null;
  imageFileIds: string[];
  imageUrls: string[];
};

type SearchedMember = {
  memberIdx: number;
  name: string;
  nickName?: string;
  bio?: string;
  thumbnailProfileImagePath?: string;
};

type EditingExistingImage = {
  id: string;
  url: string;
};

type EditingNewImage = {
  file: File;
  previewUrl: string;
};

type BoardDetailRefreshResponse = {
  title?: string;
  content?: string;
  imagePath?: string[];
  imageFileId?: string[];
};

const PAGE_SIZE = 5;
const IMAGE_SIZE = 300;
const IMAGE_GAP = 10;
const IMAGE_SCROLL_STEP = IMAGE_SIZE + IMAGE_GAP;
const MAX_IMAGES = 5;

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

const sortLabelMap: Record<SortType, string> = {
  latest: "최신순",
  views: "조회순",
  likes: "좋아요순",
};

const toFeedPost = (item: BoardListItem): FeedPost => {
  const relation = normalizeAuthorFollowStatus(item);

  return {
    id: item.id,
    memberIdx: item.memberIdx,
    author: item.name,
    profileImage: toProfileImageUrl(item.thumbnailProfileImagePath),
    title: item.title ?? "",
    content: item.content ?? "",
    text: item.content || item.title,
    likes: item.likeCnt ?? 0,
    comments: item.commentCnt ?? 0,
    views: item.viewCnt ?? 0,
    createdAt: item.createdAt,
    isLiked: Boolean(item.isLiked ?? item.liked),
    isFollowingAuthor: relation.isFollowingAuthor,
    isFollowedByAuthor: relation.isFollowedByAuthor,
    isMutualFollow: relation.isMutualFollow,
    hasPendingFollowRequest: Boolean(relation.hasPendingFollowRequest),
    distanceKm:
      typeof item.distanceKm === "number" && Number.isFinite(item.distanceKm)
        ? item.distanceKm
        : null,
    imageFileIds: item.imageFileId ?? [],
    imageUrls: (item.imagePath ?? [])
      .map((imagePath) => toPublicImageUrl(imagePath, ""))
      .filter(Boolean),
  };
};

export default function Main() {
  const router = useRouter();
  const { user } = useAuth();
  const currentUserId = useMemo(() => {
    if (!user) return null;
    const current = user as { id?: number; memberIdx?: number };
    const id = current.id ?? current.memberIdx;
    return typeof id === "number" ? id : null;
  }, [user]);

  const [query, setQuery] = useState("");
  const [activeSearchTab, setActiveSearchTab] = useState<SearchTab>("posts");
  const [sortType, setSortType] = useState<SortType>("latest");
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [searchedMembers, setSearchedMembers] = useState<SearchedMember[]>([]);
  const [isSearchingMembers, setIsSearchingMembers] = useState(false);
  const [memberSearchError, setMemberSearchError] = useState("");
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [viewerState, setViewerState] = useState<{ images: string[]; index: number } | null>(null);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingContent, setEditingContent] = useState("");
  const [editingExistingImages, setEditingExistingImages] = useState<EditingExistingImage[]>([]);
  const [editingNewImages, setEditingNewImages] = useState<EditingNewImage[]>([]);
  const [isSavingPost, setIsSavingPost] = useState(false);

  const sortDropdownRef = useRef<HTMLDetailsElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);
  const likePendingRef = useRef(new Set<number>());
  const {
    didMove,
    isDragging,
    onDragStart,
    onPointerDown,
    onPointerMove,
    onPointerUpOrCancel,
    scrollByStep,
    setStripRef,
  } = useKeyedHorizontalDragScroll<number>();

  const fetchBoards = useCallback(async (targetPage: number) => {
    if (loadingRef.current) return;

    try {
      loadingRef.current = true;
      setIsLoading(true);
      setLoadError("");

      const res = await memberApi.getBoardList(targetPage, PAGE_SIZE);
      const slice = (res.data?.response ?? {}) as BoardSliceResponse;
      const content = Array.isArray(slice.content) ? slice.content : [];
      const mapped = content.map(toFeedPost);

      setPosts((prev) => (targetPage === 0 ? mapped : [...prev, ...mapped]));
      setPage(targetPage);

      if (content.length === 0) {
        setHasNext(false);
        return;
      }

      if (typeof slice.hasNext === "boolean") setHasNext(slice.hasNext);
      else if (typeof slice.last === "boolean") setHasNext(!slice.last);
      else setHasNext(content.length === PAGE_SIZE);
    } catch (error) {
      console.error("게시물 목록 조회 실패:", error);
      setLoadError("게시물을 불러오지 못했습니다.");
      setHasNext(false);
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  const clearEditingNewImages = useCallback((images: EditingNewImage[]) => {
    images.forEach((image) => {
      if (image.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(image.previewUrl);
      }
    });
  }, []);

  const closePostMenus = useCallback(() => {
    document.querySelectorAll<HTMLDetailsElement>(".post-menu").forEach((menu) => {
      menu.removeAttribute("open");
    });
  }, []);

  const resetEditingPost = useCallback(() => {
    setEditingPostId(null);
    setEditingTitle("");
    setEditingContent("");
    setEditingExistingImages([]);
    setEditingNewImages((prev) => {
      clearEditingNewImages(prev);
      return [];
    });
    setIsSavingPost(false);
  }, [clearEditingNewImages]);

  const onOpenDetail = useCallback(
    async (postId: number) => {
      if (currentUserId === null) {
        await showSwal("warning", "로그인 후 이용해 주세요.");
        return;
      }
      if (!Number.isFinite(postId) || postId <= 0) {
        await showSwal("error", "게시물 정보를 확인할 수 없습니다.");
        return;
      }
      router.push(`/community/${postId}`);
    },
    [currentUserId, router],
  );

  const onToggleLike = useCallback(
    async (postId: number) => {
      if (currentUserId === null) {
        await showSwal("warning", "로그인 후 이용해 주세요.");
        return;
      }
      if (likePendingRef.current.has(postId)) return;

      likePendingRef.current.add(postId);

      let previousLiked = false;
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id !== postId) return post;
          previousLiked = post.isLiked;
          return {
            ...post,
            isLiked: !post.isLiked,
            likes: Math.max(0, post.likes + (post.isLiked ? -1 : 1)),
          };
        }),
      );

      try {
        await memberApi.toggleBoardLike(postId);
      } catch {
        setPosts((prev) =>
          prev.map((post) => {
            if (post.id !== postId) return post;
            return {
              ...post,
              isLiked: previousLiked,
              likes: Math.max(0, post.likes + (previousLiked ? 1 : -1)),
            };
          }),
        );
        await showSwal("error", "좋아요 처리에 실패했습니다.");
      } finally {
        likePendingRef.current.delete(postId);
      }
    },
    [currentUserId],
  );

  const syncAuthorFollowState = useCallback(
    (
      memberIdx: number,
      nextState: {
        isFollowingAuthor: boolean;
        isFollowedByAuthor: boolean;
        isMutualFollow: boolean;
        hasPendingFollowRequest?: boolean;
      },
    ) => {
      setPosts((prev) =>
        prev.map((post) =>
          post.memberIdx !== memberIdx
            ? post
            : {
                ...post,
                isFollowingAuthor: nextState.isFollowingAuthor,
                isFollowedByAuthor: nextState.isFollowedByAuthor,
                isMutualFollow: nextState.isMutualFollow,
                hasPendingFollowRequest: Boolean(nextState.hasPendingFollowRequest),
              },
        ),
      );
    },
    [],
  );

  const onOpenAuthorProfile = useCallback(
    async (memberIdx: number) => {
      if (currentUserId === null) {
        await showSwal("warning", "로그인 후 이용해 주세요.");
        return;
      }

      if (currentUserId === memberIdx) {
        router.push("/mypage");
        return;
      }

      router.push(`/members/${memberIdx}`);
    },
    [currentUserId, router],
  );

  const onOpenSearchedMemberProfile = useCallback(
    async (memberIdx: number) => {
      await onOpenAuthorProfile(memberIdx);
    },
    [onOpenAuthorProfile],
  );

  const onFollowAuthor = useCallback(
    async (memberIdx: number) => {
      if (currentUserId === null) {
        await showSwal("warning", "로그인 후 이용해 주세요.");
        return;
      }

      try {
        const res = await memberApi.toggleFollow(memberIdx);
        const nextState = normalizeFollowStatus(res.data?.response);

        if (!nextState) {
          return;
        }

        syncAuthorFollowState(memberIdx, {
          isFollowingAuthor: nextState.isFollowing,
          isFollowedByAuthor: nextState.isFollowedBy,
          isMutualFollow: nextState.isMutualFollow,
          hasPendingFollowRequest: Boolean(nextState.hasPendingFollowRequest),
        });
      } catch (error) {
        console.error("팔로우 처리 실패:", error);
        await showSwal("error", "팔로우 처리에 실패했습니다.");
      }
    },
    [currentUserId, syncAuthorFollowState],
  );

  const onOpenImageViewer = useCallback((images: string[], index: number) => {
    if (!images[index]) return;
    setViewerState({ images, index });
  }, []);

  const onTogglePostMenu = useCallback((event: React.SyntheticEvent<HTMLDetailsElement>) => {
    const currentMenu = event.currentTarget;
    if (!currentMenu.open) return;

    document.querySelectorAll<HTMLDetailsElement>(".post-menu").forEach((menu) => {
      if (menu !== currentMenu) {
        menu.removeAttribute("open");
      }
    });
  }, []);

  const onStartEditPost = useCallback(
    (post: FeedPost) => {
      closePostMenus();
      setEditingPostId(post.id);
      setEditingTitle(post.title);
      setEditingContent(post.content);
      setEditingExistingImages(
        post.imageUrls.map((url, index) => ({
          id: post.imageFileIds[index] ?? `${post.id}-${index}`,
          url,
        })),
      );
      setEditingNewImages((prev) => {
        clearEditingNewImages(prev);
        return [];
      });
    },
    [clearEditingNewImages, closePostMenus],
  );

  const onSelectEditImages = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files) return;

      const remainCount = MAX_IMAGES - editingExistingImages.length - editingNewImages.length;
      if (remainCount <= 0) {
        event.target.value = "";
        return;
      }

      const nextImages = Array.from(files)
        .filter((file) => file.type.startsWith("image/"))
        .slice(0, remainCount)
        .map((file) => ({
          file,
          previewUrl: URL.createObjectURL(file),
        }));

      setEditingNewImages((prev) => [...prev, ...nextImages]);
      event.target.value = "";
    },
    [editingExistingImages.length, editingNewImages.length],
  );

  const onRemoveExistingEditImage = useCallback((imageId: string) => {
    setEditingExistingImages((prev) => prev.filter((image) => image.id !== imageId));
  }, []);

  const onRemoveNewEditImage = useCallback((previewUrl: string) => {
    setEditingNewImages((prev) => {
      const target = prev.find((image) => image.previewUrl === previewUrl);
      if (target?.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((image) => image.previewUrl !== previewUrl);
    });
  }, []);

  const onSavePostEdit = useCallback(
    async (postId: number) => {
      if (isSavingPost) return;

      const formData = new FormData();
      formData.append(
        "data",
        new Blob(
          [
            JSON.stringify({
              title: editingTitle.trim(),
              content: editingContent.trim(),
              imageFileIds: editingExistingImages.map((image) => image.id),
            }),
          ],
          { type: "application/json" },
        ),
      );
      editingNewImages.forEach((image) => formData.append("files", image.file));

      try {
        setIsSavingPost(true);
        await memberApi.updateBoard(postId, formData);
        const detailRes = await memberApi.getBoardDetail(postId);
        const detail = (detailRes.data?.response ?? {}) as BoardDetailRefreshResponse;

        setPosts((prev) =>
          prev.map((post) =>
            post.id !== postId
              ? post
              : {
                  ...post,
                  title: detail.title ?? editingTitle.trim(),
                  content: detail.content ?? editingContent.trim(),
                  text:
                    detail.content || detail.title || editingContent.trim() || editingTitle.trim(),
                  imageUrls: (detail.imagePath ?? [])
                    .map((imagePath) => toPublicImageUrl(imagePath, ""))
                    .filter(Boolean),
                  imageFileIds: detail.imageFileId ?? [],
                },
          ),
        );
        resetEditingPost();
        await showSwal("success", "게시글을 수정했습니다.");
      } catch (error) {
        console.error(error);
        setIsSavingPost(false);
        await showSwal("error", "게시글 수정에 실패했습니다.");
      }
    },
    [
      editingContent,
      editingExistingImages,
      editingNewImages,
      editingTitle,
      isSavingPost,
      resetEditingPost,
    ],
  );

  const onDeletePost = useCallback(
    async (postId: number) => {
      closePostMenus();
      const result = await confirmSwal({
        title: "게시글을 삭제하시겠습니까?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "확인",
        cancelButtonText: "취소",
      });

      if (!result.isConfirmed) return;

      try {
        await memberApi.deleteBoard(postId);
        setPosts((prev) => prev.filter((post) => post.id !== postId));
        await showSwal("success", "게시글을 삭제했습니다.");
      } catch (error) {
        console.error(error);
        await showSwal("error", "게시글 삭제에 실패했습니다.");
      }
    },
    [closePostMenus],
  );

  const onReportPost = useCallback(async () => {
    closePostMenus();
    await showSwal("info", "신고 기능은 아직 준비 중입니다.");
  }, [closePostMenus]);

  void onReportPost;

  const onSubmitPostReport = useCallback(
    async (post: FeedPost) => {
      closePostMenus();

      if (currentUserId === null) {
        await showSwal("warning", "로그인 후 이용해 주세요.");
        return;
      }

      const reporterComment = await openReportPrompt({
        title: "게시물 신고",
        targetLabel: "게시물 내용",
        content: post.content || post.title || "",
        imageUrls: post.imageUrls,
      });

      if (!reporterComment) {
        return;
      }

      try {
        await memberApi.reportBoard(post.id, reporterComment);
        await showSwal("success", "게시물 신고가 접수되었습니다.");
      } catch (error) {
        console.error(error);
        await showSwal("error", readErrorMessage(error, "게시물 신고에 실패했습니다."));
      }
    },
    [closePostMenus, currentUserId],
  );

  useEffect(() => {
    void fetchBoards(0);
  }, [fetchBoards]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(target)) {
        sortDropdownRef.current.removeAttribute("open");
      }

      document.querySelectorAll<HTMLDetailsElement>(".post-menu").forEach((menu) => {
        if (!menu.contains(target)) {
          menu.removeAttribute("open");
        }
      });
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry.isIntersecting) return;
        if (!hasNext || loadingRef.current) return;
        void fetchBoards(page + 1);
      },
      { rootMargin: "120px 0px" },
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [fetchBoards, hasNext, page]);

  useEffect(() => {
    return () => {
      clearEditingNewImages(editingNewImages);
    };
  }, [clearEditingNewImages, editingNewImages]);

  useEffect(() => {
    if (activeSearchTab !== "users") {
      setIsSearchingMembers(false);
      setMemberSearchError("");
      return;
    }

    const normalized = query.trim();
    if (!normalized) {
      setSearchedMembers([]);
      setIsSearchingMembers(false);
      setMemberSearchError("");
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsSearchingMembers(true);
        setMemberSearchError("");
        const res = await memberApi.searchMembers(normalized);
        if (cancelled) return;

        const response = Array.isArray(res.data?.response)
          ? (res.data.response as SearchedMember[])
          : [];
        setSearchedMembers(response);
      } catch (error) {
        if (cancelled) return;
        console.error("사용자 검색 실패:", error);
        setSearchedMembers([]);
        setMemberSearchError("사용자 검색 결과를 불러오지 못했습니다.");
      } finally {
        if (!cancelled) {
          setIsSearchingMembers(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [activeSearchTab, query]);

  const filteredPosts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const searched = posts.filter((post) => {
      if (!normalized) return true;
      return (
        post.author.toLowerCase().includes(normalized) ||
        post.text.toLowerCase().includes(normalized)
      );
    });

    return [...searched].sort((a, b) => {
      if (sortType === "views") return b.views - a.views;
      if (sortType === "likes") return b.likes - a.likes;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [posts, query, sortType]);

  return (
    <section className="main-page">
      <CommunitySidebar />

      <div className="feed-area">
        <header className="feed-header">
          <h1>동네 피드</h1>
          <p>근처 이웃들의 게시글을 확인하고 소통해보세요.</p>

          <div className="feed-filter-row">
            <div className="feed-search-tabs" role="tablist" aria-label="검색 대상">
              <button
                type="button"
                className={`feed-search-tab ${activeSearchTab === "posts" ? "is-active" : ""}`}
                onClick={() => setActiveSearchTab("posts")}
              >
                게시물
              </button>
              <button
                type="button"
                className={`feed-search-tab ${activeSearchTab === "users" ? "is-active" : ""}`}
                onClick={() => setActiveSearchTab("users")}
              >
                사용자
              </button>
            </div>

            <div className="feed-search-box">
              <i className="bi bi-search"></i>
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="게시물을 검색해 주세요"
              />
            </div>

            <details className="feed-sort-dropdown" ref={sortDropdownRef}>
              <summary className="feed-sort-trigger">
                <span>{sortLabelMap[sortType]}</span>
                <i className="bi bi-chevron-down feed-sort-icon"></i>
              </summary>
              <ul className="feed-sort-menu">
                <li>
                  <button
                    type="button"
                    onClick={(event) => {
                      setSortType("latest");
                      event.currentTarget.closest("details")?.removeAttribute("open");
                    }}
                  >
                    최신순
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={(event) => {
                      setSortType("views");
                      event.currentTarget.closest("details")?.removeAttribute("open");
                    }}
                  >
                    조회순
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={(event) => {
                      setSortType("likes");
                      event.currentTarget.closest("details")?.removeAttribute("open");
                    }}
                  >
                    좋아요순
                  </button>
                </li>
              </ul>
            </details>
          </div>
        </header>

        {activeSearchTab === "posts" ? (
        <>
        <div className="feed-list">
          {filteredPosts.map((post) => {
            const isEditing = editingPostId === post.id;

            return (
              <article
                key={post.id}
                className="feed-card"
                onClick={() => {
                  if (!isEditing) {
                    void onOpenDetail(post.id);
                  }
                }}
                role="button"
                tabIndex={isEditing ? -1 : 0}
                onKeyDown={(event) => {
                  if (isEditing) return;
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    void onOpenDetail(post.id);
                  }
                }}
              >
                <div className="feed-card-header">
                  <div className="feed-author-block">
                    <div className="feed-author-row">
                      <button
                        type="button"
                        className="feed-author-link"
                        onClick={(event) => {
                          event.stopPropagation();
                          void onOpenAuthorProfile(post.memberIdx);
                        }}
                      >
                        <img
                          src={post.profileImage}
                          alt={`${post.author} profile`}
                          className="feed-profile-image"
                        />
                        <strong className="feed-author-name">{post.author}</strong>
                      </button>
                      {currentUserId !== null &&
                        currentUserId !== post.memberIdx &&
                        !post.isFollowingAuthor &&
                        !post.hasPendingFollowRequest && (
                        <button
                          className="follow-plus-btn"
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void onFollowAuthor(post.memberIdx);
                          }}
                        >
                          +
                        </button>
                      )}
                      {currentUserId !== null && currentUserId !== post.memberIdx && post.isMutualFollow ? (
                        <span className="feed-follow-status">서로 팔로우 중입니다</span>
                      ) : currentUserId !== null &&
                        currentUserId !== post.memberIdx &&
                        post.isFollowedByAuthor ? (
                        <span className="feed-follow-status is-soft">나를 팔로우중</span>
                      ) : null}
                      {currentUserId !== null &&
                      currentUserId !== post.memberIdx &&
                      post.distanceKm !== null ? (
                        <span className="feed-follow-status is-soft">{post.distanceKm}km</span>
                      ) : null}
                    </div>
                    <span className="feed-distance">{post.createdAt}</span>
                  </div>

                  <details
                    className="post-menu"
                    onClick={(event) => event.stopPropagation()}
                    onToggle={onTogglePostMenu}
                  >
                    <summary className="feed-more-btn" aria-label="게시물 메뉴 열기">
                      <i className="bi bi-three-dots"></i>
                    </summary>
                    <ul className="post-menu-list">
                      {currentUserId === post.memberIdx ? (
                        <>
                          <li>
                            <button type="button" onClick={() => onStartEditPost(post)}>
                              수정
                            </button>
                          </li>
                          <li>
                            <button type="button" onClick={() => void onDeletePost(post.id)}>
                              삭제
                            </button>
                          </li>
                        </>
                      ) : (
                        <li>
                          <button type="button" onClick={() => void onSubmitPostReport(post)}>
                            신고
                          </button>
                        </li>
                      )}
                    </ul>
                  </details>
                </div>

                {isEditing ? (
                  <div className="feed-edit-box" onClick={(event) => event.stopPropagation()}>
                    <textarea
                      className="feed-edit-textarea"
                      value={editingContent}
                      onChange={(event) => setEditingContent(event.target.value)}
                      rows={5}
                      placeholder="내용"
                    />

                    {(editingExistingImages.length > 0 || editingNewImages.length > 0) && (
                      <div className="feed-edit-image-list">
                        {editingExistingImages.map((image) => (
                          <div key={image.id} className="feed-edit-image-item">
                            <button
                              type="button"
                              className="feed-edit-image-remove"
                              onClick={() => onRemoveExistingEditImage(image.id)}
                            >
                              <i className="bi bi-x-lg"></i>
                            </button>
                            <img src={image.url} alt="기존 이미지" className="feed-edit-image" />
                          </div>
                        ))}
                        {editingNewImages.map((image) => (
                          <div key={image.previewUrl} className="feed-edit-image-item">
                            <button
                              type="button"
                              className="feed-edit-image-remove"
                              onClick={() => onRemoveNewEditImage(image.previewUrl)}
                            >
                              <i className="bi bi-x-lg"></i>
                            </button>
                            <img src={image.previewUrl} alt="새 이미지" className="feed-edit-image" />
                          </div>
                        ))}
                      </div>
                    )}

                    <label className="feed-edit-file-label">
                      이미지 추가
                      <input type="file" accept="image/*" multiple onChange={onSelectEditImages} />
                    </label>

                    <div className="feed-edit-actions">
                      <button
                        type="button"
                        className="feed-edit-cancel"
                        onClick={resetEditingPost}
                        disabled={isSavingPost}
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        className="feed-edit-save"
                        onClick={() => void onSavePostEdit(post.id)}
                        disabled={isSavingPost}
                      >
                        {isSavingPost ? "저장 중..." : "수정 저장"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="feed-content">{post.text}</p>
                )}

                {!isEditing && post.imageUrls.length > 0 && (
                  <div className="feed-image-wrap" onClick={(event) => event.stopPropagation()}>
                    <div className="feed-image-strip-mask">
                      <div
                        className={`feed-image-strip ${isDragging(post.id) ? "is-dragging" : ""}`}
                        ref={setStripRef(post.id)}
                        onDragStart={onDragStart}
                        onPointerDown={(event) => onPointerDown(post.id, event)}
                        onPointerMove={(event) => onPointerMove(post.id, event)}
                        onPointerUp={() => onPointerUpOrCancel(post.id)}
                        onPointerCancel={() => onPointerUpOrCancel(post.id)}
                      >
                        {post.imageUrls.map((url, index) => (
                          <img
                            key={`${post.id}-${index}`}
                            src={url}
                            alt={`게시글 이미지 ${index + 1}`}
                            className="feed-post-image"
                            draggable={false}
                            onClick={(event) => {
                              if (didMove(post.id)) return;
                              event.stopPropagation();
                              onOpenImageViewer(post.imageUrls, index);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    {post.imageUrls.length > 1 && (
                      <div className="feed-image-controls">
                        <button
                          type="button"
                          onClick={() => scrollByStep(post.id, IMAGE_SCROLL_STEP, "left")}
                        >
                          <i className="bi bi-chevron-left"></i>
                        </button>
                        <button
                          type="button"
                          onClick={() => scrollByStep(post.id, IMAGE_SCROLL_STEP, "right")}
                        >
                          <i className="bi bi-chevron-right"></i>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="feed-actions" onClick={(event) => event.stopPropagation()}>
                  <button
                    type="button"
                    className={post.isLiked ? "is-liked" : ""}
                    onClick={() => void onToggleLike(post.id)}
                  >
                    <i className={`bi ${post.isLiked ? "bi-heart-fill" : "bi-heart"}`}></i>
                    <span>{post.likes}</span>
                  </button>
                  <button type="button" onClick={() => void onOpenDetail(post.id)}>
                    <i className="bi bi-chat"></i>
                    <span>{post.comments}</span>
                  </button>
                  <button type="button">
                    <i className="bi bi-send"></i>
                    <span>DM</span>
                  </button>
                </div>

                <div className="feed-meta">
                  <span>
                    <i className="bi bi-eye"></i> 조회수 {post.views}
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        {!isLoading && filteredPosts.length === 0 && !loadError && (
          <p className="feed-empty">게시글이 없습니다.</p>
        )}
        {loadError && <p className="feed-empty">{loadError}</p>}
        {isLoading && <p className="feed-empty">게시글을 불러오는 중...</p>}

        <div ref={loadMoreRef} style={{ height: 1 }} />
        </>
        ) : (
        <>
          <div className="feed-list">
            {searchedMembers.map((member) => (
              <button
                key={member.memberIdx}
                type="button"
                className="feed-user-card"
                onClick={() => void onOpenSearchedMemberProfile(member.memberIdx)}
              >
                <img
                  src={toProfileImageUrl(member.thumbnailProfileImagePath)}
                  alt={`${member.nickName || member.name} profile`}
                  className="feed-user-image"
                />
                <div className="feed-user-copy">
                  <strong>{member.nickName || member.name}</strong>
                  <span>{member.name}</span>
                  {member.bio?.trim() ? <p>{member.bio.trim()}</p> : null}
                </div>
                <span className="feed-user-action">프로필 보기</span>
              </button>
            ))}
          </div>

          {!query.trim() && (
            <p className="feed-empty">이름 또는 닉네임으로 사용자를 검색해 주세요.</p>
          )}
          {isSearchingMembers && <p className="feed-empty">사용자를 검색하는 중..</p>}
          {memberSearchError && <p className="feed-empty">{memberSearchError}</p>}
          {!isSearchingMembers &&
            !memberSearchError &&
            query.trim() &&
            searchedMembers.length === 0 && (
              <p className="feed-empty">검색된 사용자가 없습니다.</p>
            )}
        </>
        )}
      </div>

      {viewerState && (
        <ImageViewer
          images={viewerState.images}
          initialIndex={viewerState.index}
          onClose={() => setViewerState(null)}
        />
      )}
    </section>
  );
}
