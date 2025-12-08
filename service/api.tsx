import http from "./http";

const Api = {
  register: (data: any) => http.post("member/save", data),
  checkEmail: (email: any) => http.get(`member/check-email/${email}`),
  emailSend: (data: any) => http.post("emails/send", { loginId: data }),
  reEmailSend: (data: any) => http.post("emails/resend", { loginId: data }),
  veriftCode: (loginId: any, code: any) =>
    http.post("emails/verify", { loginId, code }),

  // 추가되면 계속 여기에 적어주면 됨
};

export default Api;
