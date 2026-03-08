import { LoginDTO, SaveDTO } from "./generated";
import http from "./http";

const Api = {
  register: (data: SaveDTO) => http.post("member/save", data),
  checkEmail: (email: string) => http.get(`member/check-email/${email}`),
  emailSend: (data: string) => http.post("emails/send", { loginId: data }),
  reEmailSend: (data: string) => http.post("emails/resend", { loginId: data }),
  veriftCode: (loginId: string, code: string) =>
    http.post("emails/verify", { loginId, code }),
  login: (data: LoginDTO) => http.post("member/login", data),
  me: () => http.get("member/me"),
  getBoardList: (page: number, size: number) =>
    http.get("boards/list", {
      params: { page, size },
    }),
  getBoardDetail: (boardId: number) => http.get(`boards/detail/${boardId}`),
  toggleBoardLike: (boardId: number) => http.post(`board-likes/${boardId}/toggle`),
  createBoardComment: (boardId: number, content: string) =>
    http.post(`board-comments/${boardId}`, { content }),
  createBoard: (formData: FormData) =>
    http.post("boards", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  getTemrList: () => http.get("terms/list"),
  getTermsDetail: (id: number | string) => http.get(`terms/detail/${id}`),
};

export default Api;
