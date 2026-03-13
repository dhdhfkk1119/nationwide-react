"use client";

import "@/app/styles/main.css";
import "@/app/styles/mypage.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import CommunitySidebar from "@/app/components/community/CommunitySidebar";
import FollowListSection, {
  type FollowMemberItem,
} from "@/app/components/members/FollowListSection";
import ImageViewer from "@/app/components/modal/ImageViewer";
import showSwal, { confirmSwal } from "@/app/components/modal/Swal";
import { useHorizontalDragScroll } from "@/app/hooks/useHorizontalDragScroll";
import { useAuth } from "@/app/providers/AuthProvider";
import { normalizeFollowStatus } from "@/app/utils/followState";
import { toProfileImageUrl, toPublicImageUrl } from "@/app/utils/imageUrl";
import memberApi from "@/service/api";

type TabKey = "main" | "comments" | "favorites" | "followers" | "following";

type SliceResponse<T> = {
  content: T[];
  hasNext?: boolean;
  last?: boolean;
};

type BoardListItem = {
  id: number;
  memberIdx: number;
  name: string;
  thumbnailProfileImagePath?: string;
  title?: string;
  content: string;
  viewCnt: number;
  likeCnt: number;
  commentCnt: number;
  isLiked?: boolean;
  liked?: boolean;
  isMine?: boolean;
  createdAt: string;
  imageFileId?: string[];
  imagePath?: string[];
};

type MyPageSummary = {
  memberIdx: number;
  name: string;
  nickName?: string;
  bio?: string;
  thumbnailProfileImagePath?: string;
  profileImagePath?: string[];
  boardCnt: number;
  followerCnt: number;
  followingCnt: number;
};

type MyCommentItem = {
  boardIdx: number;
  boardCommentIdx: number;
  commentContent: string;
  commentCreatedAt: string;
  boardContent: string;
  boardAuthorName: string;
  boardAuthorThumbnailProfileImagePath?: string;
  boardLikeCnt: number;
  boardCommentCnt: number;
  boardViewCnt: number;
  boardIsLiked: boolean;
  boardLiked?: boolean;
  imagePath?: string[];
};

type GroupedCommentItem = {
  boardIdx: number;
  boardContent: string;
  boardAuthorName: string;
  boardAuthorThumbnailProfileImagePath?: string;
  boardLikeCnt: number;
  boardCommentCnt: number;
  boardViewCnt: number;
  boardIsLiked: boolean;
  imagePath?: string[];
  comments: Array<{
    boardCommentIdx: number;
    commentContent: string;
    commentCreatedAt: string;
  }>;
};

