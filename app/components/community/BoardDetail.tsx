"use client";

import "@/app/styles/board-detail.css";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CommunitySidebar from "@/app/components/community/CommunitySidebar";
import ImageViewer from "@/app/components/modal/ImageViewer";
import openReportPrompt from "@/app/components/modal/openReportPrompt";
import showSwal, { confirmSwal } from "@/app/components/modal/Swal";
import { useHorizontalDragScroll } from "@/app/hooks/useHorizontalDragScroll";
import { useAuth } from "@/app/providers/AuthProvider";
import { toProfileImageUrl, toPublicImageUrl } from "@/app/utils/imageUrl";
import memberApi from "@/service/api";

const IMAGE_SIZE = 300;
const IMAGE_GAP = 10;
const IMAGE_SCROLL_STEP = IMAGE_SIZE + IMAGE_GAP;

type BoardCommentItem = {
  boardCommentIdx: number;
  memberIdx?: number;
  name: string;
  nickName?: string;
  content: string;
  createdTime: string;
  profileImage?: string;
  commentLikeCnt?: number;
  isLike?: boolean;
  like?: boolean;
  isMine?: boolean;
  mine?: boolean;
};

type BoardDetailResponse = {
  id: number;
  name: string;
  memberIdx?: number;
  thumbnailProfileImagePath?: string;
  title: string;
  content: string;
  createdAt: string;
  viewCnt: number;
  likeCnt: number;
  commentCnt: number;
  isLiked?: boolean;
  liked?: boolean;
  isMine?: boolean;
  mine?: boolean;
  imageFileId?: string[];
  imagePath?: string[];
  commentSlice?: {
    content?: BoardCommentItem[];
  };
};

const normalizeLikeFlag = (value: unknown) => value === true || value === 1 || value === "true";

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

