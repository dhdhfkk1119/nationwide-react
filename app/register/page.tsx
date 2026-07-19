"use client";

import { useEffect, useState } from "react";
import memberApi from "@/service/api"; // 경로를 services/member로 수정했다고 가정
import { useRegister } from "@/app/providers/RegisterProvider";
import { SaveDTO } from "@/service/generated";
import "@/app/styles/registerpage.css";
import SubmitButton from "../components/ui/SubmitButton";
import { formatPhoneNumber, isValidEmail } from "../utils/format/UtilFormat";
import { useRouter } from "next/navigation";
import BaseCard from "../components/util_card/BaseCard";
import showSwal from "../components/modal/Swal";
import { Messages } from "../constants/Messages";

type DaumPostcodeData = {
  zonecode: string;
  roadAddress: string;
};

declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: DaumPostcodeData) => void;
      }) => {
        open: () => void;
      };
    };
  }
}

export default function RegisterPage() {
  const [isEmailSent, setIsEmailSent] = useState(false); // 이메일 보내기
  const [isEmailValid, setIsEmailValid] = useState(false); // 이메일 중복확인
  const [isEmailCodeVerified, setIsEmailCodeVerified] = useState(false); // 이메일 인증코드 확인
  const [emailCheckMsg, setEmailCheckMsg] = useState(""); // 이메일 중복확인 메시지
  const { updateRegisterData } = useRegister();
  const router = useRouter();

  type RegisterForm = SaveDTO & {
    birthFull: string;
    code: string;
  };

  const [form, setForm] = useState<RegisterForm>({
    name: "",
    nickName: "",
    loginId: "",
    password: "",
    rePassword: "",
    phoneNumber: "",
    gender: undefined,
    addressNumber: "",
    address: "",
    addressDetail: "",
    birthFull: "",
    code: "",
  });

  const PasswordChecked = form.password === form.rePassword; // 비밀번호 일치 여부

  const isAllFilled =
    form.name &&
    form.nickName &&
    form.loginId &&
    form.password &&
    form.rePassword &&
    form.phoneNumber &&
    form.gender &&
    form.birthFull &&
    form.addressNumber &&
    form.address &&
    form.addressDetail &&
    form.code;

  const isFormReady =
    isEmailSent &&
    isEmailValid &&
    isEmailCodeVerified &&
    PasswordChecked &&
    isAllFilled;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    if (name === "phoneNumber") {
      setForm({
        ...form,
        phoneNumber: formatPhoneNumber(value),
      });
    } else {
      setForm({
        ...form,
        [name]: value,
      });
    }
  };

  const handleEmailCheck = async () => {
    if (!form.loginId) {
      setIsEmailValid(false);
      setEmailCheckMsg("이메일을 입력해주세요.");
      return;
    }

    if (!isValidEmail(form.loginId)) {
      setIsEmailValid(false);
      setEmailCheckMsg("올바른 이메일 형식이 아닙니다.");
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
    if (!form.loginId) return showSwal("warning", Messages.EMAIL_REQUIRED);

    try {
      if (isEmailSent) {
        await memberApi.reEmailSend(form.loginId);
        showSwal("success", Messages.RESEND_EMAIL_CODE);
      } else {
        await memberApi.emailSend(form.loginId);
        showSwal("success", Messages.SEND_EMAIL_CODE);
        setIsEmailSent(true);
      }
    } catch (err) {
      console.error(err);
      showSwal("error", Messages.ERROR_MESSAGE);
    }
  };

  const handleCodeVerify = async () => {
    if (!form.loginId) {
      showSwal("warning", Messages.EMAIL_REQUIRED);
      return;
    }

    if (!form.code) {
      showSwal("warning", Messages.EMAIL_REQUIRED);
      return;
    }

    try {
      await memberApi.veriftCode(form.loginId, form.code);
      setIsEmailCodeVerified(true);
      showSwal("success", Messages.EMAIL_CODE_CONFIRM);
    } catch (error) {
      setIsEmailCodeVerified(false);
      console.error(error);
      showSwal("warning", Messages.EMAIL_CODE_DENY);
    }
  };

  useEffect(() => {
    if (form.code.length === 6) {
      handleCodeVerify();
    }
  }, [form.code]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("회원가입 페이지 폼", SaveDTO);

    const saveData: SaveDTO = {
      ...form,
      birth: form.birthFull.slice(0, 4),
      date: form.birthFull.slice(4, 8),
    };

    delete (saveData as any).birthFull;
    delete (saveData as any).code;

    updateRegisterData(saveData);
    router.push("/register/terms");
  };

  return (
    <div className="d-flex justify-content-center mt-4">
      <BaseCard className="register-card">
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
            maxLength={18}
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
              disabled={!isEmailSent}
            />

            <button
              className="btn btn-outline-secondary"
              type="button"
              onClick={handleCodeVerify}
              disabled={isEmailCodeVerified}
            >
              {isEmailCodeVerified ? "인증완료" : "확인"}
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
            value={form.phoneNumber}
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
            maxLength={8}
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
          <SubmitButton text="다음" disabled={!isFormReady} type="submit" />
        </form>
      </BaseCard>
    </div>
  );
}
