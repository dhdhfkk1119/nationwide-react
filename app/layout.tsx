import "@/app/styles/normalize.css";
import "@/app/styles/app.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import Main from "@/app/components/Main";

// (선택 사항) 메타데이터 설정
export const metadata = {
  title: "Next.js 메인 앱",
  description: "Next.js로 만든 앱의 기본 설명입니다.",
};

// Layout 컴포넌트는 반드시 'children' props를 받아서 렌더링해야 합니다.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <div className="App">
          {/* 1. Header는 모든 페이지 상단에 고정 */}
          <Header />

          {/* 2. children: 여기가 실제 페이지 내용 (Main 컴포넌트)이 들어갈 자리입니다. */}
          <main>{children}</main>

          {/* 3. Footer는 모든 페이지 하단에 고정 */}
          <Footer />
        </div>
      </body>
    </html>
  );
}
