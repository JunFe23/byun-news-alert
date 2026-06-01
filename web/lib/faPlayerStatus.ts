import type { FaPlayer, FaTeam } from "@/lib/types";

export const CONTRACT_STATUS_BUCKETS = [
  "FA",
  "잔류",
  "이적",
  "계약미체결",
  "은퇴",
] as const;

export type ContractStatusBucket = (typeof CONTRACT_STATUS_BUCKETS)[number];

export type StatusCounts = {
  total: number;
  FA: number;
  잔류: number;
  이적: number;
  계약미체결: number;
  은퇴: number;
};

export function normalizeContractStatus(
  contractStatus: unknown,
  team?: FaTeam | null,
): ContractStatusBucket {
  if (team?.short_name?.trim() === "미체결") {
    return "계약미체결";
  }

  if (typeof contractStatus !== "string") {
    return "FA";
  }

  const trimmed = contractStatus.trim();
  if (trimmed === "") {
    return "FA";
  }

  if (trimmed === "미정") {
    return "은퇴";
  }

  if (
    trimmed === "FA" ||
    trimmed === "잔류" ||
    trimmed === "이적" ||
    trimmed === "계약미체결" ||
    trimmed === "은퇴"
  ) {
    return trimmed;
  }

  return "FA";
}

export function getStatusCounts(
  players: FaPlayer[],
  teams: FaTeam[],
): StatusCounts {
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const counts: StatusCounts = {
    total: players.length,
    FA: 0,
    잔류: 0,
    이적: 0,
    계약미체결: 0,
    은퇴: 0,
  };

  for (const player of players) {
    const team = teamById.get(player.team_id);
    const bucket = normalizeContractStatus(player.contract_status, team);
    counts[bucket]++;
  }

  return counts;
}

export function buildStatusSummaryLine(counts: StatusCounts): string {
  return `전체 ${counts.total}명 중 잔류 ${counts.잔류}명 · 이적 ${counts.이적}명 · 미체결 ${counts.계약미체결}명`;
}
