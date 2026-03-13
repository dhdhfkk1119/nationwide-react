"use client";

import { useCallback, useRef, useState } from "react";

type DragDirection = "left" | "right";

type DragEndContext = {
  moved: boolean;
  target: HTMLDivElement;
};

type HorizontalDragOptions = {
  dragThreshold?: number;
  ignoreSelector?: string;
  onDragEnd?: (context: DragEndContext) => void;
};

type KeyedPointerDownOptions = {
  ignoreSelector?: string;
};

const DEFAULT_DRAG_THRESHOLD = 8;

const preventNativeDrag = (event: React.DragEvent<HTMLDivElement>) => {
  event.preventDefault();
};

export const useHorizontalDragScroll = ({
  dragThreshold = DEFAULT_DRAG_THRESHOLD,
  ignoreSelector,
  onDragEnd,
}: HorizontalDragOptions = {}) => {
  const [isDragging, setIsDragging] = useState(false);
  const stripRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef({
    startX: 0,
    startScrollLeft: 0,
    dragging: false,
  });
  const movedDuringDragRef = useRef(false);

  const scrollByStep = useCallback((step: number, direction: DragDirection) => {
    if (!stripRef.current) return;

    const delta = direction === "right" ? step : -step;
    stripRef.current.scrollBy({ left: delta, behavior: "smooth" });
  }, []);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!stripRef.current) return;
      if (ignoreSelector && (event.target as Element).closest(ignoreSelector)) return;

      dragStateRef.current = {
        startX: event.clientX,
        startScrollLeft: stripRef.current.scrollLeft,
        dragging: true,
      };
      movedDuringDragRef.current = false;
      stripRef.current.style.scrollBehavior = "auto";
      setIsDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [ignoreSelector],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!stripRef.current || !dragStateRef.current.dragging) return;

      const diffX = event.clientX - dragStateRef.current.startX;
      if (Math.abs(diffX) > dragThreshold) {
        movedDuringDragRef.current = true;
      }
      stripRef.current.scrollLeft = dragStateRef.current.startScrollLeft - diffX;
    },
    [dragThreshold],
  );

  const onPointerUpOrCancel = useCallback(() => {
    if (!stripRef.current) return;

    stripRef.current.style.scrollBehavior = "smooth";
    dragStateRef.current.dragging = false;
    setIsDragging(false);
    onDragEnd?.({
      moved: movedDuringDragRef.current,
      target: stripRef.current,
    });
  }, [onDragEnd]);

  return {
    isDragging,
    movedDuringDragRef,
    onDragStart: preventNativeDrag,
    onPointerDown,
    onPointerMove,
    onPointerUpOrCancel,
    scrollByStep,
    stripRef,
  };
};

export const useKeyedHorizontalDragScroll = <Key extends string | number>(
  { dragThreshold = DEFAULT_DRAG_THRESHOLD }: Pick<HorizontalDragOptions, "dragThreshold"> = {},
) => {
  const [draggingKey, setDraggingKey] = useState<Key | null>(null);
  const stripRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dragStateRef = useRef({
    key: null as Key | null,
    startX: 0,
    startScrollLeft: 0,
  });
  const movedDuringDragRef = useRef<Record<string, boolean>>({});

  const setStripRef = useCallback(
    (key: Key) => (element: HTMLDivElement | null) => {
      stripRefs.current[String(key)] = element;
    },
    [],
  );

  const isDragging = useCallback((key: Key) => draggingKey === key, [draggingKey]);

  const didMove = useCallback((key: Key) => Boolean(movedDuringDragRef.current[String(key)]), []);

  const scrollByStep = useCallback((key: Key, step: number, direction: DragDirection) => {
    const strip = stripRefs.current[String(key)];
    if (!strip) return;

    const delta = direction === "right" ? step : -step;
    strip.scrollBy({ left: delta, behavior: "smooth" });
  }, []);

  const onPointerDown = useCallback(
    (
      key: Key,
      event: React.PointerEvent<HTMLDivElement>,
      options?: KeyedPointerDownOptions,
    ) => {
      const strip = stripRefs.current[String(key)];
      if (!strip) return;
      if (options?.ignoreSelector && (event.target as Element).closest(options.ignoreSelector)) {
        return;
      }

      dragStateRef.current = {
        key,
        startX: event.clientX,
        startScrollLeft: strip.scrollLeft,
      };
      movedDuringDragRef.current[String(key)] = false;
      strip.style.scrollBehavior = "auto";
      setDraggingKey(key);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [],
  );

  const onPointerMove = useCallback(
    (key: Key, event: React.PointerEvent<HTMLDivElement>) => {
      const strip = stripRefs.current[String(key)];
      if (!strip || dragStateRef.current.key !== key) return;

      const diffX = event.clientX - dragStateRef.current.startX;
      if (Math.abs(diffX) > dragThreshold) {
        movedDuringDragRef.current[String(key)] = true;
      }
      strip.scrollLeft = dragStateRef.current.startScrollLeft - diffX;
    },
    [dragThreshold],
  );

  const onPointerUpOrCancel = useCallback((key: Key) => {
    const strip = stripRefs.current[String(key)];
    if (strip) {
      strip.style.scrollBehavior = "smooth";
    }

    dragStateRef.current.key = null;
    setDraggingKey((current) => (current === key ? null : current));
  }, []);

  return {
    didMove,
    isDragging,
    onDragStart: preventNativeDrag,
    onPointerDown,
    onPointerMove,
    onPointerUpOrCancel,
    scrollByStep,
    setStripRef,
  };
};
