import LanguageSettingsClient from "@/app/components/settings/LanguageSettingsClient";
import PrivacySecuritySettingsClient from "@/app/components/settings/PrivacySecuritySettingsClient";
import SettingsDetailClient from "@/app/components/settings/SettingsDetailClient";
import { isSettingsMenuSlug } from "@/app/components/settings/settingsMenu";
import { notFound } from "next/navigation";

type SettingsDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function SettingsDetailPage({
  params,
}: SettingsDetailPageProps) {
  const { slug } = await params;

  if (!isSettingsMenuSlug(slug)) {
    notFound();
  }

  if (slug === "language") {
    return <LanguageSettingsClient />;
  }

  if (slug === "privacy-security") {
    return <PrivacySecuritySettingsClient />;
  }

  return <SettingsDetailClient slug={slug} />;
}
