import BlockedUsersSettingsClient from "@/app/components/settings/BlockedUsersSettingsClient";
import DeactivateAccountSettingsClient from "@/app/components/settings/DeactivateAccountSettingsClient";
import LanguageSettingsClient from "@/app/components/settings/LanguageSettingsClient";
import LocationDistanceSettingsClient from "@/app/components/settings/LocationDistanceSettingsClient";
import PrivacySecuritySettingsClient from "@/app/components/settings/PrivacySecuritySettingsClient";
import ReportStatusSettingsClient from "@/app/components/settings/ReportStatusSettingsClient";
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

  if (slug === "delete-account") {
    return <DeactivateAccountSettingsClient />;
  }

  if (slug === "report-status") {
    return <ReportStatusSettingsClient />;
  }

  if (slug === "blocked-users") {
    return <BlockedUsersSettingsClient />;
  }

  if (slug === "location-distance") {
    return <LocationDistanceSettingsClient />;
  }

  return <SettingsDetailClient slug={slug} />;
}
