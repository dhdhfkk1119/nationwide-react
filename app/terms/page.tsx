"use client";
import { useEffect, useState } from "react";
import Api from "@/service/api";
import SelectItem from "../components/ui/SelectItem";
import SubmitButton from "../components/ui/SubmitButton";
import Modal from "../components/modal/Modal";

export default function TermsPage() {
  const [termsList, setTermsList] = useState([]);
  const [selected, setSelected] = useState({}); // { 1: true, 2: false }
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState({ title: "", content: "" });

  const openModal = (item) => {
    setModalData({
      title: item.title,
      content: item.contents,
    });
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    try {
      const res = await Api.getTemrList();
      const list = res.data.response.terms;

      setTermsList(list);

      // 체크 상태 초기화
      const init = {};
      list.forEach((item) => (init[item.id] = false));
      setSelected(init);
    } catch (err) {
      console.error("약관 목록 가져오기 실패:", err);
    }
  };

  // 전체 선택
  const toggleAll = () => {
    const allChecked = Object.values(selected).every((v) => v === true);

    const newState = {};
    Object.keys(selected).forEach((id) => (newState[id] = !allChecked));

    setSelected(newState);
  };

  // 개별 선택
  const toggleItem = (id: number) => {
    setSelected({ ...selected, [id]: !selected[id] });
  };

  return (
    <div className="TermsPage container mt-4">
      <h3>약관 목록</h3>

      {/* 전체 선택 */}
      <SelectItem
        label="전체 동의"
        checked={Object.values(selected).every((v) => v === true)}
        onChange={toggleAll}
      />

      <hr />

      {/* 약관 목록 */}
      <ul>
        {termsList.map((item) => (
          <li key={item.id} className="mb-3">
            <div className="d-flex align-items-center">
              <SelectItem
                label={`[${item.required ? "필수" : "선택"}] ${item.title}`}
                checked={selected[item.id]}
                onChange={() => toggleItem(item.id)}
              />
              <button
                className="btn btn-sm btn-outline-secondary ms-2"
                onClick={() => openModal(item)}
              >
                보기
              </button>
            </div>
            <div>
              {/* 상세 내용 미리보기 */}
              <p className="mt-2 text-muted text-wrap text-break">
                {item.content.length > 100
                  ? item.content.slice(0, 100) + "..."
                  : item.content}
              </p>
            </div>
          </li>
        ))}

        <SubmitButton text="회원가입" />
      </ul>
      {/* 약관 상세 모달 */}
      <Modal
        show={modalOpen}
        title={modalData.title}
        onClose={() => setModalOpen(false)}
      >
        {modalData.content}
      </Modal>
    </div>
  );
}
