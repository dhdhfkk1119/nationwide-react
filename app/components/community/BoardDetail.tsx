"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CommunitySidebar from "@/app/components/community/CommunitySidebar";
import showSwal from "@/app/components/modal/Swal";
import { useAuth } from "@/app/providers/AuthProvider";
import memberApi from "@/service/api";
import "@/app/styles/board-detail.css";

type BoardCommentItem = {
  boardCommentIdx: number;
  name: string;
  content: string;
  createdTime: string;
};

type BoardDetailResponse = {
  id: number;
  name: string;
  title: string;
  content: string;
  createdAt: string;
  likeCnt: number;
  commentCnt: number;
  imagePath?: string[];
  commentSlice?: {
    content?: BoardCommentItem[];
  };
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

export default function BoardDetail({ boardId }: { boardId: number }) {
  const router = useRouter();
  const { user } = useAuth();
  const isInvalidBoardId = !Number.isFinite(boardId) || boardId <= 0;
  const [detail, setDetail] = useState<BoardDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [commentInput, setCommentInput] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const comments = useMemo(
    () => detail?.commentSlice?.content ?? [],
    [detail],
  );

  const imageUrls = useMemo(
    () => (detail?.imagePath ?? []).map(toPublicImageUrl).filter(Boolean),
    [detail?.imagePath],
  );

  const fetchDetail = useCallback(async () => {
    if (isInvalidBoardId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const res = await memberApi.getBoardDetail(boardId);
      setDetail((res.data?.response ?? null) as BoardDetailResponse);
    } catch (error: unknown) {
      await showSwal("error", "게시글 상세를 불러오지 못했습니다.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [boardId, isInvalidBoardId]);

  useEffect(() => {
    if (!user) return;
    fetchDetail();
  }, [fetchDetail, user]);

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

  const onSubmitComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      await showSwal("warning", "로그인 해주시기 바랍니다.");
      return;
    }

    const content = commentInput.trim();
    if (!content) {
      await showSwal("warning", "댓글 내용을 입력해주세요.");
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

  if (!user) {
    return (
      <section className="main-page">
        <CommunitySidebar />
        <div className="feed-area">
          <div className="board-detail-wrap">
            <p className="board-detail-empty">로그인 해주시기 바랍니다.</p>
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
            <p className="board-detail-empty">게시글을 불러오는 중...</p>
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
          <div className="board-detail-meta">
            <span>{detail.name}</span>
            <span>{detail.createdAt}</span>
          </div>
          <p className="board-detail-content">{detail.content}</p>

          {imageUrls.length > 0 && (
            <div className="board-detail-image-list">
              {imageUrls.map((url, index) => (
                <img
                  key={`${url}-${index}`}
                  src={url}
                  alt={`게시글 이미지 ${index + 1}`}
                  className="board-detail-image"
                />
              ))}
            </div>
          )}

          <div className="board-detail-counts">
            <span>좋아요 {detail.likeCnt}</span>
            <span>댓글 {detail.commentCnt}</span>
          </div>

          <form className="board-comment-form" onSubmit={onSubmitComment}>
            <textarea
              value={commentInput}
              onChange={(event) => setCommentInput(event.target.value)}
              placeholder="댓글을 입력해주세요"
              rows={3}
            />
            <button type="submit" disabled={isSubmittingComment}>
              {isSubmittingComment ? "작성 중..." : "댓글 작성"}
            </button>
          </form>

          <section className="board-comment-list">
            <h2>댓글</h2>
            {comments.length === 0 ? (
              <p className="board-comment-empty">댓글이 작성이 안되어있습니다.</p>
            ) : (
              comments.map((comment) => (
                <article key={comment.boardCommentIdx} className="board-comment-item">
                  <div className="board-comment-head">
                    <strong>{comment.name}</strong>
                    <span>{comment.createdTime}</span>
                  </div>
                  <p>{comment.content}</p>
                </article>
              ))
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
