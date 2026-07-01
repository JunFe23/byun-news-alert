import type { Metadata } from "next";

import ServiceEnded from "@/components/ServiceEnded";

export const metadata: Metadata = {
  title: "서비스 종료",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <ServiceEnded />;
}
