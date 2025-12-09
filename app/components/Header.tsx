import Logo from "@/app/components/header/Logo";
import UserInfo from "@/app/components/header/UserInfo";
import "@/app/styles/header.css";

export default function Header() {
  return (
    <header className="header">
      <Logo />

      <UserInfo />
    </header>
  );
}
