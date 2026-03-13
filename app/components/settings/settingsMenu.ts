export const settingsMenuItems = [
  { slug: "blocked-users" },
  { slug: "location-distance" },
  { slug: "language" },
  { slug: "notifications-theme" },
  { slug: "delete-account" },
] as const;

export type SettingsMenuSlug = (typeof settingsMenuItems)[number]["slug"];

export function isSettingsMenuSlug(value: string): value is SettingsMenuSlug {
  return settingsMenuItems.some((item) => item.slug === value);
}
