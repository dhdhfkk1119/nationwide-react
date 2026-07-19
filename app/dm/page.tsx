import { Suspense } from "react";
import DmClient from "@/app/components/dm/DmClient";

export default function DmPage() {
  return (
    <Suspense fallback={null}>
      <DmClient />
    </Suspense>
  );
}
