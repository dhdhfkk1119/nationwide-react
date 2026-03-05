"use client";

interface ModalProps {
  show: boolean;
  modalData?: any;
  onClose: () => void;
}

export default function Modal({ show, modalData, onClose }: ModalProps) {
  if (!show) return null;

  return (
    <div
      className="modal fade show"
      style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{modalData.title}</h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body" style={{ whiteSpace: "pre-line" }}>
            {modalData.content}
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
