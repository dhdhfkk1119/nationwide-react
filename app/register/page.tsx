"use client";

import { useEffect, useState } from "react";
import memberApi from "@/service/api"; // 경로를 services/member로 수정했다고 가정
import "@/app/styles/registerpage.css";

export default function RegisterPage() {
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [emailCheckMsg, setEmailCheckMsg] = useState("");

  const [form, setForm] = useState({
    name: "",
    nickName: "",
    loginId: "",
    password: "",
    rePassword: "",
    phoneNumber: "",
    gender: "",
    birthFull: "",
    addressNumber: "",
    address: "",
    addressDetail: "",
    code: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEmailCheck = async () => {
    if (!form.loginId) {
      setIsEmailValid(false);
      setEmailCheckMsg("이메일을 입력해주세요.");
      return;
    }

    try {
      const res = await memberApi.checkEmail(form.loginId);

      if (res.data === true) {
        setIsEmailValid(false);
        setEmailCheckMsg("이미 사용 중인 이메일입니다.");
      } else {
        setIsEmailValid(true);
        setEmailCheckMsg("사용 가능한 이메일입니다!");
      }
    } catch (error) {
      console.error(error);
      setIsEmailValid(false);
      setEmailCheckMsg("오류가 발생했습니다.");
    }
  };

  const handlePostCode = () => {
    new window.daum.Postcode({
      oncomplete: function (data) {
        // 선택된 주소 데이터를 input에 자동 입력
        setForm((prev) => ({
          ...prev,
          addressNumber: data.zonecode,
          address: data.roadAddress,
        }));
      },
    }).open();
  };

  const handleSendEmail = async () => {
    if (!form.loginId) return alert("이메일을 입력해주세요!");

    try {
      if (isEmailSent) {
        await memberApi.reEmailSend(form.loginId);
        alert("인증 코드가 재전송되었습니다!");
      } else {
        await memberApi.emailSend(form.loginId);
        alert("인증 코드가 전송되었습니다!");
        setIsEmailSent(true);
      }
    } catch (err) {
      console.error(err);
      alert("전송에 실패했습니다.");
    }
  };

  const handleCodeVerift = async () => {
    if (!form.code) {
      alert("이메일을 먼저 입력해주세요.");
      return;
    }

    try {
      const res = await memberApi.veriftCode(form.loginId, form.code);
      alert("인증이 완료되었습니다");
    } catch (error) {
      console.error(error);
      alert("인증 실패" + form.code);
    }
  };

  useEffect(() => {
    if (form.code.length === 6) {
      handleCodeVerift();
    }
  }, [form.code]);

  const onSubmit = (e) => {
    e.preventDefault();

    // 생년월일을 birthFull → birth + date로 분리
    if (form.birthFull.length === 8) {
      const birth = form.birthFull.substring(0, 4);
      const date = form.birthFull.substring(4, 8);

      console.log("birth:", birth);
      console.log("date:", date);
    }

    console.log("form:", form);
  };

  return (
    <div className="RegisterPage d-flex justify-content-center mt-4">
      <div
        className="register-page p-4 shadow rounded"
        style={{ width: "420px", background: "#fff" }}
      >
        <h3 className="text-center mb-4">회원가입</h3>

        <form onSubmit={onSubmit}>
          {/* 이름 */}
          <input
            className="form-control mb-2"
            type="text"
            name="name"
            placeholder="이름"
            onChange={handleChange}
          />

          {/* 닉네임 */}
          <input
            className="form-control mb-2"
            type="text"
            name="nickName"
            placeholder="닉네임"
            onChange={handleChange}
          />

          {/* 이메일(=아이디) + 중복확인 + 이메일전송 */}
          <div className="input-group mb-2">
            <input
              className="form-control"
              type="text"
              name="loginId"
              placeholder="이메일"
              value={form.loginId}
              onChange={handleChange}
            />
            <button
              className="btn btn-outline-primary"
              type="button"
              onClick={handleEmailCheck}
            >
              중복확인
            </button>
            <button
              className="btn btn-outline-success"
              type="button"
              onClick={handleSendEmail}
            >
              {isEmailSent ? "재전송" : "전송"}
            </button>
          </div>
          {/* 중복 확인 */}
          <div
            className={`mb-2 email-check-msg ${
              isEmailValid ? "text-success" : "text-danger"
            } small`}
          >
            <span>{emailCheckMsg}</span>
          </div>
          {/* 인증코드 + 확인 */}
          <div className="input-group mb-2">
            <input
              className="form-control"
              type="text"
              name="code"
              placeholder="인증 코드 입력"
              value={form.code}
              onChange={handleChange}
            />

            <button
              className="btn btn-outline-secondary"
              type="button"
              onClick={handleCodeVerift}
            >
              확인
            </button>
          </div>

          {/* 비밀번호 */}
          <input
            className="form-control mb-2"
            type="password"
            name="password"
            placeholder="비밀번호"
            onChange={handleChange}
          />
          <input
            className="form-control mb-2"
            type="password"
            name="rePassword"
            placeholder="비밀번호 확인"
            onChange={handleChange}
          />

          {/* 전화번호 */}
          <input
            className="form-control mb-2"
            type="text"
            name="phoneNumber"
            placeholder="전화번호"
            onChange={handleChange}
          />

          {/* 성별 */}
          <select
            className="form-select mb-2"
            name="gender"
            onChange={handleChange}
          >
            <option value="">성별 선택</option>
            <option value="MALE">남성</option>
            <option value="FEMALE">여성</option>
          </select>

          {/* 생년월일 (8자리) */}
          <input
            className="form-control mb-2"
            type="text"
            name="birthFull"
            placeholder="생년월일 (예: 19990408)"
            maxLength="8"
            onChange={handleChange}
          />

          {/* 우편번호 + 검색버튼 */}
          <div className="input-group mb-2">
            <input
              className="form-control"
              type="text"
              name="addressNumber"
              placeholder="우편번호"
              value={form.addressNumber || ""}
              readOnly
            />
            <button
              className="btn btn-outline-primary"
              type="button"
              onClick={handlePostCode}
            >
              우편번호 찾기
            </button>
          </div>

          {/* 주소 */}
          <div className="input-group mb-2">
            <input
              className="form-control"
              type="text"
              name="address"
              placeholder="주소"
              value={form.address || ""}
              readOnly
            />
          </div>

          {/* 상세주소 */}
          <div className="input-group mb-2">
            <input
              className="form-control"
              type="text"
              name="addressDetail"
              placeholder="상세주소"
              onChange={handleChange}
            />
          </div>

          {/* 제출 */}
          <button className="btn btn-primary w-100" type="submit">
            회원가입
          </button>
        </form>
      </div>
    </div>
  );
}
