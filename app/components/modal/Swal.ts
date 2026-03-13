import "@/app/styles/swal.css";
import Swal, { type SweetAlertOptions } from "sweetalert2";

type SwalType = "success" | "error" | "info" | "warning";

export default function showSwal(
  type: SwalType,
  message: string,
  title?: string,
  confirmButtonText = "확인",
) {
  return Swal.fire({
    icon: type,
    title,
    html: message,
    confirmButtonText,
    customClass: {
      popup: "swal-bootstrap",
      title: "swal-title",
      htmlContainer: "swal-text",
      confirmButton: "swal-confirm-btn",
    },
    buttonsStyling: false,
  });
}

export function confirmSwal(options: SweetAlertOptions) {
  return Swal.fire({
    ...options,
    customClass: {
      popup: "swal-bootstrap",
      title: "swal-title",
      htmlContainer: "swal-text",
      confirmButton: "swal-confirm-btn",
      cancelButton: "swal-cancel-btn",
      ...(options.customClass ?? {}),
    },
    buttonsStyling: false,
  });
}
