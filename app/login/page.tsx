import React from "react";

export default function LoginPage() {
  return (
    <div className="LoginPage">
      <div className="login-page">
        <h2>로그인</h2>
        <form>
          <input type="text" placeholder="아이디" />
          <input type="password" placeholder="비밀번호" />
          <button type="submit">로그인</button>
        </form>
      </div>
    </div>
  );
}
