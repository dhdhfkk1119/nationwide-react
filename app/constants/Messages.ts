export const Messages = {
  // 로그인시
  LOGIN_REQUIRED: "아이디와 비밀번호 입력을 확인해 보세요.",
  LOGIN_ID_REQUIRED: "아이디를 입력해주세요.",
  PASSWORD_REQUIRED: "비밀번호를 입력해주세요.",
  LOGIN_FAIL: "로그인에 실패했습니다",
  SOCIAL_LOGIN_PREPARING: "해당 소셜 로그인은 준비 중입니다.",

  // 회원 가입시
  SEND_EMAIL_CODE: "인증 코드가 전송 되었습니다.",
  RESEND_EMAIL_CODE: "인증 코드가 재전송 되었습니다.",
  EMAIL_REQUIRED: "이메일을 입력해주세요",
  EMAIL_CODE_CONFIRM: "인증 되었습니다",
  EMAIL_CODE_DENY: "인증 코드가 올바르지 않습니다.",

  // 에러 메세지
  ERROR_MESSAGE: "전송중에 오류가 발생했습니다",
} as const;
