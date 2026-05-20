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

/** 가나다순 (선택 항목 앞 이동 없음) */
export function sortPlayersForFilter(players: FaPlayer[]): FaPlayer[] {
  return [...players].sort((a, b) =>
    a.player_name.localeCompare(b.player_name, "ko"),
  );
}

const STATUS_ORDER = ["FA", "잔류", "이적", "계약미체결", "미정"] as const;

export function buildStatusFilterOptions(): PillOption[] {
  return [
    { id: "all", label: "전체" },
    ...STATUS_ORDER.map((s) => ({ id: s, label: s })),
  ];
}
