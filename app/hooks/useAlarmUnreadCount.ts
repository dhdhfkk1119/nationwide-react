"use client";

import { useEffect, useState } from "react";
import memberApi from "@/service/api";

export default function useAlarmUnreadCount(enabled: boolean) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    let isMounted = true;

    const fetchUnreadCount = async () => {
      try {
        const res = await memberApi.getAlarmUnreadCount();
        const nextCount = Number(res.data?.response?.unreadCount ?? 0);

        if (isMounted) {
          setUnreadCount(nextCount);
        }
      } catch (error) {
        console.error("알림 개수 조회 실패:", error);
      }
    };

    void fetchUnreadCount();
    const intervalId = window.setInterval(() => {
      void fetchUnreadCount();
    }, 15000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [enabled]);

  return unreadCount;
}
