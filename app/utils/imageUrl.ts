const DEFAULT_IMAGE_BASE = "http://localhost:80";
const PROFILE_FALLBACK_IMAGE = "/assets/profile.png";

const isDirectImageUrl = (value: string) =>
  /^(https?:\/\/|blob:|data:)/i.test(value);

const getImageBaseUrl = () =>
  (process.env.NEXT_PUBLIC_IMAGE_URL || DEFAULT_IMAGE_BASE).replace(/\/+$/, "");

export const toPublicImageUrl = (rawPath?: string, fallback = "") => {
  if (!rawPath) return fallback;

  const trimmed = rawPath.trim();
  if (!trimmed) return fallback;
  if (isDirectImageUrl(trimmed)) return trimmed;

  const base = getImageBaseUrl();
  const normalized = trimmed.replace(/\\/g, "/");

  if (normalized.startsWith("/uploads/")) return `${base}${normalized}`;
  if (normalized.startsWith("uploads/")) return `${base}/${normalized}`;

  const uploadsIndex = normalized.indexOf("/uploads/");
  if (uploadsIndex >= 0) return `${base}${normalized.slice(uploadsIndex)}`;

  const fileName = normalized.split("/").pop();
  if (!fileName) return fallback;

  return `${base}/uploads/image/${fileName}`;
};

export const toProfileImageUrl = (rawPath?: string) =>
  toPublicImageUrl(rawPath, PROFILE_FALLBACK_IMAGE);
