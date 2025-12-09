// app/page.tsx

import Main from "@/app/components/Main"; // 1단계에서 옮긴 Main 컴포넌트 경로

// 이 함수가 루트 경로 ('/')에 접속했을 때 보여줄 페이지 내용을 정의합니다.
export default function HomePage() {
  // Main 컴포넌트를 렌더링합니다.
  return <Main />;
}
