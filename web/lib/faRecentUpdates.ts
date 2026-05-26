import { isDeferredTeam } from "@/lib/filterSort";
import { formatContractAmount } from "@/lib/formatContractAmount";
import { formatContractDateShort } from "@/lib/formatContractDate";
import { formatContractYears } from "@/lib/formatContractYears";
import {
  normalizeContractStatus,
  type ContractStatusBucket,
} from "@/lib/faPlayerStatus";
import type { FaPlayer, FaTeam } from "@/lib/types";

const RECENT_LIMIT = 5;

export type RecentUpdateEntry = {
  playerId: number;
  playerName: string;
  /** 2줄째: 팀·이적·상태·계약조건 */
  subtitle: string;
  /** 한 줄 요약 (접근성·호환) */
  line: string;
  updatedAt: string;
};

/** 계약기간·금액 요약 (둘 다 없으면 조건 미공개) */
export function formatContractTermsSummary(player: FaPlayer): string {
  const hasYears =
    player.contract_years != null &&
    Number.isFinite(player.contract_years) &&
    player.contract_years > 0;
  const hasAmount =
    player.contract_amount != null &&
    Number.isFinite(player.contract_amount) &&
    player.contract_amount > 0;

  if (!hasYears && !hasAmount) {
    return "조건 미공개";
  }

  const parts: string[] = [];
  if (hasYears) {
    const yearsLabel = formatContractYears(player.contract_years);
    if (yearsLabel !== "-") {
      parts.push(yearsLabel);
    }
  }
  if (hasAmount) {
    const amountLabel = formatContractAmount(player.contract_amount);
    if (amountLabel !== "-") {
      parts.push(amountLabel);
    }
  }

  return parts.length > 0 ? parts.join(" · ") : "조건 미공개";
}

function appendContractDateSuffix(
  subtitle: string,
  player: FaPlayer,
): string {
  const short = formatContractDateShort(player.contract_date);
  if (!short) {
    return subtitle;
  }
  return `${subtitle} · ${short} 계약`;
}

function isInitialFaRecord(player: FaPlayer): boolean {
  const status = player.contract_status?.trim() ?? "";
  if (status !== "FA") {
    return false;
  }
  const note = player.contract_note?.trim() ?? "";
  return (
    player.new_team_id == null &&
    (player.contract_amount == null || player.contract_amount <= 0) &&
    (player.contract_years == null || player.contract_years <= 0) &&
    note === ""
  );
}

function teamShortName(team: FaTeam | undefined | null): string {
  if (!team) {
    return "—";
  }
  return team.short_name?.trim() || team.team_name?.trim() || "—";
}

function buildRecentUpdateSubtitle(
  player: FaPlayer,
  originTeam: FaTeam | undefined,
  newTeam: FaTeam | null,
  bucket: ContractStatusBucket,
): string {
  const originShort = teamShortName(originTeam);
  const newShort = newTeam ? teamShortName(newTeam) : null;
  const terms = formatContractTermsSummary(player);

  if (
    bucket === "계약미체결" ||
    (originTeam != null && isDeferredTeam(originTeam))
  ) {
    return appendContractDateSuffix("계약미체결", player);
  }

  const isRetention =
    bucket === "잔류" ||
    (newShort != null &&
      originShort !== "—" &&
      newShort === originShort);

  if (isRetention) {
    const teamLabel = newShort && newShort !== "—" ? newShort : originShort;
    return appendContractDateSuffix(`${teamLabel} 잔류 · ${terms}`, player);
  }

  const isTransfer =
    bucket === "이적" ||
    (newShort != null && originShort !== "—" && newShort !== originShort);

  if (isTransfer) {
    const transfer =
      newShort && newShort !== "—"
        ? `${originShort} → ${newShort}`
        : originShort;
    return appendContractDateSuffix(`${transfer} · 이적 · ${terms}`, player);
  }

  const statusLabel = bucket === "미정" ? "미정" : bucket;
  return appendContractDateSuffix(
    `${originShort} · ${statusLabel} · ${terms}`,
    player,
  );
}

/** status_updated_at 기준 최근 반영 선수 (DB 변경 없음) */
export function getRecentUpdates(
  players: FaPlayer[],
  teams: FaTeam[],
  limit = RECENT_LIMIT,
): RecentUpdateEntry[] {
  const teamById = new Map(teams.map((t) => [t.id, t]));

  return players
    .filter((p) => {
      if (!p.status_updated_at?.trim()) {
        return false;
      }
      if (isInitialFaRecord(p)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      const tb = Date.parse(b.status_updated_at!);
      const ta = Date.parse(a.status_updated_at!);
      return tb - ta;
    })
    .slice(0, limit)
    .map((player) => {
      const originTeam = teamById.get(player.team_id);
      const newTeam =
        player.new_team_id != null
          ? (teamById.get(player.new_team_id) ?? null)
          : null;
      const bucket = normalizeContractStatus(
        player.contract_status,
        originTeam,
      );

      const subtitle = buildRecentUpdateSubtitle(
        player,
        originTeam,
        newTeam,
        bucket,
      );

      return {
        playerId: player.id,
        playerName: player.player_name,
        subtitle,
        line: `${player.player_name} · ${subtitle}`,
        updatedAt: player.status_updated_at!,
      };
    });
}
