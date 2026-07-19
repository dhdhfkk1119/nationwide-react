export const truncateNickname = (value: string, maxLength = 5) =>
  value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
