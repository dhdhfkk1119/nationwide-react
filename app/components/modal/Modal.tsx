"use client";

import "@/app/styles/modal.css";

interface ModalData {
  title: string;
  content: string;
}

interface ModalProps {
  show: boolean;
  modalData?: ModalData;
  onClose: () => void;
}

export default function Modal({ show, modalData, onClose }: ModalProps) {
  if (!show || !modalData) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content custom-modal-content">
          <div className="modal-header custom-modal-header">
            <h5 className="modal-title">{modalData.title}</h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body custom-modal-body">{modalData.content}</div>

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
