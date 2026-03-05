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
      confirmButton: "btn btn-primary w-100",
      cancelButton: "btn btn-outline-secondary w-100",
    },

    buttonsStyling: false,
  });
}
