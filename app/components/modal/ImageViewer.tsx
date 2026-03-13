"use client";

import { useEffect, useMemo, useState } from "react";
import { useHorizontalDragScroll } from "@/app/hooks/useHorizontalDragScroll";
import "@/app/styles/image-viewer.css";

type ImageViewerProps = {
  images: string[];
  initialIndex: number;
  onClose: () => void;
};

export default function ImageViewer({ images, initialIndex, onClose }: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const {
    isDragging,
    onPointerDown,
    onPointerMove,
    onPointerUpOrCancel,
    stripRef,
  } = useHorizontalDragScroll({
    onDragEnd: ({ target }) => {
      const width = target.clientWidth || 1;
      const nextIndex = Math.round(target.scrollLeft / width);
      setCurrentIndex(Math.min(Math.max(nextIndex, 0), images.length - 1));
    },
  });

  const safeIndex = useMemo(() => {
    if (images.length === 0) return 0;
    return Math.min(Math.max(initialIndex, 0), images.length - 1);
  }, [images.length, initialIndex]);

  useEffect(() => {
    setCurrentIndex(safeIndex);
  }, [safeIndex]);

  useEffect(() => {
    if (!stripRef.current) return;
    stripRef.current.scrollTo({
      left: stripRef.current.clientWidth * currentIndex,
      behavior: "smooth",
    });
  }, [currentIndex, stripRef]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") {
        setCurrentIndex((prev) => Math.max(0, prev - 1));
      }
      if (event.key === "ArrowRight") {
        setCurrentIndex((prev) => Math.min(images.length - 1, prev + 1));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [images.length, onClose]);

  if (images.length === 0) return null;

  const onMoveSlide = (direction: "left" | "right") => {
    setCurrentIndex((prev) => {
      if (direction === "left") return Math.max(0, prev - 1);
      return Math.min(images.length - 1, prev + 1);
    });
  };

  return (
    <div className="image-viewer-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <button type="button" className="image-viewer-close" onClick={onClose} aria-label="닫기">
        <i className="bi bi-x-lg"></i>
      </button>

      <div className="image-viewer-shell" onClick={(event) => event.stopPropagation()}>
        <div
          ref={stripRef}
          className={`image-viewer-strip ${isDragging ? "is-dragging" : ""}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUpOrCancel}
          onPointerCancel={onPointerUpOrCancel}
        >
          {images.map((image, index) => (
            <div key={`${image}-${index}`} className="image-viewer-slide">
              <img src={image} alt={`확대 이미지 ${index + 1}`} className="image-viewer-image" draggable={false} />
            </div>
          ))}
        </div>

        {images.length > 1 && (
          <>
            <button
              type="button"
              className="image-viewer-nav left"
              onClick={() => onMoveSlide("left")}
              aria-label="이전 이미지"
            >
              <i className="bi bi-chevron-left"></i>
            </button>
            <button
              type="button"
              className="image-viewer-nav right"
              onClick={() => onMoveSlide("right")}
              aria-label="다음 이미지"
            >
              <i className="bi bi-chevron-right"></i>
            </button>
            <div className="image-viewer-count">
              {currentIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
