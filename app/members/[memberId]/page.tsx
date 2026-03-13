import MemberProfileClient from "@/app/components/members/MemberProfileClient";
import { notFound } from "next/navigation";

type MemberProfilePageProps = {
  params: Promise<{
    memberId: string;
  }>;
};

export default async function MemberProfilePage({
  params,
}: MemberProfilePageProps) {
  const { memberId } = await params;
  const parsedMemberId = Number.parseInt(memberId, 10);

  if (!Number.isFinite(parsedMemberId) || parsedMemberId <= 0) {
    notFound();
  }

  return <MemberProfileClient memberId={parsedMemberId} />;
}
