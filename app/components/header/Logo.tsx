import "@/app/styles/logo.css";
import Image from "next/image";
import logoImage from "@/public/assets/logo.png";

export default function Logo() {
  return (
    <a className="logo" href="/">
      <div className="d-flex align-items-center">
        <Image src={logoImage} alt="사이트 로고" />
        <span>NationWide</span>
      </div>
    </a>
  );
}
