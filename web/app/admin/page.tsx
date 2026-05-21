import type { Metadata } from "next";

import AdminClient from "@/app/admin/AdminClient";

export const metadata: Metadata = {
  title: "FA 계약 현황 관리",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminClient />;
}
