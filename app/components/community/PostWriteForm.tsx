"use client";

import "@/app/styles/post-write.css";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import showSwal from "@/app/components/modal/Swal";
import { useHorizontalDragScroll } from "@/app/hooks/useHorizontalDragScroll";
import memberApi from "@/service/api";

type SelectedImage = {
  file: File;
  previewUrl: string;
};

const MAX_IMAGES = 5;
const IMAGE_SIZE = 300;
const IMAGE_GAP = 10;
const IMAGE_SCROLL_STEP = IMAGE_SIZE + IMAGE_GAP;

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("이미지 미리보기를 불러오지 못했습니다."));
    reader.readAsDataURL(file);
  });

export default function PostWriteForm() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const {
    isDragging,
    movedDuringDragRef,
    onPointerDown,
    onPointerMove,
    onPointerUpOrCancel,
    scrollByStep,
    stripRef,
  } = useHorizontalDragScroll({ ignoreSelector: "button" });

  const canAddCount = MAX_IMAGES - selectedImages.length;

  const onSelectImages = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || canAddCount <= 0) return;

    const validFiles = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, canAddCount);

    if (!validFiles.length) return;

    try {
      const previews = await Promise.all(validFiles.map(readFileAsDataUrl));
      const imageFiles = validFiles.map((file, index) => ({
        file,
        previewUrl: previews[index],
      }));
      setSelectedImages((prev) => [...prev, ...imageFiles]);
    } catch {
      await showSwal("error", "이미지 미리보기를 생성하지 못했습니다.");
    } finally {
      event.target.value = "";
    }
  };

  const onRemoveImage = (index: number) => {
    setSelectedImages((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      await showSwal("error", "내용을 입력해주세요.");
      return;
    }

    const formData = new FormData();
    formData.append(
      "data",
      new Blob([JSON.stringify({ title: "", content: trimmedContent })], {
        type: "application/json",
      }),
    );
    selectedImages.forEach((image) => formData.append("files", image.file));

    try {
      setIsSubmitting(true);
      await memberApi.createBoard(formData);
      await showSwal("success", "게시글을 등록했습니다.");

      setContent("");
      setSelectedImages([]);
      router.push("/");
    } catch (error: unknown) {
      const errorMessage =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: unknown }).response === "object"
          ? (error as { response?: { data?: { error?: { message?: string } } } })
              .response?.data?.error?.message
          : undefined;
      const message = errorMessage ?? "게시글 등록에 실패했습니다.";
      await showSwal("error", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="post-write-wrap">
      <header className="post-write-header">
        <h1>게시글 작성</h1>
        <p>우리 동네 소식을 자유롭게 공유해보세요.</p>
      </header>

      <form className="post-write-form" onSubmit={onSubmit}>
        <div className="post-field">
          <label htmlFor="post-content">내용</label>
          <textarea
            id="post-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="내용을 입력해주세요"
            rows={8}
            required
          />
        </div>

        <div className="post-field">
          <div className="post-image-head">
            <label htmlFor="post-images">이미지 ({selectedImages.length}/{MAX_IMAGES})</label>
            <span>최대 5장</span>
          </div>

          <input
            id="post-images"
            type="file"
            accept="image/*"
            multiple
            onChange={onSelectImages}
            disabled={canAddCount <= 0 || isSubmitting}
          />

          {selectedImages.length > 0 && (
            <div className="image-slider">
              <div className={`write-image-strip-mask ${isDragging ? "is-dragging" : ""}`}>
                <div
                  ref={stripRef}
                  className={`write-image-strip ${isDragging ? "is-dragging" : ""}`}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUpOrCancel}
                  onPointerCancel={onPointerUpOrCancel}
                >
                  {selectedImages.map((image, index) => (
                    <div className="write-image-item" key={`${image.file.name}-${index}`}>
                      <button
                        type="button"
                        className="write-image-remove-btn"
                        onClick={() => onRemoveImage(index)}
                        disabled={isSubmitting}
                      >
                        <i className="bi bi-x-lg" aria-hidden="true"></i>
                      </button>
                      <img
                        src={image.previewUrl}
                        alt={`업로드 이미지 ${index + 1}`}
                        className="write-image"
                        draggable={false}
                        onClick={() => {
                          if (movedDuringDragRef.current) return;
                          setZoomedImage(image.previewUrl);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {selectedImages.length > 1 && (
                <div className="write-image-controls">
                  <button
                    type="button"
                    onClick={() => scrollByStep(IMAGE_SCROLL_STEP, "left")}
                    disabled={isSubmitting}
                  >
                    <i className="bi bi-chevron-left" aria-hidden="true"></i>
                    이전
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollByStep(IMAGE_SCROLL_STEP, "right")}
                    disabled={isSubmitting}
                  >
                    다음
                    <i className="bi bi-chevron-right" aria-hidden="true"></i>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="post-submit-row">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "등록 중..." : "게시글 등록"}
          </button>
        </div>
      </form>

      {zoomedImage && (
        <div className="write-image-modal" onClick={() => setZoomedImage(null)}>
          <img src={zoomedImage} alt="확대 이미지" className="write-image-modal-img" />
        </div>
      )}
    </section>
  );
}
