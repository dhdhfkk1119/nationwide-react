// 01012345678 -> 010-1234-5678 변환
export const formatPhoneNumber = (phone: string): string => {
  const onlyNums = phone.replace(/[^0-9]/g, "").slice(0, 11);

  if (onlyNums.length < 4) {
    return onlyNums;
  }

  if (onlyNums.length < 7) {
    return `${onlyNums.slice(0, 3)}-${onlyNums.slice(3)}`;
  }

  return `${onlyNums.slice(0, 3)}-${onlyNums.slice(3, 7)}-${onlyNums.slice(7)}`;
};

// 이메일이 형식에 맞는지 검사
export const isValidEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};
