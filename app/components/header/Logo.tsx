import "@/app/styles/logo.css";
import Image from "next/image";
import Link from "next/link";
import logoImage from "@/public/assets/logo.png";

export default function Logo() {
  return (
    // Link 컴포넌트로 Image 컴포넌트를 감싸줍니다.
    <Link className="logo" href="/">
      <div className="d-flex align-items-center justify-content-between">
        {/* width와 height를 명시해야 합니다. */}
        <Image src={logoImage} alt="사이트 로고" />
        <span>NationWide</span>
      </div>
    </Link>
  );
}
