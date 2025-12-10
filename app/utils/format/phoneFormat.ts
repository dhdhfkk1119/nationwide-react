// 01012345678 -> 010-1234-5678 변환
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
  }

  return phone;
};

// 전화번호 기본 형식 검사
export const isValidPhone = (phone: string): boolean => {
  const regex = /^01[016789]-?\d{3,4}-?\d{4}$/;
  return regex.test(phone);
};
// 전화번호가 형식에 맞는지 검사 (하이픈 포함 여부 무관)
