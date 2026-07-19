"use client";

import "@/app/styles/modal.css";
import "@/app/styles/account-info-modal.css";
import { toProfileImageUrl } from "@/app/utils/imageUrl";

export type AccountInfoSummary = {
  name: string;
  nickName?: string;
  thumbnailProfileImagePath?: string;
  createdAt?: string;
  location?: string;
  isPhoneVerified?: boolean;
};

const formatJoinedDate = (value?: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(parsed);
};

export default function AccountInfoModal({
  summary,
  onClose,
}: {
  summary: AccountInfoSummary;
  onClose: () => void;
}) {
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content custom-modal-content account-info-modal-content">
          <div className="modal-header custom-modal-header">
            <h5 className="modal-title">이 계정 정보</h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body custom-modal-body account-info-modal-body">
            <img
              src={toProfileImageUrl(summary.thumbnailProfileImagePath)}
              alt={`${summary.nickName || summary.name} profile`}
              className="account-info-modal-image"
            />

            <div className="account-info-modal-name-row">
              <strong>{summary.nickName || summary.name}</strong>
              {summary.isPhoneVerified ? (
                <span className="account-info-modal-badge">
                  <i className="bi bi-patch-check-fill"></i>
                  인증됨
                </span>
              ) : null}
            </div>

            <dl className="account-info-modal-meta">
              <div>
                <dt>가입일</dt>
                <dd>{formatJoinedDate(summary.createdAt)}</dd>
              </div>
              <div>
                <dt>계정 위치</dt>
                <dd>{summary.location?.trim() ? summary.location : "비공개"}</dd>
              </div>
            </dl>
          </div>

          <div className="modal-footer custom-modal-footer">
            <button className="btn custom-modal-close-btn" onClick={onClose}>
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
