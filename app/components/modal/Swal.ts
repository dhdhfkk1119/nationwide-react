import Swal from "sweetalert2";
import "@/app/styles/swal.css";

type SwalType = "success" | "error" | "info" | "warning";

export default function showSwal(
  type: SwalType,
  message: string,
  title?: string
) {
  return Swal.fire({
    icon: type,
    title,
    text: message,
    confirmButtonText: "확인",
    customClass: {
      popup: "swal-bootstrap",
      title: "swal-title",
      htmlContainer: "swal-text",
      confirmButton: "swal-confirm-btn",
    },
    buttonsStyling: false,
  });
}
