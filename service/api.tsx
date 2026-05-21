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
  searchMembers: (query: string) =>
    http.get("member/search", {
      params: { query },
    }),
  me: () => http.get("member/me"),
  updatePrivacySettings: (data: { isPrivateProfile: boolean; isLocationVisible: boolean }) =>
    http.put("member/privacy-settings", data),
  deactivateMember: (durationMonths: number) =>
    http.put("member/deactivate", { durationMonths }),
  cancelDeactivation: () => http.put("member/deactivate/cancel"),
  reportBoard: (boardId: number, reporterComment: string) =>
    http.post(`reports/boards/${boardId}`, { reporterComment }),
  reportComment: (commentId: number, reporterComment: string) =>
    http.post(`reports/comments/${commentId}`, { reporterComment }),
  getMyReports: (targetType?: "BOARD" | "COMMENT") =>
    http.get("reports/me", {
      params: targetType ? { targetType } : {},
    }),
  getBoardList: (page: number, size: number) =>
    http.get("boards/list", {
      params: { page, size },
    }),
  getBoardDetail: (boardId: number) => http.get(`boards/detail/${boardId}`),
  toggleBoardLike: (boardId: number) => http.post(`board-likes/${boardId}/toggle`),
  toggleBoardCommentLike: (commentId: number) =>
    http.post(`board-comment-likes/${commentId}/toggle`),
  createBoardComment: (boardId: number, content: string) =>
    http.post(`board-comments/${boardId}`, { content }),
  updateBoardComment: (commentId: number, content: string) =>
    http.put(`board-comments/${commentId}`, { content }),
  deleteBoardComment: (commentId: number) =>
    http.delete(`board-comments/${commentId}`),
  createBoard: (formData: FormData) =>
    http.post("boards", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
  updateBoard: (boardId: number, formData: FormData) =>
    http.put(`boards/${boardId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
  deleteBoard: (boardId: number) => http.delete(`boards/${boardId}`),
  getMyPageSummary: () => http.get("my-page/summary"),
  getMyPageBoards: (page: number, size: number) =>
    http.get("my-page/boards", {
      params: { page, size },
    }),
  getMemberProfileSummary: (memberId: number) =>
    http.get(`my-page/members/${memberId}/summary`),
  getMemberBoards: (memberId: number, page: number, size: number) =>
    http.get(`my-page/members/${memberId}/boards`, {
      params: { page, size },
    }),
  toggleFollow: (targetMemberId: number) =>
    http.post(`follows/${targetMemberId}/toggle`),
  getFollowStatus: (targetMemberId: number) =>
    http.get(`follows/status/${targetMemberId}`),
  getFollowers: (memberId: number, page: number, size: number) =>
    http.get(`follows/members/${memberId}/followers`, {
      params: { page, size },
    }),
  getFollowing: (memberId: number, page: number, size: number) =>
    http.get(`follows/members/${memberId}/following`, {
      params: { page, size },
    }),
  getIncomingFollowRequests: (page: number, size: number) =>
    http.get("follows/requests/incoming", {
      params: { page, size },
    }),
  respondToFollowRequest: (
    requesterMemberId: number,
    action: "VISIBLE_ONLY" | "FOLLOWING" | "REJECTED",
  ) => http.post(`follows/${requesterMemberId}/respond`, { action }),
  getMyPageComments: (page: number, size: number) =>
    http.get("my-page/comments", {
      params: { page, size },
    }),
  getMyFavoriteBoards: (page: number, size: number) =>
    http.get("my-page/favorite-boards", {
      params: { page, size },
    }),
  updateMember: (memberIdx: number, formData: FormData) =>
    http.put(`member/update/${memberIdx}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  getTemrList: () => http.get("terms/list"),
  getTermsDetail: (id: number | string) => http.get(`terms/detail/${id}`),
  getAlarms: (page: number, size: number) =>
    http.get("alarms", {
      params: { page, size },
    }),
  getAlarmUnreadCount: () => http.get("alarms/unread-count"),
  readAlarm: (alarmId: number) => http.put(`alarms/${alarmId}/read`),
};

export default Api;
