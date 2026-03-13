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
};

export default function FollowListSection({
  items,
  emptyMessage,
  onOpenProfile,
  currentUserId,
  onToggleFollow,
}: {
  items: FollowMemberItem[];
  emptyMessage: string;
  onOpenProfile: (memberId: number) => void;
  currentUserId: number | null;
  onToggleFollow: (item: FollowMemberItem) => Promise<void>;
}) {
  const [pendingIds, setPendingIds] = useState<number[]>([]);

  if (items.length === 0) {
    return <p className="mypage-empty">{emptyMessage}</p>;
  }

  const isPending = (memberId: number) => pendingIds.includes(memberId);

  const handleToggleFollow = async (item: FollowMemberItem) => {
    if (isPending(item.memberIdx)) {
      return;
    }

    setPendingIds((prev) => [...prev, item.memberIdx]);

    try {
      await onToggleFollow(item);
    } finally {
      setPendingIds((prev) => prev.filter((memberId) => memberId !== item.memberIdx));
    }
  };

  return (
    <div className="mypage-follow-list">
      {items.map((item) => {
        const showAction = currentUserId !== null && currentUserId !== item.memberIdx;

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

              {showAction ? (
                <button
                  type="button"
                  className={`mypage-follow-toggle ${item.isFollowing ? "is-active" : ""}`}
                  onClick={() => void handleToggleFollow(item)}
                  disabled={isPending(item.memberIdx)}
                >
                  {item.isFollowing ? "팔로잉" : "팔로우"}
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