type PaginatedState<T> = {
  items: T[];
  page: number;
  hasNext: boolean;
  loading: boolean;
  loaded: boolean;
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

const PAGE_SIZE = 10;
const IMAGE_SIZE = 300;
const IMAGE_GAP = 10;
const IMAGE_SCROLL_STEP = IMAGE_SIZE + IMAGE_GAP;
const MAX_IMAGES = 5;

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

const normalizeBoardItem = (item: BoardListItem): BoardListItem => ({
  ...item,
  isLiked: Boolean(item.isLiked ?? item.liked),
});

const normalizeCommentItem = (item: MyCommentItem): MyCommentItem => ({
  ...item,
  boardIsLiked: Boolean(item.boardIsLiked ?? item.boardLiked),
});

function SlideableImages({
  images,
  onOpenImages,
}: {
  images: string[];
  onOpenImages: (images: string[], index: number) => void;
}) {
  const {
    isDragging,
    movedDuringDragRef,
    onPointerDown,
    onPointerMove,
    onPointerUpOrCancel,
    scrollByStep,
    stripRef,
  } = useHorizontalDragScroll();

  return (
    <div
      className="feed-image-wrap"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="feed-image-strip-mask">
        <div
          ref={stripRef}
          className={`feed-image-strip ${isDragging ? "is-dragging" : ""}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUpOrCancel}
          onPointerCancel={onPointerUpOrCancel}
        >
          {images.map((image, index) => (
            <img
              key={`${image}-${index}`}
              src={image}
              alt={`게시물 이미지 ${index + 1}`}
              className="feed-post-image"
              draggable={false}
              onClick={() => {
                if (movedDuringDragRef.current) return;
                onOpenImages(images, index);
              }}
            />
          ))}
        </div>
      </div>

      {images.length > 1 && (
        <div className="feed-image-controls">
          <button
            type="button"
            onClick={() => scrollByStep(IMAGE_SCROLL_STEP, "left")}
          >
            <i className="bi bi-chevron-left"></i>
          </button>
          <button
            type="button"
            onClick={() => scrollByStep(IMAGE_SCROLL_STEP, "right")}
          >
            <i className="bi bi-chevron-right"></i>
          </button>
        </div>
      )}
    </div>
  );
}

function BoardListSection({
  items,
  emptyMessage,
  onOpenDetail,
  onOpenProfile,
  onOpenImages,
  onToggleLike,
  profileSrc,
  currentUserId,
  editableBoardId,
  editingContent,
  editingExistingImages,
  editingNewImages,
  isSavingBoard,
  manageEnabled = false,
  onToggleBoardMenu,
  onStartEditBoard,
  onChangeEditingBoardContent,
  onSelectEditImages,
  onRemoveExistingEditImage,
  onRemoveNewEditImage,
  onCancelEditBoard,
  onSaveBoardEdit,
  onDeleteBoard,
  onReportBoard,
}: {
  items: BoardListItem[];
  emptyMessage: string;
  onOpenDetail: (boardId: number) => void;
  onOpenProfile: (memberId: number) => void;
  onOpenImages: (images: string[], index: number) => void;
  onToggleLike: (boardId: number) => void;
  profileSrc: string;
  currentUserId: number | null;
  editableBoardId: number | null;
  editingContent: string;
  editingExistingImages: EditingExistingImage[];
  editingNewImages: EditingNewImage[];
  isSavingBoard: boolean;
  manageEnabled?: boolean;
  onToggleBoardMenu: (event: React.SyntheticEvent<HTMLDetailsElement>) => void;
  onStartEditBoard: (item: BoardListItem) => void;
  onChangeEditingBoardContent: (content: string) => void;
  onSelectEditImages: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveExistingEditImage: (imageId: string) => void;
  onRemoveNewEditImage: (previewUrl: string) => void;
  onCancelEditBoard: () => void;
  onSaveBoardEdit: (boardId: number) => void;
  onDeleteBoard: (boardId: number) => void;
  onReportBoard: () => void;
}) {
  if (items.length === 0) {
    return <p className="mypage-empty">{emptyMessage}</p>;
  }

  return (
    <div className="feed-list mypage-feed-list">
      {items.map((item) => {
        const isEditing = editableBoardId === item.id;
        const images = (item.imagePath ?? [])
          .map((imagePath) => toPublicImageUrl(imagePath))
          .filter(Boolean);
        const authorImageSrc = toProfileImageUrl(
          item.thumbnailProfileImagePath || profileSrc,
        );

        return (
          <article
            key={item.id}
            className="feed-card mypage-feed-card"
            onClick={() => {
              if (!isEditing) {
                onOpenDetail(item.id);
              }
            }}
            role="button"
            tabIndex={isEditing ? -1 : 0}
            onKeyDown={(event) => {
              if (isEditing) return;
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onOpenDetail(item.id);
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
                    onOpenProfile(item.memberIdx);
                  }}
                >
                  <img
                    src={authorImageSrc}
                    alt={`${item.name} 프로필`}
                    className="feed-profile-image"
                  />
                  <strong className="feed-author-name">{item.name}</strong>
                </button>
              </div>
              <div className="mypage-feed-header-side">
                <span className="feed-distance">{item.createdAt}</span>
                {manageEnabled && (
                  <details
                    className="post-menu"
                    onClick={(event) => event.stopPropagation()}
                    onToggle={onToggleBoardMenu}
                  >
                    <summary className="feed-more-btn" aria-label="게시물 메뉴 열기">
                      <i className="bi bi-three-dots"></i>
                    </summary>
                    <ul className="post-menu-list">
                      {currentUserId === item.memberIdx || item.isMine ? (
                        <>
                          <li>
                            <button
                              type="button"
                              onClick={() => onStartEditBoard(item)}
                            >
                              수정
                            </button>
                          </li>
                          <li>
                            <button
                              type="button"
                              onClick={() => onDeleteBoard(item.id)}
                            >
                              삭제
                            </button>
                          </li>
                        </>
                      ) : (
                        <li>
                          <button type="button" onClick={() => onReportBoard()}>
                            신고
                          </button>
                        </li>
                      )}
                    </ul>
                  </details>
                )}
              </div>
            </div>

            {isEditing ? (
              <div
                className="feed-edit-box"
                onClick={(event) => event.stopPropagation()}
              >
                <textarea
                  className="feed-edit-textarea"
                  value={editingContent}
                  onChange={(event) =>
                    onChangeEditingBoardContent(event.target.value)
                  }
                  rows={5}
                  placeholder="내용"
                />

                {(editingExistingImages.length > 0 ||
                  editingNewImages.length > 0) && (
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
                        <img
                          src={image.url}
                          alt="기존 이미지"
                          className="feed-edit-image"
                        />
                      </div>
                    ))}
                    {editingNewImages.map((image) => (
                      <div
                        key={image.previewUrl}
                        className="feed-edit-image-item"
                      >
                        <button
                          type="button"
                          className="feed-edit-image-remove"
                          onClick={() => onRemoveNewEditImage(image.previewUrl)}
                        >
                          <i className="bi bi-x-lg"></i>
                        </button>
                        <img
                          src={image.previewUrl}
                          alt="새 이미지"
                          className="feed-edit-image"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <label className="feed-edit-file-label">
                  이미지 추가
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={onSelectEditImages}
                  />
                </label>

                <div className="feed-edit-actions">
                  <button
                    type="button"
                    className="feed-edit-cancel"
                    onClick={onCancelEditBoard}
                    disabled={isSavingBoard}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    className="feed-edit-save"
                    onClick={() => onSaveBoardEdit(item.id)}
                    disabled={isSavingBoard}
                  >
                    {isSavingBoard ? "저장 중.." : "수정 저장"}
                  </button>
                </div>
              </div>
            ) : (
              <p className="feed-content">{item.content}</p>
            )}

            {!isEditing && images.length > 0 && (
              <SlideableImages images={images} onOpenImages={onOpenImages} />
            )}

            <div
              className="feed-actions"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className={item.isLiked ? "is-liked" : ""}
                onClick={() => onToggleLike(item.id)}
              >
                <i
                  className={`bi ${item.isLiked ? "bi-heart-fill" : "bi-heart"}`}
                ></i>
                <span>{item.likeCnt}</span>
              </button>
              <button type="button" onClick={() => onOpenDetail(item.id)}>
                <i className="bi bi-chat"></i>
                <span>{item.commentCnt}</span>
              </button>
              <span className="mypage-feed-stat">
                <i className="bi bi-eye"></i>
                <span>{item.viewCnt}</span>
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function CommentListSection({
  items,
  onOpenDetail,
  onOpenImages,
  onToggleLike,
}: {
  items: MyCommentItem[];
  onOpenDetail: (boardId: number) => void;
  onOpenImages: (images: string[], index: number) => void;
  onToggleLike: (boardId: number) => void;
}) {
  const groupedItems = items.reduce<GroupedCommentItem[]>((acc, item) => {
    const existingGroup = acc.find((group) => group.boardIdx === item.boardIdx);

    if (existingGroup) {
      existingGroup.comments.push({
        boardCommentIdx: item.boardCommentIdx,
        commentContent: item.commentContent,
        commentCreatedAt: item.commentCreatedAt,
      });
      return acc;
    }

    acc.push({
      boardIdx: item.boardIdx,
      boardContent: item.boardContent,
      boardAuthorName: item.boardAuthorName,
      boardAuthorThumbnailProfileImagePath:
        item.boardAuthorThumbnailProfileImagePath,
      boardLikeCnt: item.boardLikeCnt,
      boardCommentCnt: item.boardCommentCnt,
      boardViewCnt: item.boardViewCnt,
      boardIsLiked: item.boardIsLiked,
      imagePath: item.imagePath,
      comments: [
        {
          boardCommentIdx: item.boardCommentIdx,
          commentContent: item.commentContent,
          commentCreatedAt: item.commentCreatedAt,
        },
      ],
    });

    return acc;
  }, []);
  if (items.length === 0) {
    return <p className="mypage-empty">작성한 댓글이 없습니다.</p>;
  }

  return (
    <div className="feed-list mypage-feed-list">
      {groupedItems.map((item) => {
        const images = (item.imagePath ?? [])
          .map((imagePath) => toPublicImageUrl(imagePath))
          .filter(Boolean);
        const authorImageSrc = toProfileImageUrl(
          item.boardAuthorThumbnailProfileImagePath,
        );

        return (
          <article
            key={item.boardIdx}
            className="feed-card mypage-feed-card"
            onClick={() => onOpenDetail(item.boardIdx)}
          >
            <div className="feed-card-header">
              <div className="feed-author-row">
                <img
                  src={authorImageSrc}
                  alt={`${item.boardAuthorName} 프로필`}
                  className="feed-profile-image"
                />
                <strong className="feed-author-name">
                  {item.boardAuthorName}
                </strong>
              </div>
              <span className="feed-distance">
                {item.comments[0]?.commentCreatedAt}
              </span>
            </div>

            <p className="feed-content">{item.boardContent}</p>

            {images.length > 0 && (
              <SlideableImages images={images} onOpenImages={onOpenImages} />
            )}

            <div
              className="feed-actions"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className={item.boardIsLiked ? "is-liked" : ""}
                onClick={() => onToggleLike(item.boardIdx)}
              >
                <i
                  className={`bi ${item.boardIsLiked ? "bi-heart-fill" : "bi-heart"}`}
                ></i>
                <span>{item.boardLikeCnt}</span>
              </button>
              <button type="button" onClick={() => onOpenDetail(item.boardIdx)}>
                <i className="bi bi-chat"></i>
                <span>{item.boardCommentCnt}</span>
              </button>
              <span className="mypage-feed-stat">
                <i className="bi bi-eye"></i>
                <span>{item.boardViewCnt}</span>
              </span>
            </div>

            <div
              className="mypage-own-comment-list"
              onClick={(event) => event.stopPropagation()}
            >
              {item.comments.map((comment) => (
                <div
                  key={comment.boardCommentIdx}
                  className="mypage-own-comment-box"
                >
                  <div className="mypage-own-comment-head">
                    <span className="mypage-own-comment-label">내 댓글</span>
                    <span className="mypage-own-comment-date">
                      {comment.commentCreatedAt}
                    </span>
                  </div>
                  <p className="mypage-own-comment-text">
                    {comment.commentContent}
                  </p>
                </div>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}

export default function MyPageClient() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const currentUserId =
    user && typeof user === "object"
      ? ((user as { id?: number; memberIdx?: number }).id ??
          (user as { id?: number; memberIdx?: number }).memberIdx ??
          null)
      : null;
  const [summary, setSummary] = useState<MyPageSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("main");
  const [mainState, setMainState] = useState<PaginatedState<BoardListItem>>(
    () => createPaginatedState<BoardListItem>(),
  );
  const [commentState, setCommentState] = useState<
    PaginatedState<MyCommentItem>
  >(() => createPaginatedState<MyCommentItem>());
  const [favoriteState, setFavoriteState] = useState<
    PaginatedState<BoardListItem>
  >(() => createPaginatedState<BoardListItem>());
  const [followerState, setFollowerState] = useState<
    PaginatedState<FollowMemberItem>
  >(() => createPaginatedState<FollowMemberItem>());
  const [followingState, setFollowingState] = useState<
    PaginatedState<FollowMemberItem>
  >(() => createPaginatedState<FollowMemberItem>());
  const [viewerState, setViewerState] = useState<{
    images: string[];
    index: number;
  } | null>(null);
  const [editingBoardId, setEditingBoardId] = useState<number | null>(null);
  const [editingBoardTitle, setEditingBoardTitle] = useState("");
  const [editingBoardContent, setEditingBoardContent] = useState("");
  const [editingExistingImages, setEditingExistingImages] = useState<
    EditingExistingImage[]
  >([]);
  const [editingNewImages, setEditingNewImages] = useState<EditingNewImage[]>(
    [],
  );
  const [isSavingBoard, setIsSavingBoard] = useState(false);
  const likePendingRef = useRef(new Set<number>());

  const clearEditingNewImages = useCallback((images: EditingNewImage[]) => {
    images.forEach((image) => {
      if (image.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(image.previewUrl);
      }
    });
  }, []);

  const closeBoardMenus = useCallback(() => {
    document.querySelectorAll<HTMLDetailsElement>(".post-menu").forEach(
      (menu) => {
        menu.removeAttribute("open");
      },
    );
  }, []);

  const resetEditingBoard = useCallback(() => {
    setEditingBoardId(null);
    setEditingBoardTitle("");
    setEditingBoardContent("");
    setEditingExistingImages([]);
    setEditingNewImages((prev) => {
      clearEditingNewImages(prev);
      return [];
    });
    setIsSavingBoard(false);
  }, [clearEditingNewImages]);

  const loadBoards = useCallback(async (page: number) => {
    setMainState((prev) => ({ ...prev, loading: true }));
    try {
      const res = await memberApi.getMyPageBoards(page, PAGE_SIZE);
      const slice = (res.data?.response ?? {
        content: [],
      }) as SliceResponse<BoardListItem>;
      const normalizedItems = (slice.content ?? []).map(normalizeBoardItem);
      setMainState((prev) => ({
        items:
          page === 0 ? normalizedItems : [...prev.items, ...normalizedItems],
        page,
        hasNext: normalizeHasNext(slice),
        loading: false,
        loaded: true,
      }));
    } catch (error) {
      console.error("내 게시물 조회 실패:", error);
      setMainState((prev) => ({
        ...prev,
        loading: false,
        loaded: true,
        hasNext: false,
      }));
    }
  }, []);

  const loadComments = useCallback(async (page: number) => {
    setCommentState((prev) => ({ ...prev, loading: true }));
    try {
      const res = await memberApi.getMyPageComments(page, PAGE_SIZE);
      const slice = (res.data?.response ?? {
        content: [],
      }) as SliceResponse<MyCommentItem>;
      const normalizedItems = (slice.content ?? []).map(normalizeCommentItem);
      setCommentState((prev) => ({
        items:
          page === 0 ? normalizedItems : [...prev.items, ...normalizedItems],
        page,
        hasNext: normalizeHasNext(slice),
        loading: false,
        loaded: true,
      }));
    } catch (error) {
      console.error("내 댓글 조회 실패:", error);
      setCommentState((prev) => ({
        ...prev,
        loading: false,
        loaded: true,
        hasNext: false,
      }));
    }
  }, []);

  const loadFavorites = useCallback(async (page: number) => {
    setFavoriteState((prev) => ({ ...prev, loading: true }));
    try {
      const res = await memberApi.getMyFavoriteBoards(page, PAGE_SIZE);
      const slice = (res.data?.response ?? {
        content: [],
      }) as SliceResponse<BoardListItem>;
      const normalizedItems = (slice.content ?? []).map(normalizeBoardItem);
      setFavoriteState((prev) => ({
        items:
          page === 0 ? normalizedItems : [...prev.items, ...normalizedItems],
        page,
        hasNext: normalizeHasNext(slice),
        loading: false,
        loaded: true,
      }));
    } catch (error) {
      console.error("찜 목록 조회 실패:", error);
      setFavoriteState((prev) => ({
        ...prev,
        loading: false,
        loaded: true,
        hasNext: false,
      }));
    }
  }, []);

  const loadFollowers = useCallback(async (page: number) => {
    setFollowerState((prev) => ({ ...prev, loading: true }));
    try {
      const res = await memberApi.getFollowers(currentUserId ?? 0, page, PAGE_SIZE);
      const slice = (res.data?.response ?? {
        content: [],
      }) as SliceResponse<FollowMemberItem>;
      setFollowerState((prev) => ({
        items:
          page === 0
            ? (slice.content ?? []).map(normalizeFollowStatus)
            : [...prev.items, ...(slice.content ?? []).map(normalizeFollowStatus)],
        page,
        hasNext: normalizeHasNext(slice),
        loading: false,
        loaded: true,
      }));
    } catch (error) {
      console.error("팔로워 목록 조회 실패:", error);
      setFollowerState((prev) => ({
        ...prev,
        loading: false,
        loaded: true,
        hasNext: false,
      }));
    }
  }, [currentUserId]);

  const loadFollowing = useCallback(async (page: number) => {
    setFollowingState((prev) => ({ ...prev, loading: true }));
    try {
      const res = await memberApi.getFollowing(currentUserId ?? 0, page, PAGE_SIZE);
      const slice = (res.data?.response ?? {
        content: [],
      }) as SliceResponse<FollowMemberItem>;
      setFollowingState((prev) => ({
        items:
          page === 0
            ? (slice.content ?? []).map(normalizeFollowStatus)
            : [...prev.items, ...(slice.content ?? []).map(normalizeFollowStatus)],
        page,
        hasNext: normalizeHasNext(slice),
        loading: false,
        loaded: true,
      }));
    } catch (error) {
      console.error("팔로잉 목록 조회 실패:", error);
      setFollowingState((prev) => ({
        ...prev,
        loading: false,
        loaded: true,
        hasNext: false,
      }));
    }
  }, [currentUserId]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setSummaryLoading(false);
      return;
    }

    const fetchSummary = async () => {
      try {
        setSummaryLoading(true);
        const res = await memberApi.getMyPageSummary();
        setSummary(res.data?.response ?? null);
      } catch (error) {
        console.error("마이페이지 요약 조회 실패:", error);
        setSummary(null);
      } finally {
        setSummaryLoading(false);
      }
    };

    void fetchSummary();
  }, [loading, user]);

  useEffect(() => {
    if (loading || !user) return;
    if (activeTab === "main" && !mainState.loaded && !mainState.loading) {
      void loadBoards(0);
    }
    if (
      activeTab === "comments" &&
      !commentState.loaded &&
      !commentState.loading
    ) {
      void loadComments(0);
    }
    if (
      activeTab === "favorites" &&
      !favoriteState.loaded &&
      !favoriteState.loading
    ) {
      void loadFavorites(0);
    }
    if (
      activeTab === "followers" &&
      !followerState.loaded &&
      !followerState.loading
    ) {
      void loadFollowers(0);
    }
    if (
      activeTab === "following" &&
      !followingState.loaded &&
      !followingState.loading
    ) {
      void loadFollowing(0);
    }
  }, [
    activeTab,
    commentState.loaded,
    commentState.loading,
    favoriteState.loaded,
    favoriteState.loading,
    followerState.loaded,
    followerState.loading,
    followingState.loaded,
    followingState.loading,
    loadBoards,
    loadComments,
    loadFavorites,
    loadFollowers,
    loadFollowing,
    loading,
    mainState.loaded,
    mainState.loading,
    user,
  ]);

  const onOpenDetail = (boardId: number) => {
    router.push(`/community/${boardId}`);
  };

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

  const syncFollowMember = useCallback(
    (targetMemberId: number, nextState: FollowMemberItem) => {
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

  const onToggleFollowMember = useCallback(
    async (item: FollowMemberItem) => {
      if (item.isFollowing) {
        const result = await confirmSwal({
          icon: "question",
          title: "팔로잉 취소",
          html: item.isMutualFollow
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

      const res = await memberApi.toggleFollow(item.memberIdx);
      const nextState = normalizeFollowStatus(res.data?.response);

      syncFollowMember(item.memberIdx, {
        ...item,
        isFollowing: nextState.isFollowing,
        isFollowedBy: nextState.isFollowedBy,
        isMutualFollow: nextState.isMutualFollow,
      });
    },
    [syncFollowMember],
  );

  const onOpenImages = (images: string[], index: number) => {
    if (!images[index]) return;
    setViewerState({ images, index });
  };

  const onToggleBoardMenu = useCallback(
    (event: React.SyntheticEvent<HTMLDetailsElement>) => {
      const currentMenu = event.currentTarget;
      if (!currentMenu.open) return;

      document.querySelectorAll<HTMLDetailsElement>(".post-menu").forEach(
        (menu) => {
          if (menu !== currentMenu) {
            menu.removeAttribute("open");
          }
        },
      );
    },
    [],
  );

  const onStartEditBoard = useCallback(
    (item: BoardListItem) => {
      closeBoardMenus();
      setEditingBoardId(item.id);
      setEditingBoardTitle(item.title ?? "");
      setEditingBoardContent(item.content ?? "");
      setEditingExistingImages(
        (item.imagePath ?? []).map((imagePath, index) => ({
          id: item.imageFileId?.[index] ?? `${item.id}-${index}`,
          url: toPublicImageUrl(imagePath),
        })),
      );
      setEditingNewImages((prev) => {
        clearEditingNewImages(prev);
        return [];
      });
    },
    [clearEditingNewImages, closeBoardMenus],
  );

  const onChangeEditingBoardContent = useCallback((content: string) => {
    setEditingBoardContent(content);
  }, []);

  const onSelectEditImages = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files) return;

      const remainCount =
        MAX_IMAGES - editingExistingImages.length - editingNewImages.length;
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
    setEditingExistingImages((prev) =>
      prev.filter((image) => image.id !== imageId),
    );
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

  const syncBoardLikeState = useCallback(
    (boardId: number, isLiked: boolean) => {
      setMainState((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.id !== boardId
            ? item
            : {
                ...item,
                isLiked,
                likeCnt: Math.max(0, item.likeCnt + (isLiked ? 1 : -1)),
              },
        ),
      }));
      setFavoriteState((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.id !== boardId
            ? item
            : {
                ...item,
                isLiked,
                likeCnt: Math.max(0, item.likeCnt + (isLiked ? 1 : -1)),
              },
        ),
      }));
      setCommentState((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.boardIdx !== boardId
            ? item
            : {
                ...item,
                boardIsLiked: isLiked,
                boardLikeCnt: Math.max(
                  0,
                  item.boardLikeCnt + (isLiked ? 1 : -1),
                ),
              },
        ),
      }));
    },
    [],
  );

  const getBoardLikedState = useCallback(
    (boardId: number) => {
      const fromMain = mainState.items.find((item) => item.id === boardId);
      if (fromMain) return Boolean(fromMain.isLiked);

      const fromFavorites = favoriteState.items.find(
        (item) => item.id === boardId,
      );
      if (fromFavorites) return Boolean(fromFavorites.isLiked);

      const fromComments = commentState.items.find(
        (item) => item.boardIdx === boardId,
      );
      if (fromComments) return Boolean(fromComments.boardIsLiked);

      return false;
    },
    [commentState.items, favoriteState.items, mainState.items],
  );

  const onToggleLike = useCallback(
    async (boardId: number) => {
      if (likePendingRef.current.has(boardId)) return;

      const nextLiked = !getBoardLikedState(boardId);
      likePendingRef.current.add(boardId);
      syncBoardLikeState(boardId, nextLiked);

      try {
        await memberApi.toggleBoardLike(boardId);
      } catch (error) {
        syncBoardLikeState(boardId, !nextLiked);
        console.error("마이페이지 좋아요 처리 실패:", error);
        await showSwal("error", "좋아요 처리에 실패했습니다.");
      } finally {
        likePendingRef.current.delete(boardId);
      }
    },
    [getBoardLikedState, syncBoardLikeState],
  );

  const onSaveBoardEdit = useCallback(
    async (boardId: number) => {
      if (isSavingBoard) return;

      const formData = new FormData();
      formData.append(
        "data",
        new Blob(
          [
            JSON.stringify({
              title: editingBoardTitle.trim(),
              content: editingBoardContent.trim(),
              imageFileIds: editingExistingImages.map((image) => image.id),
            }),
          ],
          { type: "application/json" },
        ),
      );
      editingNewImages.forEach((image) => formData.append("files", image.file));

      try {
        setIsSavingBoard(true);
        await memberApi.updateBoard(boardId, formData);
        const detailRes = await memberApi.getBoardDetail(boardId);
        const detail = (detailRes.data?.response ?? {}) as BoardDetailRefreshResponse;

        setMainState((prev) => ({
          ...prev,
          items: prev.items.map((item) =>
            item.id !== boardId
              ? item
              : {
                  ...item,
                  title: detail.title ?? editingBoardTitle.trim(),
                  content: detail.content ?? editingBoardContent.trim(),
                  imagePath: detail.imagePath ?? [],
                  imageFileId: detail.imageFileId ?? [],
                },
          ),
        }));
        setFavoriteState((prev) => ({
          ...prev,
          items: prev.items.map((item) =>
            item.id !== boardId
              ? item
              : {
                  ...item,
                  title: detail.title ?? editingBoardTitle.trim(),
                  content: detail.content ?? editingBoardContent.trim(),
                  imagePath: detail.imagePath ?? [],
                  imageFileId: detail.imageFileId ?? [],
                },
          ),
        }));
        setCommentState((prev) => ({
          ...prev,
          items: prev.items.map((item) =>
            item.boardIdx !== boardId
              ? item
              : {
                  ...item,
                  boardContent: detail.content ?? editingBoardContent.trim(),
                  imagePath: detail.imagePath ?? [],
                },
          ),
        }));

        resetEditingBoard();
        await showSwal("success", "게시글을 수정했습니다.");
      } catch (error) {
        console.error("마이페이지 게시글 수정 실패:", error);
        setIsSavingBoard(false);
        await showSwal("error", "게시글 수정에 실패했습니다.");
      }
    },
    [
      editingBoardContent,
      editingBoardTitle,
      editingExistingImages,
      editingNewImages,
      isSavingBoard,
      resetEditingBoard,
    ],
  );

  const onDeleteBoard = useCallback(
    async (boardId: number) => {
      closeBoardMenus();
      const result = await confirmSwal({
        title: "게시글을 삭제하시겠습니까?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "확인",
        cancelButtonText: "취소",
      });

      if (!result.isConfirmed) return;

      try {
        await memberApi.deleteBoard(boardId);
        setMainState((prev) => ({
          ...prev,
          items: prev.items.filter((item) => item.id !== boardId),
        }));
        setFavoriteState((prev) => ({
          ...prev,
          items: prev.items.filter((item) => item.id !== boardId),
        }));
        setCommentState((prev) => ({
          ...prev,
          items: prev.items.filter((item) => item.boardIdx !== boardId),
        }));
        setSummary((prev) =>
          prev
            ? { ...prev, boardCnt: Math.max(0, prev.boardCnt - 1) }
            : prev,
        );
        if (editingBoardId === boardId) {
          resetEditingBoard();
        }
        await showSwal("success", "게시글을 삭제했습니다.");
      } catch (error) {
        console.error("마이페이지 게시글 삭제 실패:", error);
        await showSwal("error", "게시글 삭제에 실패했습니다.");
      }
    },
    [closeBoardMenus, editingBoardId, resetEditingBoard],
  );

  const onReportBoard = useCallback(async () => {
    closeBoardMenus();
    await showSwal("info", "신고 기능은 아직 준비 중입니다.");
  }, [closeBoardMenus]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;

      document.querySelectorAll<HTMLDetailsElement>(".post-menu").forEach(
        (menu) => {
          if (!menu.contains(target)) {
            menu.removeAttribute("open");
          }
        },
      );
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    return () => {
      clearEditingNewImages(editingNewImages);
    };
  }, [clearEditingNewImages, editingNewImages]);

  const currentProfileImages = (
    summary?.profileImagePath?.length
      ? summary.profileImagePath
      : summary?.thumbnailProfileImagePath
        ? [summary.thumbnailProfileImagePath]
        : []
  )
    .map((imagePath) => toPublicImageUrl(imagePath))
    .filter(Boolean);

  const myProfileSrc = toProfileImageUrl(summary?.thumbnailProfileImagePath);

  return (
    <section className="main-page">
      <CommunitySidebar activeMenuKey="profile" />

      <div className="feed-area">
        <section className="mypage-shell">
          {loading || summaryLoading ? (
            <p className="mypage-empty">프로필 정보를 불러오는 중입니다.</p>
          ) : !user ? (
            <p className="mypage-empty">
              로그인 후 내 프로필을 확인할 수 있습니다.
            </p>
          ) : !summary ? (
            <p className="mypage-empty">프로필 정보를 불러오지 못했습니다.</p>
          ) : (
            <>
              <div className="mypage-profile-card">
                <button
                  type="button"
                  className="mypage-profile-image"
                  onClick={() => onOpenImages(currentProfileImages, 0)}
                  disabled={currentProfileImages.length === 0}
                >
                  <img
                    src={toProfileImageUrl(summary.thumbnailProfileImagePath)}
                    alt={`${summary.name} 프로필`}
                  />
                </button>

                <div className="mypage-profile-main">
                  <div className="mypage-profile-name-row">
                    <div>
                      <h1>{summary.nickName || "닉네임 미설정"}</h1>
                      <p>{summary.name}</p>
                    </div>
                    <Link href="/mypage/edit" className="mypage-edit-link">
                      프로필 편집
                    </Link>
                  </div>

                  <div className="mypage-profile-stats">
                    <button
                      type="button"
                      className="mypage-stat-button"
                      onClick={() => setActiveTab("main")}
                    >
                      <strong>{summary.boardCnt}</strong>
                      게시물
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
                </div>

                {summary.bio?.trim() ? (
                  <div className="mypage-profile-bio">{summary.bio.trim()}</div>
                ) : null}
              </div>

              <div className="mypage-tabs">
                <button
                  type="button"
                  className={activeTab === "main" ? "is-active" : ""}
                  onClick={() => setActiveTab("main")}
                >
                  메인
                </button>
                <button
                  type="button"
                  className={activeTab === "comments" ? "is-active" : ""}
                  onClick={() => setActiveTab("comments")}
                >
                  작성 댓글
                </button>
                <button
                  type="button"
                  className={activeTab === "favorites" ? "is-active" : ""}
                  onClick={() => setActiveTab("favorites")}
                >
                  좋아요
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

              {activeTab === "main" && (
                <>
                  <BoardListSection
                    items={mainState.items}
                    emptyMessage="작성한 게시물이 없습니다."
                    onOpenDetail={onOpenDetail}
                    onOpenProfile={onOpenProfile}
                    onOpenImages={onOpenImages}
                    onToggleLike={onToggleLike}
                    profileSrc={myProfileSrc}
                    currentUserId={currentUserId}
                    editableBoardId={editingBoardId}
                    editingContent={editingBoardContent}
                    editingExistingImages={editingExistingImages}
                    editingNewImages={editingNewImages}
                    isSavingBoard={isSavingBoard}
                    manageEnabled
                    onToggleBoardMenu={onToggleBoardMenu}
                    onStartEditBoard={onStartEditBoard}
                    onChangeEditingBoardContent={onChangeEditingBoardContent}
                    onSelectEditImages={onSelectEditImages}
                    onRemoveExistingEditImage={onRemoveExistingEditImage}
                    onRemoveNewEditImage={onRemoveNewEditImage}
                    onCancelEditBoard={resetEditingBoard}
                    onSaveBoardEdit={onSaveBoardEdit}
                    onDeleteBoard={onDeleteBoard}
                    onReportBoard={onReportBoard}
                  />
                  {mainState.hasNext && (
                    <button
                      type="button"
                      className="mypage-load-more"
                      onClick={() => void loadBoards(mainState.page + 1)}
                      disabled={mainState.loading}
                    >
                      {mainState.loading ? "불러오는 중..." : "게시물 더 보기"}
                    </button>
                  )}
                </>
              )}

              {activeTab === "comments" && (
                <>
                  <CommentListSection
                    items={commentState.items}
                    onOpenDetail={onOpenDetail}
                    onOpenImages={onOpenImages}
                    onToggleLike={onToggleLike}
                  />
                  {commentState.hasNext && (
                    <button
                      type="button"
                      className="mypage-load-more"
                      onClick={() => void loadComments(commentState.page + 1)}
                      disabled={commentState.loading}
                    >
                      {commentState.loading ? "불러오는 중..." : "댓글 더 보기"}
                    </button>
                  )}
                </>
              )}

              {activeTab === "favorites" && (
                <>
                  <BoardListSection
                    items={favoriteState.items}
                    emptyMessage="찜한 게시물이 없습니다."
                    onOpenDetail={onOpenDetail}
                    onOpenProfile={onOpenProfile}
                    onOpenImages={onOpenImages}
                    onToggleLike={onToggleLike}
                    profileSrc="/assets/profile.png"
                    currentUserId={currentUserId}
                    editableBoardId={editingBoardId}
                    editingContent={editingBoardContent}
                    editingExistingImages={editingExistingImages}
                    editingNewImages={editingNewImages}
                    isSavingBoard={isSavingBoard}
                    onToggleBoardMenu={onToggleBoardMenu}
                    onStartEditBoard={onStartEditBoard}
                    onChangeEditingBoardContent={onChangeEditingBoardContent}
                    onSelectEditImages={onSelectEditImages}
                    onRemoveExistingEditImage={onRemoveExistingEditImage}
                    onRemoveNewEditImage={onRemoveNewEditImage}
                    onCancelEditBoard={resetEditingBoard}
                    onSaveBoardEdit={onSaveBoardEdit}
                    onDeleteBoard={onDeleteBoard}
                    onReportBoard={onReportBoard}
                  />
                  {favoriteState.hasNext && (
                    <button
                      type="button"
                      className="mypage-load-more"
                      onClick={() => void loadFavorites(favoriteState.page + 1)}
                      disabled={favoriteState.loading}
                    >
                      {favoriteState.loading
                        ? "불러오는 중..."
                        : "찜목록 더 보기"}
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
            </>
          )}
        </section>
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
