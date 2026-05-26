import { NextRequest, NextResponse } from "next/server";

import {
  parseAdminFaPlayerUpdateBody,
  verifyAdminPassword,
} from "@/lib/adminFaPlayers";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

function parsePlayerId(raw: string): number | null {
  const id = Number.parseInt(raw, 10);
  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }
  return id;
}

// 임시 관리자 보호: body.adminPassword ↔ ADMIN_PASSWORD. 추후 정식 인증으로 교체 가능.
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "Admin is not configured" },
      { status: 503 },
    );
  }

  const { id: idParam } = await context.params;
  const playerId = parsePlayerId(idParam);
  if (playerId === null) {
    return NextResponse.json({ error: "Invalid player id" }, { status: 400 });
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

  const parsed = parseAdminFaPlayerUpdateBody(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("fa_players")
      .update({
        contract_status: parsed.data.contract_status,
        new_team_id: parsed.data.new_team_id,
        contract_years: parsed.data.contract_years,
        contract_amount: parsed.data.contract_amount,
        contract_date: parsed.data.contract_date,
        contract_note: parsed.data.contract_note,
        status_updated_at: new Date().toISOString(),
      })
      .eq("id", playerId)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("[admin/fa-players] update failed:", error.message);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, id: data.id });
  } catch (err) {
    console.error("[admin/fa-players] server error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
