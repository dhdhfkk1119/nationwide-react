"use client";

interface ModalProps {
  show: boolean;
  title?: string;
  children?: any;
  onClose: () => void;
}

export default function Modal({ show, title, children, onClose }: ModalProps) {
  if (!show) return null;

  return (
    <div
      className="modal fade show"
      style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body" style={{ whiteSpace: "pre-line" }}>
            {children}
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
