import BoardDetail from "@/app/components/community/BoardDetail";

export default function CommunityBoardDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  return <BoardDetail boardId={Number(id)} />;
}
