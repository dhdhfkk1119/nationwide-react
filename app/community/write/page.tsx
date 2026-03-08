import CommunitySidebar from "@/app/components/community/CommunitySidebar";
import PostWriteForm from "@/app/components/community/PostWriteForm";

export default function CommunityWritePage() {
  return (
    <section className="main-page">
      <CommunitySidebar isWritePage />
      <div className="feed-area">
        <PostWriteForm />
      </div>
    </section>
  );
}
