import BoardDetail from "@/app/components/community/BoardDetail";
import { notFound } from "next/navigation";

export default function CommunityBoardDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const boardId = Number.parseInt(id, 10);

  if (!Number.isFinite(boardId) || boardId <= 0) {
    notFound();
  }

  return <BoardDetail boardId={boardId} />;
}
