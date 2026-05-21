import { NextRequest, NextResponse } from "next/server";

import { verifyAdminPassword } from "@/lib/adminFaPlayers";

// 임시 관리자 비밀번호 확인. 추후 정식 인증으로 교체 가능.
export async function POST(request: NextRequest) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "Admin is not configured" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!verifyAdminPassword(body)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
