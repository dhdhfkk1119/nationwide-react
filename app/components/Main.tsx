"use client";

import "@/app/styles/main.css";
import { useEffect, useMemo, useRef, useState } from "react";

type SortType = "latest" | "views" | "likes";

interface FeedPost {
  id: number;
  author: string;
  distance: string;
  text: string;
  likes: number;
  comments: number;
  views: number;
  createdAt: string;
}

const menuItems = [
  { key: "profile", label: "프로필", icon: "bi-person-circle", href: "/mypage" },
  {
    key: "neighbors",
    label: "동네친구",
    icon: "bi-geo-alt-fill",
    href: "/neighbors",
  },
  { key: "message", label: "메시지", icon: "bi-chat-dots-fill", href: "/dm" },
  {
    key: "notification",
    label: "알림",
    icon: "bi-bell-fill",
    href: "/notifications",
  },
  {
    key: "support",
    label: "고객센터",
    icon: "bi-headset",
    href: "/support",
  },
  { key: "setting", label: "설정", icon: "bi-gear-fill", href: "/settings" },
  { key: "shop", label: "상점", icon: "bi-bag-fill", href: "/shop" },
];

const samplePosts: FeedPost[] = [
  {
    id: 1,
    author: "다온",
    distance: "0.8km",
    text: "오늘 저녁에 같이 산책하실 분 있나요? 한강 쪽으로 가요.",
    likes: 28,
    comments: 9,
    views: 154,
    createdAt: "2026-03-06T10:10:00",
  },
  {
    id: 2,
    author: "하린",
    distance: "1.1km",
    text: "동네 새로 생긴 브런치 카페 다녀왔는데 분위기 좋아요.",
    likes: 42,
    comments: 13,
    views: 231,
    createdAt: "2026-03-05T18:20:00",
  },
  {
    id: 3,
    author: "시우",
    distance: "2.4km",
    text: "주말에 전시회 보러 갈 사람 구해요. 관심 있으면 DM 주세요.",
    likes: 17,
    comments: 6,
    views: 98,
    createdAt: "2026-03-04T09:35:00",
  },
  {
    id: 4,
    author: "지안",
    distance: "0.5km",
    text: "퇴근하고 가볍게 운동 같이 할 분 찾습니다.",
    likes: 35,
    comments: 11,
    views: 186,
    createdAt: "2026-03-06T08:05:00",
  },
  {
    id: 5,
    author: "유진",
    distance: "1.9km",
    text: "반려견 산책 모임 만들어볼까 해요. 관심 있으면 댓글 부탁해요.",
    likes: 51,
    comments: 22,
    views: 302,
    createdAt: "2026-03-03T20:50:00",
  },
];

const sortLabelMap: Record<SortType, string> = {
  latest: "최신순",
  views: "조회순",
  likes: "좋아요순",
};

export default function Main() {
  const [query, setQuery] = useState("");
  const [sortType, setSortType] = useState<SortType>("latest");
  const sortDropdownRef = useRef<HTMLDetailsElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(target)
      ) {
        sortDropdownRef.current.removeAttribute("open");
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const filteredPosts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const searched = samplePosts.filter((post) => {
      if (!normalized) return true;
      return (
        post.author.toLowerCase().includes(normalized) ||
        post.text.toLowerCase().includes(normalized)
      );
    });

    return [...searched].sort((a, b) => {
      if (sortType === "views") return b.views - a.views;
      if (sortType === "likes") return b.likes - a.likes;
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
  }, [query, sortType]);

  return (
    <section className="main-page">
      {/*
        Feed API Spec (예시)
        Endpoint: GET /api/posts/feed?page=0&size=20&query={query}&sort={latest|views|likes}
        Response: {
          "response": {
            "content": [{ "id": 1, "author": "string", "distanceKm": 1.2, "content": "string", "likeCount": 0, "commentCount": 0, "viewCount": 0, "createdAt": "2026-03-06T10:00:00" }],
            "page": 0,
            "size": 20,
            "hasNext": true
          }
        }
      */}
      <aside className="main-sidebar" aria-label="main menu">
        <div className="sidebar-title">커뮤니티 메뉴</div>
        <nav>
          <ul className="menu-list">
            {menuItems.map((item) => (
              <li key={item.key}>
                <a className="menu-link" href={item.href}>
                  <i className={`bi ${item.icon}`} aria-hidden="true"></i>
                  <span>{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="feed-area">
        <header className="feed-header">
          <h1>동네 피드</h1>
          <p>근처 사람들의 게시글을 확인하고 소통해보세요.</p>

          <div className="feed-filter-row">
            <div className="feed-search-box">
              <i className="bi bi-search"></i>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="게시물을 검색하세요"
              />
            </div>

            <details className="feed-sort-dropdown" ref={sortDropdownRef}>
              <summary className="feed-sort-trigger">
                <span>{sortLabelMap[sortType]}</span>
                <i className="bi bi-chevron-down feed-sort-icon"></i>
              </summary>
              <ul className="feed-sort-menu">
                <li>
                  <button
                    type="button"
                    onClick={(e) => {
                      setSortType("latest");
                      e.currentTarget.closest("details")?.removeAttribute("open");
                    }}
                  >
                    최신순
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={(e) => {
                      setSortType("views");
                      e.currentTarget.closest("details")?.removeAttribute("open");
                    }}
                  >
                    조회순
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={(e) => {
                      setSortType("likes");
                      e.currentTarget.closest("details")?.removeAttribute("open");
                    }}
                  >
                    좋아요순
                  </button>
                </li>
              </ul>
            </details>
          </div>
        </header>

        <div className="feed-list">
          {filteredPosts.map((post) => (
            <article key={post.id} className="feed-card">
              <div className="feed-card-header">
                <div className="feed-author">
                  <strong>{post.author}</strong>
                  <span>{post.distance}</span>
                </div>

                <details className="post-menu">
                  <summary className="feed-more-btn" aria-label="게시물 메뉴 열기">
                    <i className="bi bi-three-dots"></i>
                  </summary>
                  <ul className="post-menu-list">
                    <li>
                      <button type="button">수정</button>
                    </li>
                    <li>
                      <button type="button">삭제</button>
                    </li>
                    <li>
                      <button type="button">신고</button>
                    </li>
                  </ul>
                </details>
              </div>

              <p className="feed-content">{post.text}</p>

              <div className="feed-actions">
                <button type="button">
                  <i className="bi bi-heart"></i>
                  <span>{post.likes}</span>
                </button>
                <button type="button">
                  <i className="bi bi-chat"></i>
                  <span>{post.comments}</span>
                </button>
                <button type="button">
                  <i className="bi bi-send"></i>
                  <span>DM</span>
                </button>
              </div>

              <div className="feed-meta">
                <span>
                  <i className="bi bi-eye"></i> 조회수 {post.views}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
