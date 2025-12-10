import axios from "axios";

const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, // 환경변수로 변경
  headers: {
    "Content-Type": "application/json",
  },
});

export default http;
