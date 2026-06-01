import type { FaPlayer, FaTeam } from "@/lib/types";

export type PillOption = { id: string; label: string };

/** 미체결·계약 미체결 팀 — 필터 목록 맨 뒤, 로고 플레이스홀더 */
export function isDeferredTeam(team: FaTeam): boolean {
  const label = `${team.short_name} ${team.team_name}`;
  return label.includes("미체결") || label.includes("계약 미체결");
}

/** 가나다순 + 미체결 맨 뒤 (선택 항목 앞 이동 없음) */
export function sortTeamsForFilter(teams: FaTeam[]): FaTeam[] {
  const regular = teams.filter((t) => !isDeferredTeam(t));
  const deferred = teams.filter(isDeferredTeam);

  const byShortName = (a: FaTeam, b: FaTeam) =>
    a.short_name.localeCompare(b.short_name, "ko");

  regular.sort(byShortName);
  deferred.sort(byShortName);

  return [...regular, ...deferred];
}

/** 가나다순 (뉴스 피드 선수 필터 pill 등) */
export function sortPlayersForFilter(players: FaPlayer[]): FaPlayer[] {
  return [...players].sort((a, b) =>
    a.player_name.localeCompare(b.player_name, "ko"),
  );
}

function statusUpdatedAtMs(player: FaPlayer): number {
  const raw = player.status_updated_at?.trim();
  if (!raw) {
    return Number.NEGATIVE_INFINITY;
  }
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? ms : Number.NEGATIVE_INFINITY;
}

/** contract_date DESC NULLS LAST → status_updated_at DESC NULLS LAST → player_name ASC */
export function comparePlayersByContractDate(
  a: FaPlayer,
  b: FaPlayer,
): number {
  const dateA = a.contract_date?.trim() || null;
  const dateB = b.contract_date?.trim() || null;

  if (dateA && !dateB) {
    return -1;
  }
  if (!dateA && dateB) {
    return 1;
  }
  if (dateA && dateB && dateA !== dateB) {
    return dateB.localeCompare(dateA);
  }

  const statusCmp = statusUpdatedAtMs(b) - statusUpdatedAtMs(a);
  if (statusCmp !== 0) {
    return statusCmp;
  }

  return a.player_name.localeCompare(b.player_name, "ko");
}

/** FA 현황판·admin 선수 목록 정렬 */
export function sortPlayersByContractDate(players: FaPlayer[]): FaPlayer[] {
  return [...players].sort(comparePlayersByContractDate);
}

const STATUS_ORDER = ["FA", "잔류", "이적", "계약미체결", "은퇴"] as const;

export function buildStatusFilterOptions(): PillOption[] {
  return [
    { id: "all", label: "전체" },
    ...STATUS_ORDER.map((s) => ({ id: s, label: s })),
  ];
}
