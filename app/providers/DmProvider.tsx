"use client";

import { Client, type IMessage } from "@stomp/stompjs";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import memberApi from "@/service/api";

export type IncomingMessage = {
  messageId: number;
  threadId: number;
  senderId: number;
  content: string;
  createdAt: string;
  isMine: boolean;
};

type DmContextValue = {
  unreadCount: number;
  latestMessage: IncomingMessage | null;
  activeThreadId: number | null;
  setActiveThreadId: (threadId: number | null) => void;
  sendMessage: (threadId: number, content: string) => void;
  refreshUnreadCount: () => Promise<void>;
};

const DmContext = createContext<DmContextValue | null>(null);

const resolveWsUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const httpBase = apiUrl.replace(/\/api\/?$/, "");
  return httpBase.replace(/^http/, "ws") + "/ws";
};

export function DmProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestMessage, setLatestMessage] = useState<IncomingMessage | null>(null);
  const [activeThreadId, setActiveThreadIdState] = useState<number | null>(null);
  const clientRef = useRef<Client | null>(null);
  const activeThreadIdRef = useRef<number | null>(null);

  const setActiveThreadId = useCallback((threadId: number | null) => {
    activeThreadIdRef.current = threadId;
    setActiveThreadIdState(threadId);
  }, []);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const res = await memberApi.getMessageThreads(0, 50);
      const items: Array<{ unreadCount?: number }> = res.data?.response?.content ?? [];
      const total = items.reduce((sum, item) => sum + (item.unreadCount ?? 0), 0);
      setUnreadCount(total);
    } catch (error) {
      console.error("대화 목록을 불러오지 못했습니다.", error);
    }
  }, []);

  useEffect(() => {
    if (loading || !user || typeof window === "undefined") return;

    const token = localStorage.getItem("accessToken");
    if (!token) return;

    void refreshUnreadCount();

    const client = new Client({
      brokerURL: resolveWsUrl(),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe("/user/queue/messages", (message: IMessage) => {
          try {
            const payload = JSON.parse(message.body) as IncomingMessage;
            setLatestMessage(payload);
            // 정확한 안읽은 수를 위해 스레드 목록을 다시 조회한다 (로컬 증감 대신 서버 값으로 동기화)
            void refreshUnreadCount();
          } catch (error) {
            console.error("메시지 파싱 실패:", error);
          }
        });
      },
      onStompError: (frame) => {
        console.error("웹소켓 연결 오류:", frame.headers["message"]);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      void client.deactivate();
      clientRef.current = null;
    };
  }, [loading, user, refreshUnreadCount]);

  const sendMessage = useCallback((threadId: number, content: string) => {
    clientRef.current?.publish({
      destination: "/app/chat.send",
      body: JSON.stringify({ threadId, content }),
    });
  }, []);

  return (
    <DmContext.Provider
      value={{
        unreadCount,
        latestMessage,
        activeThreadId,
        setActiveThreadId,
        sendMessage,
        refreshUnreadCount,
      }}
    >
      {children}
    </DmContext.Provider>
  );
}

export const useDm = () => {
  const context = useContext(DmContext);
  if (!context) {
    throw new Error("useDm must be used within DmProvider");
  }
  return context;
};
