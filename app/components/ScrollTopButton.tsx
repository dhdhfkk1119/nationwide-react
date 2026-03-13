"use client";

import "@/app/styles/scroll-top.css";
import { useEffect, useState } from "react";

const BASE_OFFSET = 28;
const FOOTER_GAP = 20;
const SHOW_SCROLL_Y = 240;

export default function ScrollTopButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [bottomOffset, setBottomOffset] = useState(BASE_OFFSET);

  useEffect(() => {
    const updatePosition = () => {
      const nextVisible = window.scrollY > SHOW_SCROLL_Y;
      const footer = document.querySelector(".footer");

      let nextOffset = BASE_OFFSET;
      if (footer instanceof HTMLElement) {
        const footerRect = footer.getBoundingClientRect();
        const overlap = window.innerHeight - footerRect.top;
        if (overlap > 0) {
          nextOffset = BASE_OFFSET + overlap + FOOTER_GAP;
        }
      }

      setIsVisible(nextVisible);
      setBottomOffset(nextOffset);
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, { passive: true });
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, []);

  const onScrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      className={`scroll-top-button ${isVisible ? "is-visible" : ""}`}
      style={{ bottom: `${bottomOffset}px` }}
      onClick={onScrollTop}
      aria-label="맨 위로 이동"
    >
      <i className="bi bi-chevron-up"></i>
    </button>
  );
}
