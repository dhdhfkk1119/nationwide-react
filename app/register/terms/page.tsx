"use client";
import { useEffect, useState } from "react";
import Api from "@/service/api";
import SelectItem from "@/app/components/ui/SelectItem";
import SubmitButton from "@/app/components/ui/SubmitButton";
import Modal from "@/app/components/modal/Modal";
import showSwal from "@/app/components/modal/Swal";
import { useRegister } from "@/app/providers/RegisterProvider";
import { useRouter } from "next/navigation";

export default function TermsPage() {
  const router = useRouter();
  const [termsList, setTermsList] = useState([]);
  const [modalSelectId, setmodalSelectId] = useState(null); // 팝업에 띄워진 ID
  const [selected, setSelected] = useState({});
  const [requiredSelected, setRequiredSelected] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const { registerData, updateRegisterData, resetRegisterData } = useRegister();

  // 팝업 오픈시 -> 데이터 넘겨주기
  const openModal = (item: any) => {
    setmodalSelectId(item.id);
    setModalOpen(true);
  };

  // 팝업 닫을 시에 데이터 초기화
  const closeModal = () => {
    setModalOpen(false);
    setmodalSelectId(null);
  };

  // 선택한 약관 배열
  const getAgreedTermIds = () => {
    return Object.entries(selected)
      .filter(([_, checked]) => checked)
      .map(([id]) => Number(id));
  };

  const fetchTerms = async () => {
    try {
      const res = await Api.getTemrList();
      const list = res.data.response.terms;

      setTermsList(list);

      // 체크 상태 초기화
      const init = {};
      list.forEach((item: any) => (init[item.id] = false));
      setSelected(init);
      setRequiredSelected(true);
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

  // 렌더링시 약관 불러오기
  useEffect(() => {
    fetchTerms();
  }, []);

  useEffect(() => {
    if (!registerData.loginId) {
      alert("회원정보 입력 후 이용해주세요.");
      router.replace("/register");
    }
  }, []);

  useEffect(() => {
    const requiredTerms = termsList.filter((item: any) => item.required);

    const allRequiredChecked =
      requiredTerms.length === 0 ||
      requiredTerms.every((item: any) => selected[item.id]);

    setRequiredSelected(allRequiredChecked);
  }, [selected, termsList]);

  const selectedItem = termsList.find((item) => item.id === modalSelectId); // 렌더링 시에 item 데이터 가져오기

  const handleRegister = async () => {
    try {
      console.log("회원가입 폼 : ", registerData);
      const agreedTermsIds = getAgreedTermIds();

      updateRegisterData({
        agreedTermsIds,
      });

      await Api.register({
        ...registerData,
        agreedTermsIds,
      });

      resetRegisterData();
      router.push("/");
      alert("회원가입이 완료되었습니다!");
    } catch (err) {
      console.error(err);
      alert("회원가입 실패");
    }
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
        {termsList.map((item: any) => (
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

        <SubmitButton
          text="회원가입"
          disabled={!requiredSelected}
          onClick={handleRegister}
        />
      </ul>
      {/* 약관 상세 모달 */}
      {selectedItem && ( // 데이터가 있을 때만 Modal 렌더링
        <Modal
          show={modalOpen}
          modalData={selectedItem} // 찾은 원본 데이터 전달
          onClose={closeModal}
        />
      )}
    </div>
  );
}
