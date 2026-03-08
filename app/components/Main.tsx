"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import CommunitySidebar from "@/app/components/community/CommunitySidebar";
import showSwal from "@/app/components/modal/Swal";
import { useAuth } from "@/app/providers/AuthProvider";
import memberApi from "@/service/api";
import "@/app/styles/main.css";

type SortType = "latest" | "views" | "likes";

type BoardListItem = {
  id: number;
  memberIdx: number;
  name: string;
  title: string;
  content: string;
  viewCnt: number;
  likeCnt: number;
  commentCnt: number;
  createdAt: string;
  isLiked?: boolean;
  liked?: boolean;
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
  text: string;
  likes: number;
  comments: number;
  views: number;
  createdAt: string;
  isLiked: boolean;
  imageUrls: string[];
};

const PAGE_SIZE = 5;
const IMAGE_SIZE = 300;
const IMAGE_GAP = 10;
const IMAGE_SCROLL_STEP = IMAGE_SIZE + IMAGE_GAP;

const sortLabelMap: Record<SortType, string> = {
  latest: "최신순",
  views: "조회순",
  likes: "좋아요순",
};

const toPublicImageUrl = (rawPath: string) => {
  if (!rawPath) return "";
  if (rawPath.startsWith("http://") || rawPath.startsWith("https://")) return rawPath;

  const base = (process.env.NEXT_PUBLIC_IMAGE_URL || "http://localhost:80").replace(/\/+$/, "");
  const normalized = rawPath.replace(/\\/g, "/");

  if (normalized.startsWith("/uploads/")) return `${base}${normalized}`;

  const uploadsIdx = normalized.indexOf("/uploads/");
  if (uploadsIdx >= 0) return `${base}${normalized.slice(uploadsIdx)}`;

  const fileName = normalized.split("/").pop();
  if (!fileName) return "";
  return `${base}/uploads/image/${fileName}`;
};

const toFeedPost = (item: BoardListItem): FeedPost => ({
  id: item.id,
  memberIdx: item.memberIdx,
  author: item.name,
  profileImage: "/assets/profile.png",
  text: item.content || item.title,
  likes: item.likeCnt ?? 0,
  comments: item.commentCnt ?? 0,
  views: item.viewCnt ?? 0,
  createdAt: item.createdAt,
  isLiked: Boolean(item.isLiked ?? item.liked),
  imageUrls: (item.imagePath ?? []).map(toPublicImageUrl).filter(Boolean),
});

