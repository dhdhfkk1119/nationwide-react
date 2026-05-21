import { confirmSwal } from "@/app/components/modal/Swal";
import Swal from "sweetalert2";

type OpenReportPromptProps = {
  title: string;
  targetLabel: string;
  content: string;
  imageUrls?: string[];
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");

export default async function openReportPrompt({
  title,
  targetLabel,
  content,
  imageUrls = [],
}: OpenReportPromptProps) {
  const previewImages = imageUrls
    .slice(0, 3)
    .map(
      (url) => `
        <img
          src="${escapeHtml(url)}"
          alt="${escapeHtml(targetLabel)}"
          class="swal-report-image"
        />
      `,
    )
    .join("");

  const result = await confirmSwal({
    title,
    html: `
      <div class="swal-report-preview">
        <p class="swal-report-label">${escapeHtml(targetLabel)}</p>
        <div class="swal-report-content">${escapeHtml(content || "내용 없음")}</div>
        ${previewImages ? `<div class="swal-report-images">${previewImages}</div>` : ""}
        <label for="report-comment" class="swal-report-textarea-label">신고 내용을 입력해 주세요</label>
        <textarea id="report-comment" class="swal-report-textarea" placeholder="신고 사유를 자세히 적어 주세요"></textarea>
      </div>
    `,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "신고 접수",
    cancelButtonText: "취소",
    focusConfirm: false,
    preConfirm: () => {
      const textarea = document.getElementById("report-comment") as HTMLTextAreaElement | null;
      const reporterComment = textarea?.value?.trim() ?? "";

      if (!reporterComment) {
        Swal.showValidationMessage("신고 내용을 입력해 주세요.");
        return false;
      }

      return reporterComment;
    },
  });

  if (!result.isConfirmed || typeof result.value !== "string") {
    return null;
  }

  return result.value;
}
