"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Api from "@/service/termsApi";

export default function TermsDetailPage() {
  const params = useParams();
  const id = params.id;

  const [termsDetail, setTermsDetail] = useState(null);

  const fetchDetail = async () => {
    try {
      const res = await Api.getTermsDetail(id);
      setTermsDetail(res.data);
    } catch (err) {
      console.error("약관 상세 가져오기 실패:", err);
    }
  };

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  return (
    <div className="container mt-4">
      <h3>약관 상세</h3>
      {termsDetail ? (
        <div>
          <h4>{termsDetail.title}</h4>
          <p>{termsDetail.content}</p>
        </div>
      ) : (
        <p>로딩 중...</p>
      )}
    </div>
  );
}
