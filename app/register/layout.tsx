import { RegisterProvider } from "@/app/providers/RegisterProvider";

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RegisterProvider>{children}</RegisterProvider>;
}
