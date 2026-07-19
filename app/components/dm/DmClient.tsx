"use client";

import "@/app/styles/main.css";
import "@/app/styles/mypage.css";
import "@/app/styles/board-detail.css";
import "@/app/styles/dm.css";
import CommunitySidebar from "@/app/components/community/CommunitySidebar";
import { confirmSwal } from "@/app/components/modal/Swal";
import showSwal from "@/app/components/modal/Swal";
import { useAuth } from "@/app/providers/AuthProvider";
import { useDm } from "@/app/providers/DmProvider";
import { toProfileImageUrl } from "@/app/utils/imageUrl";
import memberApi from "@/service/api";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type ThreadItem = {
  threadId: number;
  memberIdx: number;
  name: string;
  nickName?: string;
  thumbnailProfileImagePath?: string;
  lastMessagePreview?: string;
  lastMessageAt?: string;
  unreadCount: number;
};

type MessageItem = {
  messageId: number;
  threadId: number;
  senderId: number;
  content: string;
  createdAt: string;
  isMine: boolean;
};

export default function DmClient() {
  const { user, loading } = useAuth();
  const { activeThreadId, setActiveThreadId, latestMessage, sendMessage, refreshUnreadCount } = useDm();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeThread = threads.find((thread) => thread.threadId === activeThreadId) ?? null;

  const loadThreads = useCallback(async () => {
    setIsLoadingThreads(true);
    try {
      const res = await memberApi.getMessageThreads(0, 50);
      const content: ThreadItem[] = res.data?.response?.content ?? [];
      setThreads(content);
    } catch (error) {
      console.error("대화 목록을 불러오지 못했습니다.", error);
    } finally {
      setIsLoadingThreads(false);
    }
  }, []);

  const loadMessages = useCallback(async (threadId: number) => {
    setIsLoadingMessages(true);
    try {
      const res = await memberApi.getThreadMessages(threadId, 0, 30);
      const content: MessageItem[] = res.data?.response?.content ?? [];
      setMessages([...content].reverse());
    } catch (error) {
      console.error("메시지를 불러오지 못했습니다.", error);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  const onSelectThread = useCallback(
    async (threadId: number) => {
      setActiveThreadId(threadId);
      await loadMessages(threadId);
      try {
        await memberApi.markThreadRead(threadId);
        setThreads((prev) =>
          prev.map((thread) => (thread.threadId === threadId ? { ...thread, unreadCount: 0 } : thread)),
        );
        await refreshUnreadCount();
      } catch (error) {
        console.error("읽음 처리에 실패했습니다.", error);
      }
    },
    [loadMessages, refreshUnreadCount, setActiveThreadId],
  );

  // 최초 진입: 대화 목록 로드, ?target= 쿼리가 있으면 해당 상대와의 스레드 확보 후 자동 선택
  useEffect(() => {
    if (loading || !user) return;

    void (async () => {
      await loadThreads();

      const targetMemberId = searchParams.get("target");
      if (targetMemberId) {
        try {
          const res = await memberApi.createOrGetThread(Number(targetMemberId));
          const threadId = res.data?.response?.threadId;
          if (threadId) {
            await loadThreads();
            await onSelectThread(threadId);
          }
        } catch (error: any) {
          showSwal(
            "error",
            error?.response?.data?.error?.message || "메시지를 보낼 수 없는 상대입니다.",
          );
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user]);

  // 실시간 수신 메시지 처리
  useEffect(() => {
    if (!latestMessage) return;

    if (latestMessage.threadId === activeThreadId) {
      setMessages((prev) =>
        prev.some((m) => m.messageId === latestMessage.messageId) ? prev : [...prev, latestMessage],
      );
      void memberApi.markThreadRead(latestMessage.threadId).catch(() => {});
    }

    void loadThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const onSubmitMessage = (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeThreadId || !draft.trim()) return;

    sendMessage(activeThreadId, draft.trim());
    setDraft("");
  };

  const onDeleteThread = async (threadId: number) => {
    const result = await confirmSwal({
      icon: "warning",
      title: "대화 삭제",
      html: "이 대화를 삭제하시겠습니까?",
      showCancelButton: true,
      confirmButtonText: "삭제",
      cancelButtonText: "취소",
    });
    if (!result.isConfirmed) return;

    try {
      await memberApi.deleteThread(threadId);
      setThreads((prev) => prev.filter((thread) => thread.threadId !== threadId));
      if (activeThreadId === threadId) {
        setActiveThreadId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error("대화 삭제에 실패했습니다.", error);
      showSwal("error", "대화 삭제에 실패했습니다.");
    }
  };

  const onBlockUser = async (memberIdx: number, threadId: number) => {
    const result = await confirmSwal({
      icon: "warning",
      title: "차단",
      html: "이 사용자를 차단하시겠습니까? 차단하면 서로의 프로필과 게시물이 보이지 않게 됩니다.",
      showCancelButton: true,
      confirmButtonText: "차단",
      cancelButtonText: "취소",
    });
    if (!result.isConfirmed) return;

    try {
      await memberApi.toggleBlock(memberIdx);
      await showSwal("success", "차단했습니다.");
      setThreads((prev) => prev.filter((thread) => thread.threadId !== threadId));
      if (activeThreadId === threadId) {
        setActiveThreadId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error("차단에 실패했습니다.", error);
      showSwal("error", "차단에 실패했습니다.");
    }
  };

  return (
    <section className="main-page">
      <CommunitySidebar activeMenuKey="message" />

      <div className="feed-area">
        {loading ? (
          <section className="mypage-shell">
            <p className="mypage-empty">불러오는 중입니다.</p>
          </section>
        ) : !user ? (
          <section className="mypage-shell">
            <p className="mypage-empty">로그인 후 이용할 수 있습니다.</p>
          </section>
        ) : (
          <section className="dm-shell">
            <div className="dm-conversation-panel">
              {activeThread ? (
                <>
                  <div className="dm-conversation-header">
                    <img
                      src={toProfileImageUrl(activeThread.thumbnailProfileImagePath)}
                      alt={`${activeThread.nickName || activeThread.name} profile`}
                      className="dm-conversation-avatar"
                      role="button"
                      tabIndex={0}
                      onClick={() => router.push(`/members/${activeThread.memberIdx}`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          router.push(`/members/${activeThread.memberIdx}`);
                        }
                      }}
                    />
                    <strong>{activeThread.nickName || activeThread.name}</strong>
                  </div>

                  <div className="dm-messages-scroll">
                    {isLoadingMessages ? (
                      <p className="mypage-empty">불러오는 중입니다.</p>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.messageId}
                          className={`dm-message ${message.isMine ? "is-mine" : ""}`}
                        >
                          <span>{message.content}</span>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <form className="dm-input-row" onSubmit={onSubmitMessage}>
                    <input
                      type="text"
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder="메시지를 입력하세요"
                    />
                    <button type="submit" disabled={!draft.trim()}>
                      전송
                    </button>
                  </form>
                </>
              ) : (
                <p className="dm-empty-placeholder">대화를 선택해주세요.</p>
              )}
            </div>

            <div className="dm-thread-list-panel">
              <h2>대화 목록</h2>

              {isLoadingThreads ? (
                <p className="mypage-empty">불러오는 중입니다.</p>
              ) : threads.length === 0 ? (
                <p className="mypage-empty">대화가 없습니다.</p>
              ) : (
                threads.map((thread) => (
                  <div
                    key={thread.threadId}
                    className={`dm-thread-item ${activeThreadId === thread.threadId ? "is-active" : ""}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => void onSelectThread(thread.threadId)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        void onSelectThread(thread.threadId);
                      }
                    }}
                  >
                    <img
                      src={toProfileImageUrl(thread.thumbnailProfileImagePath)}
                      alt={`${thread.nickName || thread.name} profile`}
                      className="dm-thread-avatar"
                    />
                    <div className="dm-thread-meta">
                      <strong>{thread.nickName || thread.name}</strong>
                      <p>{thread.lastMessagePreview || "대화를 시작해보세요."}</p>
                    </div>

                    {thread.unreadCount > 0 ? (
                      <span className="sidebar-notification-badge dm-thread-unread-badge">
                        {thread.unreadCount > 99 ? "99+" : thread.unreadCount}
                      </span>
                    ) : null}

                    <details
                      className="board-detail-menu dm-thread-menu"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <summary className="board-detail-menu-trigger" aria-label="대화 메뉴 열기">
                        <i className="bi bi-three-dots"></i>
                      </summary>
                      <ul className="board-detail-menu-list">
                        <li>
                          <button type="button" onClick={() => void onDeleteThread(thread.threadId)}>
                            삭제
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            onClick={() => void onBlockUser(thread.memberIdx, thread.threadId)}
                          >
                            차단
                          </button>
                        </li>
                      </ul>
                    </details>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </div>
    </section>
  );
}
