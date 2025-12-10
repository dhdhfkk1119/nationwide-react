import Link from "next/link";

export default function UserInfo() {
  return (
    <div className="userInfo">
      <div className="user">
        <Link href="/login">로그인</Link>
        <Link href="/register">회원가입</Link>
      </div>

      {/* 로그인된 경우 */}
      {/* 
      <div className="user">
        <Link to="/mypage">
          <img
            src={profile}
            alt=""
            width={30}
            style={{ paddingRight: "5px" }}
          />
          <span>조정우 님</span>
        </Link>
      </div> 
      */}

      <div className="alrams">
        <Link href="/notifications">
          <i className="bi bi-bell"></i>
        </Link>
      </div>
    </div>
  );
}