export default function Main() {
  const router = useRouter();
  const { user } = useAuth();
  const currentUserId = useMemo(() => {
    if (!user) return null;
    const u = user as { id?: number; memberIdx?: number };
    const id = u.id ?? u.memberIdx;
    return typeof id === "number" ? id : null;
  }, [user]);

  const [query, setQuery] = useState("");
  const [sortType, setSortType] = useState<SortType>("latest");
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [draggingPostId, setDraggingPostId] = useState<number | null>(null);

  const sortDropdownRef = useRef<HTMLDetailsElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);
  const likePendingRef = useRef(new Set<number>());
  const imageStripRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const dragStateRef = useRef({ postId: null as number | null, startX: 0, startScrollLeft: 0 });

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

  const onOpenDetail = async (postId: number) => {
    if (currentUserId === null) {
      await showSwal("warning", "로그인 해주시기 바랍니다.");
      return;
    }
    router.push(`/community/${postId}`);
  };

  const onToggleLike = async (postId: number) => {
    if (currentUserId === null) {
      await showSwal("warning", "로그인 후 이용해주세요.");
      return;
    }
    if (likePendingRef.current.has(postId)) return;

    likePendingRef.current.add(postId);

    let prevLiked = false;
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        prevLiked = post.isLiked;
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
            isLiked: prevLiked,
            likes: Math.max(0, post.likes + (prevLiked ? 1 : -1)),
          };
        }),
      );
      await showSwal("error", "좋아요 처리에 실패했습니다.");
    } finally {
      likePendingRef.current.delete(postId);
    }
  };

  const onSlideImages = (postId: number, direction: "left" | "right") => {
    const target = imageStripRefs.current[postId];
    if (!target) return;
    const delta = direction === "right" ? IMAGE_SCROLL_STEP : -IMAGE_SCROLL_STEP;
    target.scrollBy({ left: delta, behavior: "smooth" });
  };

  const onStripPointerDown = (postId: number, event: React.PointerEvent<HTMLDivElement>) => {
    const strip = imageStripRefs.current[postId];
    if (!strip) return;

    dragStateRef.current = {
      postId,
      startX: event.clientX,
      startScrollLeft: strip.scrollLeft,
    };
    strip.style.scrollBehavior = "auto";
    setDraggingPostId(postId);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onStripDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const onStripPointerMove = (postId: number, event: React.PointerEvent<HTMLDivElement>) => {
    const strip = imageStripRefs.current[postId];
    if (!strip || dragStateRef.current.postId !== postId) return;

    const diffX = event.clientX - dragStateRef.current.startX;
    strip.scrollLeft = dragStateRef.current.startScrollLeft - diffX;
  };

  const onStripPointerUpOrCancel = (postId: number) => {
    const strip = imageStripRefs.current[postId];
    if (strip) strip.style.scrollBehavior = "smooth";

    dragStateRef.current.postId = null;
    setDraggingPostId((prev) => (prev === postId ? null : prev));
  };

  useEffect(() => {
    fetchBoards(0);
  }, [fetchBoards]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(target)) {
        sortDropdownRef.current.removeAttribute("open");
      }
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
        fetchBoards(page + 1);
      },
      { rootMargin: "120px 0px" },
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [fetchBoards, hasNext, page]);

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
            <div className="feed-search-box">
              <i className="bi bi-search"></i>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="게시물을 검색해주세요"
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
                    onClick={(e) => {
                      setSortType("latest");
                      e.currentTarget.closest("details")?.removeAttribute("open");
                    }}
                  >
                    최신순
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={(e) => {
                      setSortType("views");
                      e.currentTarget.closest("details")?.removeAttribute("open");
                    }}
                  >
                    조회순
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={(e) => {
                      setSortType("likes");
                      e.currentTarget.closest("details")?.removeAttribute("open");
                    }}
                  >
                    좋아요순
                  </button>
                </li>
              </ul>
            </details>
          </div>
        </header>

        <div className="feed-list">
          {filteredPosts.map((post) => (
            <article
              key={post.id}
              className="feed-card"
              onClick={() => void onOpenDetail(post.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  void onOpenDetail(post.id);
                }
              }}
            >
              <div className="feed-card-header">
                <div className="feed-author-block">
                  <div className="feed-author-row">
                    <img
                      src={post.profileImage}
                      alt={`${post.author} profile`}
                      className="feed-profile-image"
                    />
                    <strong className="feed-author-name">{post.author}</strong>
                    {currentUserId !== post.memberIdx && (
                      <button
                        className="follow-plus-btn"
                        type="button"
                        onClick={(event) => event.stopPropagation()}
                      >
                        +
                      </button>
                    )}
                  </div>
                  <span className="feed-distance">{post.createdAt}</span>
                </div>

                <details className="post-menu" onClick={(event) => event.stopPropagation()}>
                  <summary className="feed-more-btn" aria-label="게시물 메뉴 열기">
                    <i className="bi bi-three-dots"></i>
                  </summary>
                  <ul className="post-menu-list">
                    <li>
                      <button type="button">수정</button>
                    </li>
                    <li>
                      <button type="button">삭제</button>
                    </li>
                    <li>
                      <button type="button">신고</button>
                    </li>
                  </ul>
                </details>
              </div>

              <p className="feed-content">{post.text}</p>

              {post.imageUrls.length > 0 && (
                <div className="feed-image-wrap" onClick={(event) => event.stopPropagation()}>
                  <div className="feed-image-strip-mask">
                    <div
                      className={`feed-image-strip ${draggingPostId === post.id ? "is-dragging" : ""}`}
                      ref={(el) => {
                        imageStripRefs.current[post.id] = el;
                      }}
                      onDragStart={onStripDragStart}
                      onPointerDown={(event) => onStripPointerDown(post.id, event)}
                      onPointerMove={(event) => onStripPointerMove(post.id, event)}
                      onPointerUp={() => onStripPointerUpOrCancel(post.id)}
                      onPointerCancel={() => onStripPointerUpOrCancel(post.id)}
                    >
                      {post.imageUrls.map((url, index) => (
                        <img
                          key={`${post.id}-${index}`}
                          src={url}
                          alt={`게시글 이미지 ${index + 1}`}
                          className="feed-post-image"
                          draggable={false}
                        />
                      ))}
                    </div>
                  </div>
                  {post.imageUrls.length > 1 && (
                    <div className="feed-image-controls">
                      <button type="button" onClick={() => onSlideImages(post.id, "left")}>
                        <i className="bi bi-chevron-left"></i>
                      </button>
                      <button type="button" onClick={() => onSlideImages(post.id, "right")}>
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
                <button type="button">
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
          ))}
        </div>

        {!isLoading && filteredPosts.length === 0 && !loadError && (
          <p className="feed-empty">게시글이 없습니다.</p>
        )}
        {loadError && <p className="feed-empty">{loadError}</p>}
        {isLoading && <p className="feed-empty">게시글을 불러오는 중...</p>}

        <div ref={loadMoreRef} style={{ height: 1 }} />
      </div>
    </section>
  );
}
