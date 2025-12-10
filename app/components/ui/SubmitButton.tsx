"use client";
import { useRouter } from "next/navigation";

interface SubmitButtonProps {
  text: string;
  disabled?: boolean;
  to?: string; // 이동할 라우트
}

export default function SubmitButton({
  text,
  disabled = false,
  to,
}: SubmitButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (disabled) return;

    if (to) {
      router.push(to);
    }
  };

  return (
    <button
      className={`btn w-100 ${disabled ? "btn-secondary" : "btn-primary"}`}
      disabled={disabled}
      style={{ cursor: disabled ? "not-allowed" : "pointer" }}
      onClick={handleClick}
    >
      {text}
    </button>
  );
}
