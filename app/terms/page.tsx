"use client";
import { useEffect, useState } from "react";
import Api from "@/service/api";
import SelectItem from "../components/ui/SelectItem";
import SubmitButton from "../components/ui/SubmitButton";

export default function TermsPage() {
  const [termsList, setTermsList] = useState([]);
  const [selected, setSelected] = useState({}); // { 1: true, 2: false }

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
          <li key={item.id}>
            <SelectItem
              label={`[${item.required ? "필수" : "선택"}] ${item.title}`}
              checked={selected[item.id]}
              onChange={() => toggleItem(item.id)}
            />
          </li>
        ))}
        <SubmitButton text="회원가입" />
      </ul>
    </div>
  );
}
