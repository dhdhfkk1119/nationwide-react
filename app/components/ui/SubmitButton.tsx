"use client";
import { useRouter } from "next/navigation";

interface SubmitButtonProps {
  text: string;
  disabled?: boolean;
  to?: string;
  onClick?: () => void;
  type?: "button" | "submit";
}

export default function SubmitButton({
  text,
  disabled = false,
  to,
  onClick,
  type = "button",
}: SubmitButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (disabled) return;

    if (onClick) {
      onClick();
      return;
    }

    if (to) {
      router.push(to);
    }
  };

  return (
    <button
      type={type} // ⭐ 핵심
      className={`btn w-100 ${disabled ? "btn-secondary" : "btn-primary"}`}
      disabled={disabled}
      style={{ cursor: disabled ? "not-allowed" : "pointer" }}
      onClick={handleClick}
    >
      {text}
    </button>
  );
}
