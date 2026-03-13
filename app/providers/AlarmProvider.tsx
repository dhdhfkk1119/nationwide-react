"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/app/providers/AuthProvider";

type AlarmItem = {
  alarmIdx: number;
  type: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  actorMemberIdx: number;
  actorName: string;
  actorThumbnailProfileImagePath?: string;
  boardIdx?: number | null;
  boardThumbnailImagePath?: string | null;
};

type AlarmContextValue = {
  unreadCount: number;
  latestAlarm: AlarmItem | null;
  markAlarmRead: (alarmId: number) => void;
};

type StreamPayload = {
  unreadCount?: number;
  alarm?: AlarmItem | null;
};

const AlarmContext = createContext<AlarmContextValue | null>(null);

const normalizeBaseUrl = () =>
  (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

export function AlarmProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestAlarm, setLatestAlarm] = useState<AlarmItem | null>(null);

  useEffect(() => {
    if (loading || !user || typeof window === "undefined") return;

    const token = localStorage.getItem("accessToken");
    const baseUrl = normalizeBaseUrl();

    if (!token || !baseUrl) {
      return;
    }

    const separator = baseUrl.includes("?") ? "&" : "?";
    const streamUrl = `${baseUrl}/alarms/stream${separator}accessToken=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(streamUrl);

    const onInit = (event: MessageEvent<string>) => {
      try {
        const payload = JSON.parse(event.data) as StreamPayload;
        setUnreadCount(Number(payload.unreadCount ?? 0));
      } catch (error) {
        console.error("알림 SSE 초기 데이터 파싱 실패:", error);
      }
    };

    const onAlarm = (event: MessageEvent<string>) => {
      try {
        const payload = JSON.parse(event.data) as StreamPayload;
        setUnreadCount(Number(payload.unreadCount ?? 0));
        if (payload.alarm) {
          setLatestAlarm(payload.alarm);
        }
      } catch (error) {
        console.error("알림 SSE 데이터 파싱 실패:", error);
      }
    };

    eventSource.addEventListener("init", onInit as EventListener);
    eventSource.addEventListener("alarm", onAlarm as EventListener);
    eventSource.onerror = () => {
      console.error("알림 SSE 연결 오류");
    };

    return () => {
      eventSource.removeEventListener("init", onInit as EventListener);
      eventSource.removeEventListener("alarm", onAlarm as EventListener);
      eventSource.close();
    };
  }, [loading, user]);

  const markAlarmRead = (alarmId: number) => {
    setLatestAlarm((prev) => (prev?.alarmIdx === alarmId ? null : prev));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <AlarmContext.Provider value={{ unreadCount, latestAlarm, markAlarmRead }}>
      {children}
    </AlarmContext.Provider>
  );
}

export const useAlarm = () => {
  const context = useContext(AlarmContext);
  if (!context) {
    throw new Error("useAlarm must be used within AlarmProvider");
  }
  return context;
};