export default function BoardDetail({ boardId }: { boardId: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const currentUserId =
    user && typeof user === "object"
      ? ((user as { id?: number; memberIdx?: number }).id ??
          (user as { id?: number; memberIdx?: number }).memberIdx ??
          null)
      : null;
  const isInvalidBoardId = !Number.isFinite(boardId) || boardId <= 0;
  const [detail, setDetail] = useState<BoardDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [commentInput, setCommentInput] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const [isUpdatingComment, setIsUpdatingComment] = useState(false);
  const [viewerState, setViewerState] = useState<{ images: string[]; index: number } | null>(null);
  const [pendingCommentLikeIds, setPendingCommentLikeIds] = useState<number[]>([]);
  const [isTogglingBoardLike, setIsTogglingBoardLike] = useState(false);
  const [highlightedCommentId, setHighlightedCommentId] = useState<number | null>(null);
  const {
    isDragging: isDraggingImages,
    movedDuringDragRef,
    onDragStart: onImageDragStart,
    onPointerDown: onImagePointerDown,
    onPointerMove: onImagePointerMove,
    onPointerUpOrCancel: onImagePointerUpOrCancel,
    scrollByStep,
    stripRef: imageStripRef,
  } = useHorizontalDragScroll();

  const comments = useMemo(() => detail?.commentSlice?.content ?? [], [detail]);
  const targetHighlightCommentId = useMemo(() => {
    const value = searchParams.get("highlightCommentId");
    if (!value) return null;

    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [searchParams]);
  const imageUrls = useMemo(
    () => (detail?.imagePath ?? []).map((imagePath) => toPublicImageUrl(imagePath, "")).filter(Boolean),
    [detail?.imagePath],
  );

  const onOpenImageViewer = useCallback((images: string[], index: number) => {
    if (!images[index]) return;
    setViewerState({ images, index });
  }, []);

  const onOpenAuthorProfile = useCallback(() => {
    if (!detail?.memberIdx) return;

    if (currentUserId === detail.memberIdx) {
      router.push("/mypage");
      return;
    }

    router.push(`/members/${detail.memberIdx}`);
  }, [currentUserId, detail?.memberIdx, router]);

  const fetchDetail = useCallback(async () => {
    if (isInvalidBoardId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const res = await memberApi.getBoardDetail(boardId);
      const response = (res.data?.response ?? null) as BoardDetailResponse | null;
      setDetail(
        response
          ? {
              ...response,
              isLiked: normalizeLikeFlag(response.isLiked ?? response.liked),
              isMine: normalizeLikeFlag(response.isMine ?? response.mine),
              commentSlice: response.commentSlice
                ? {
                    ...response.commentSlice,
                    content: (response.commentSlice.content ?? []).map((comment) => ({
                      ...comment,
                      isLike: normalizeLikeFlag(comment.isLike ?? comment.like),
                      isMine: normalizeLikeFlag(comment.isMine ?? comment.mine),
                    })),
                  }
                : response.commentSlice,
            }
          : null,
      );
    } catch (error: unknown) {
      await showSwal("error", "게시글 상세를 불러오지 못했습니다.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [boardId, isInvalidBoardId]);

  const onToggleCommentLike = useCallback(
    async (commentId: number) => {
      if (pendingCommentLikeIds.includes(commentId)) return;

      setPendingCommentLikeIds((prev) => [...prev, commentId]);

      try {
        await memberApi.toggleBoardCommentLike(commentId);
        await fetchDetail();
      } catch (error) {
        console.error(error);
      } finally {
        setPendingCommentLikeIds((prev) => prev.filter((id) => id !== commentId));
      }
    },
    [fetchDetail, pendingCommentLikeIds],
  );

  const onToggleBoardLike = useCallback(async () => {
    if (!detail || isTogglingBoardLike) return;

    const previousLiked = Boolean(detail.isLiked);
    setIsTogglingBoardLike(true);
    setDetail((prev) =>
      prev
        ? {
            ...prev,
            isLiked: !Boolean(prev.isLiked),
            likeCnt: Math.max(0, prev.likeCnt + (prev.isLiked ? -1 : 1)),
          }
        : prev,
    );

    try {
      await memberApi.toggleBoardLike(boardId);
    } catch (error) {
      console.error(error);
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              isLiked: previousLiked,
              likeCnt: Math.max(0, prev.likeCnt + (previousLiked ? 1 : -1)),
            }
          : prev,
      );
    } finally {
      setIsTogglingBoardLike(false);
    }
  }, [boardId, detail, isTogglingBoardLike]);

  const onEditBoard = useCallback(async () => {
    if (!detail?.isMine) return;

    const nextContent = window.prompt("게시글 내용을 수정하세요.", detail.content);
    if (nextContent === null) return;

    const trimmedContent = nextContent.trim();
    if (!trimmedContent) {
      await showSwal("warning", "게시글 내용을 입력해 주세요.");
      return;
    }

    const formData = new FormData();
    formData.append(
      "data",
      new Blob(
        [
          JSON.stringify({
            title: detail.title ?? "",
            content: trimmedContent,
            imageFileIds: detail.imageFileId ?? [],
          }),
        ],
        { type: "application/json" },
      ),
    );

    try {
      await memberApi.updateBoard(boardId, formData);
      await showSwal("success", "게시글을 수정했습니다.");
      await fetchDetail();
    } catch (error) {
      console.error(error);
      await showSwal("error", "게시글 수정에 실패했습니다.");
    }
  }, [boardId, detail, fetchDetail]);

  const onDeleteBoard = useCallback(async () => {
    if (!detail?.isMine) return;
    if (!window.confirm("게시글을 삭제하시겠습니까?")) return;

    try {
      await memberApi.deleteBoard(boardId);
      await showSwal("success", "게시글을 삭제했습니다.");
      router.push("/");
    } catch (error) {
      console.error(error);
      await showSwal("error", "게시글 삭제에 실패했습니다.");
    }
  }, [boardId, detail?.isMine, router]);

  const onStartEditComment = useCallback((comment: BoardCommentItem) => {
    if (!comment.isMine) return;
    setEditingCommentId(comment.boardCommentIdx);
    setEditingCommentContent(comment.content);
  }, []);

  const onCancelEditComment = useCallback(() => {
    setEditingCommentId(null);
    setEditingCommentContent("");
  }, []);

  const onSaveEditedComment = useCallback(
    async (commentId: number) => {
      const trimmedContent = editingCommentContent.trim();
      if (!trimmedContent) {
        await showSwal("warning", "댓글 내용을 입력해 주세요.");
        return;
      }

      try {
        setIsUpdatingComment(true);
        await memberApi.updateBoardComment(commentId, trimmedContent);
        await showSwal("success", "댓글을 수정했습니다.");
        onCancelEditComment();
        await fetchDetail();
      } catch (error) {
        console.error(error);
        await showSwal("error", "댓글 수정에 실패했습니다.");
      } finally {
        setIsUpdatingComment(false);
      }
    },
    [editingCommentContent, fetchDetail, onCancelEditComment],
  );

  const onDeleteComment = useCallback(
    async (commentId: number) => {
      const result = await confirmSwal({
        title: "댓글을 삭제하시겠습니까?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "확인",
        cancelButtonText: "취소",
      });

      if (!result.isConfirmed) return;

      try {
        await memberApi.deleteBoardComment(commentId);
        await showSwal("success", "댓글을 삭제했습니다.");
        await fetchDetail();
      } catch (error) {
        console.error(error);
        await showSwal("error", "댓글 삭제에 실패했습니다.");
      }
    },
    [fetchDetail],
  );

  const onReport = useCallback(async () => {
    await showSwal("info", "신고 기능은 아직 준비 중입니다.");
  }, []);

  void onReport;

  const closeActionMenus = useCallback(() => {
    document
      .querySelectorAll<HTMLDetailsElement>(".board-detail-menu, .board-comment-menu")
      .forEach((menu) => {
        menu.removeAttribute("open");
      });
  }, []);

  const onReportBoard = useCallback(async () => {
    if (!detail) return;

    closeActionMenus();

    if (currentUserId === null) {
      await showSwal("warning", "로그인 후 이용해 주세요.");
      return;
    }

    const reporterComment = await openReportPrompt({
      title: "게시물 신고",
      targetLabel: "게시물 내용",
      content: detail.content || detail.title || "",
      imageUrls,
    });

    if (!reporterComment) {
      return;
    }

    try {
      await memberApi.reportBoard(detail.id, reporterComment);
      await showSwal("success", "게시물 신고가 접수되었습니다.");
    } catch (error) {
      console.error(error);
      await showSwal("error", readErrorMessage(error, "게시물 신고에 실패했습니다."));
    }
  }, [closeActionMenus, currentUserId, detail, imageUrls]);

  const onReportComment = useCallback(
    async (comment: BoardCommentItem) => {
      closeActionMenus();

      if (currentUserId === null) {
        await showSwal("warning", "로그인 후 이용해 주세요.");
        return;
      }

      const reporterComment = await openReportPrompt({
        title: "댓글 신고",
        targetLabel: "댓글 내용",
        content: comment.content,
      });

      if (!reporterComment) {
        return;
      }

      try {
        await memberApi.reportComment(comment.boardCommentIdx, reporterComment);
        await showSwal("success", "댓글 신고가 접수되었습니다.");
      } catch (error) {
        console.error(error);
        await showSwal("error", readErrorMessage(error, "댓글 신고에 실패했습니다."));
      }
    },
    [closeActionMenus, currentUserId],
  );

  const onToggleActionMenu = useCallback((event: React.SyntheticEvent<HTMLDetailsElement>) => {
    const currentMenu = event.currentTarget;
    if (!currentMenu.open) return;

    document
      .querySelectorAll<HTMLDetailsElement>(".board-detail-menu, .board-comment-menu")
      .forEach((menu) => {
        if (menu !== currentMenu) {
          menu.removeAttribute("open");
        }
      });
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchDetail();
  }, [fetchDetail, user]);

  useEffect(() => {
    if (targetHighlightCommentId === null) {
      setHighlightedCommentId(null);
      return;
    }

    if (!comments.some((comment) => comment.boardCommentIdx === targetHighlightCommentId)) {
      return;
    }

    setHighlightedCommentId(targetHighlightCommentId);

    const animationFrameId = window.requestAnimationFrame(() => {
      document
        .getElementById(`board-comment-${targetHighlightCommentId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    const timeoutId = window.setTimeout(() => {
      setHighlightedCommentId((current) =>
        current === targetHighlightCommentId ? null : current,
      );
    }, 2800);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.clearTimeout(timeoutId);
    };
  }, [comments, targetHighlightCommentId]);

  const onSubmitComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      await showSwal("warning", "로그인해 주세요.");
      return;
    }

    const content = commentInput.trim();
    if (!content) {
      await showSwal("warning", "댓글 내용을 입력해 주세요.");
      return;
    }

    try {
      setIsSubmittingComment(true);
      await memberApi.createBoardComment(boardId, content);
      setCommentInput("");
      await fetchDetail();
    } catch (error: unknown) {
      await showSwal("error", "댓글 작성에 실패했습니다.");
      console.error(error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (isInvalidBoardId) {
    return (
      <section className="main-page">
        <CommunitySidebar />
        <div className="feed-area">
          <div className="board-detail-wrap">
            <p className="board-detail-empty">잘못된 게시물 주소입니다.</p>
          </div>
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="main-page">
        <CommunitySidebar />
        <div className="feed-area">
          <div className="board-detail-wrap">
            <p className="board-detail-empty">로그인해 주세요.</p>
          </div>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="main-page">
        <CommunitySidebar />
        <div className="feed-area">
          <div className="board-detail-wrap">
            <p className="board-detail-empty">게시글을 불러오는 중입니다.</p>
          </div>
        </div>
      </section>
    );
  }

  if (!detail) {
    return (
      <section className="main-page">
        <CommunitySidebar />
        <div className="feed-area">
          <div className="board-detail-wrap">
            <p className="board-detail-empty">게시글을 찾을 수 없습니다.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="main-page">
      <CommunitySidebar />
      <div className="feed-area">
        <div className="board-detail-wrap">
          <button className="board-back-btn" type="button" onClick={() => router.push("/")}>
            <i className="bi bi-chevron-left"></i>
            목록으로
          </button>

          <h1 className="board-detail-title">{detail.title}</h1>
          <div className="board-detail-meta-row">
            <button
              type="button"
              className="board-detail-author"
              onClick={onOpenAuthorProfile}
            >
              <img
                src={toProfileImageUrl(detail.thumbnailProfileImagePath)}
                alt={`${detail.name} profile`}
                className="board-detail-profile-image"
              />
              <div className="board-detail-meta">
                <strong>{detail.name}</strong>
                <span>{detail.createdAt}</span>
              </div>
            </button>
            <details className="board-detail-menu" onToggle={onToggleActionMenu}>
              <summary className="board-detail-menu-trigger" aria-label="게시글 메뉴 열기">
                <i className="bi bi-three-dots"></i>
              </summary>
              <ul className="board-detail-menu-list">
                {detail.isMine ? (
                  <>
                    <li>
                      <button type="button" onClick={() => void onEditBoard()}>
                        수정
                      </button>
                    </li>
                    <li>
                      <button type="button" onClick={() => void onDeleteBoard()}>
                        삭제
                      </button>
                    </li>
                  </>
                ) : (
                  <li>
                    <button type="button" onClick={() => void onReportBoard()}>
                      신고
                    </button>
                  </li>
                )}
              </ul>
            </details>
          </div>
          <p className="board-detail-content">{detail.content}</p>

          {imageUrls.length > 0 && (
            <div className="board-detail-image-section">
              <div className="board-detail-image-mask">
                <div
                  className={`board-detail-image-list ${isDraggingImages ? "is-dragging" : ""}`}
                  ref={imageStripRef}
                  onDragStart={onImageDragStart}
                  onPointerDown={onImagePointerDown}
                  onPointerMove={onImagePointerMove}
                  onPointerUp={onImagePointerUpOrCancel}
                  onPointerCancel={onImagePointerUpOrCancel}
                >
                  {imageUrls.map((url, index) => (
                    <img
                      key={`${url}-${index}`}
                      src={url}
                      alt={`게시글 이미지 ${index + 1}`}
                      className="board-detail-image"
                      draggable={false}
                      onClick={() => {
                        if (movedDuringDragRef.current) return;
                        onOpenImageViewer(imageUrls, index);
                      }}
                    />
                  ))}
                </div>
              </div>

              {imageUrls.length > 1 && (
                <div className="board-detail-image-controls">
                  <button
                    type="button"
                    onClick={() => scrollByStep(IMAGE_SCROLL_STEP, "left")}
                    aria-label="이전 이미지"
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollByStep(IMAGE_SCROLL_STEP, "right")}
                    aria-label="다음 이미지"
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="board-detail-actions">
            <button
              type="button"
              className={detail.isLiked ? "is-liked" : ""}
              onClick={() => void onToggleBoardLike()}
              disabled={isTogglingBoardLike}
            >
              <i className={`bi ${detail.isLiked ? "bi-heart-fill" : "bi-heart"}`}></i>
              <span>{detail.likeCnt}</span>
            </button>
            <button type="button" disabled>
              <i className="bi bi-chat"></i>
              <span>{detail.commentCnt}</span>
            </button>
            <span className="board-detail-view-count">
              <i className="bi bi-eye"></i>
              <span>{detail.viewCnt}</span>
            </span>
          </div>

          <form className="board-comment-form" onSubmit={onSubmitComment}>
            <textarea
              value={commentInput}
              onChange={(event) => setCommentInput(event.target.value)}
              placeholder="댓글을 입력해 주세요"
              rows={3}
            />
            <button type="submit" disabled={isSubmittingComment}>
              {isSubmittingComment ? "작성 중..." : "댓글 작성"}
            </button>
          </form>

          <section className="board-comment-list">
            <h2>댓글</h2>
            {comments.length === 0 ? (
              <p className="board-comment-empty">아직 작성된 댓글이 없습니다.</p>
            ) : (
              comments.map((comment) => (
                <article
                  key={comment.boardCommentIdx}
                  id={`board-comment-${comment.boardCommentIdx}`}
                  className={`board-comment-item ${comment.isMine ? "is-mine" : ""} ${
                    highlightedCommentId === comment.boardCommentIdx ? "is-highlighted" : ""
                  }`}
                >
                  <div className="board-comment-head">
                    <div className="board-comment-author">
                      <img
                        src={toProfileImageUrl(comment.profileImage)}
                        alt={`${comment.nickName || comment.name} profile`}
                        className="board-comment-profile-image"
                      />
                      <div className="board-comment-author-meta">
                        <strong>{comment.nickName || comment.name}</strong>
                        <span>{comment.createdTime}</span>
                        {highlightedCommentId === comment.boardCommentIdx ? (
                          <span className="board-comment-highlight-badge">내가 신고한 댓글</span>
                        ) : null}
                      </div>
                    </div>
                    <div className="board-comment-tools">
                      <button
                        type="button"
                        className={`board-comment-like-button ${comment.isLike ? "is-liked" : ""}`}
                        onClick={() => void onToggleCommentLike(comment.boardCommentIdx)}
                        disabled={pendingCommentLikeIds.includes(comment.boardCommentIdx)}
                      >
                        <span className="board-comment-like-count">
                          <i className={`bi ${comment.isLike ? "bi-heart-fill" : "bi-heart"}`}></i>
                          {comment.commentLikeCnt ?? 0}
                        </span>
                      </button>
                      <details className="board-comment-menu" onToggle={onToggleActionMenu}>
                        <summary className="board-comment-menu-trigger" aria-label="댓글 메뉴 열기">
                          <i className="bi bi-three-dots"></i>
                        </summary>
                        <ul className="board-detail-menu-list">
                          {comment.isMine ? (
                            <>
                              <li>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.currentTarget.closest("details")?.removeAttribute("open");
                                    onStartEditComment(comment);
                                  }}
                                >
                                  수정
                                </button>
                              </li>
                              <li>
                                <button
                                  type="button"
                                  onClick={() => void onDeleteComment(comment.boardCommentIdx)}
                                >
                                  삭제
                                </button>
                              </li>
                            </>
                          ) : (
                            <li>
                              <button type="button" onClick={() => void onReportComment(comment)}>
                                신고
                              </button>
                            </li>
                          )}
                        </ul>
                      </details>
                    </div>
                  </div>
                  {editingCommentId === comment.boardCommentIdx ? (
                    <div className="board-comment-edit-box">
                      <textarea
                        value={editingCommentContent}
                        onChange={(event) => setEditingCommentContent(event.target.value)}
                        rows={3}
                      />
                      <div className="board-comment-edit-actions">
                        <button
                          type="button"
                          onClick={() => void onSaveEditedComment(comment.boardCommentIdx)}
                          disabled={isUpdatingComment}
                        >
                          {isUpdatingComment ? "저장 중..." : "수정 저장"}
                        </button>
                        <button
                          type="button"
                          className="is-secondary"
                          onClick={onCancelEditComment}
                          disabled={isUpdatingComment}
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p>{comment.content}</p>
                  )}
                </article>
              ))
            )}
          </section>
        </div>
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
