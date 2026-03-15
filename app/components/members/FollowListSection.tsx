"use client";

import { useState } from "react";
import { toProfileImageUrl } from "@/app/utils/imageUrl";

export type FollowMemberItem = {
  memberIdx: number;
  name: string;
  nickName?: string;
  bio?: string;
  thumbnailProfileImagePath?: string;
  isFollowing: boolean;
  isFollowedBy: boolean;
  isMutualFollow: boolean;
  hasPendingFollowRequest?: boolean;
};

export default function FollowListSection({
  items,
  emptyMessage,
  onOpenProfile,
  currentUserId,
  onToggleFollow,
  showRequestActions = false,
  onApproveRequest,
}: {
  items: FollowMemberItem[];
  emptyMessage: string;
  onOpenProfile: (memberId: number) => void;
  currentUserId: number | null;
  onToggleFollow: (item: FollowMemberItem) => Promise<void>;
  showRequestActions?: boolean;
  onApproveRequest?: (item: FollowMemberItem) => Promise<void>;
}) {
  const [pendingIds, setPendingIds] = useState<number[]>([]);

  if (items.length === 0) {
    return <p className="mypage-empty">{emptyMessage}</p>;
  }

  const isPending = (memberId: number) => pendingIds.includes(memberId);

  const runWithPending = async (
    memberId: number,
    action: () => Promise<void>,
  ) => {
    if (isPending(memberId)) {
      return;
    }

    setPendingIds((prev) => [...prev, memberId]);

    try {
      await action();
    } finally {
      setPendingIds((prev) => prev.filter((id) => id !== memberId));
    }
  };

  return (
    <div className="mypage-follow-list">
      {items.map((item) => {
        const showAction = currentUserId !== null && currentUserId !== item.memberIdx;
        const showPendingRequestActions =
          showRequestActions &&
          item.isFollowedBy &&
          item.hasPendingFollowRequest &&
          typeof onApproveRequest === "function";

        return (
          <div key={item.memberIdx} className="mypage-follow-item">
            <button
              type="button"
              className="mypage-follow-item-main"
              onClick={() => onOpenProfile(item.memberIdx)}
            >
              <img
                src={toProfileImageUrl(item.thumbnailProfileImagePath)}
                alt={`${item.nickName || item.name} profile`}
                className="mypage-follow-image"
              />

              <div className="mypage-follow-meta">
                <strong>{item.nickName || item.name}</strong>
                <span>{item.name}</span>
                {item.bio?.trim() ? <p>{item.bio.trim()}</p> : null}
              </div>
            </button>

            <div className="mypage-follow-actions">
              {item.isMutualFollow ? (
                <span className="mypage-follow-badge">서로 팔로우중</span>
              ) : item.isFollowedBy ? (
                <span className="mypage-follow-badge is-soft">나를 팔로우하고있음</span>
              ) : null}

              {showPendingRequestActions ? (
                <button
                  type="button"
                  className="mypage-follow-toggle"
                  onClick={() =>
                    void runWithPending(item.memberIdx, () => onApproveRequest(item))
                  }
                  disabled={isPending(item.memberIdx)}
                >
                  요청
                </button>
              ) : null}

              {showAction ? (
                <button
                  type="button"
                  className={`mypage-follow-toggle ${item.isFollowing ? "is-active" : ""}`}
                  onClick={() =>
                    void runWithPending(item.memberIdx, () => onToggleFollow(item))
                  }
                  disabled={isPending(item.memberIdx)}
                >
                  {item.isFollowing
                    ? "팔로잉"
                    : item.isFollowedBy
                      ? "맞팔로우"
                      : item.hasPendingFollowRequest
                        ? "요청됨"
                      : "맞팔로우"}
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
