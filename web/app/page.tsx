import { Suspense } from "react";
import ClientHome from "@/app/ClientHome";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="page-shell">
          <div className="mx-auto max-w-[640px] px-4 py-10 text-sm text-brand-muted">
            불러오는 중…
          </div>
        </div>
      }
    >
      <ClientHome />
    </Suspense>
  );
}
