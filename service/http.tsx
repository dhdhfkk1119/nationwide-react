import axios from "axios";

// Axios 인스턴스 생성
const http = axios.create({
  baseURL: "http://localhost:8080/api/", // 스프링 서버 주소
  headers: {
    "Content-Type": "application/json",
  },
});

export default http;
