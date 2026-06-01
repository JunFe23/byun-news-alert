import { isDeferredTeam } from "@/lib/filterSort";
import { buildContractTermsParts } from "@/lib/contractTermsSummary";
import { comparePlayersByContractDate } from "@/lib/filterSort";
import {
  normalizeContractStatus,
  type ContractStatusBucket,
} from "@/lib/faPlayerStatus";
import type { FaPlayer, FaTeam } from "@/lib/types";

const RECENT_LIMIT = 5;

export type RecentContractSubtitlePart = {
  text: string;
  nowrap?: boolean;
};

export type RecentContractEntry = {
  playerId: number;
  playerName: string;
  /** YYYY-MM-DD */
  contractDate: string;
  /** 2줄째 본문 (날짜 접미사 제외) */
  detailParts: RecentContractSubtitlePart[];
  /** 접근성·호환 한 줄 요약 */
  line: string;
};

function hasValidContractDate(player: FaPlayer): boolean {
  const d = player.contract_date?.trim();
  return !!d && /^\d{4}-\d{2}-\d{2}$/.test(d);
}

/** 최근 계약 목록 대상 — 계약일 있음, FA·빈 상태 제외 */
export function isEligibleRecentContract(player: FaPlayer): boolean {
  if (!hasValidContractDate(player)) {
    return false;
  }
  const status = player.contract_status?.trim() ?? "";
  if (status === "" || status === "FA" || status === "은퇴" || status === "미정") {
    return false;
  }
  return true;
}

function teamShortName(team: FaTeam | undefined | null): string {
  if (!team) {
    return "—";
  }
  return team.short_name?.trim() || team.team_name?.trim() || "—";
}

function buildStatusLine(
  player: FaPlayer,
  originTeam: FaTeam | undefined,
  newTeam: FaTeam | null,
  bucket: ContractStatusBucket,
): string {
  const originShort = teamShortName(originTeam);
  const newShort = newTeam ? teamShortName(newTeam) : null;

  if (
    bucket === "계약미체결" ||
    (originTeam != null && isDeferredTeam(originTeam))
  ) {
    return "계약미체결";
  }

  const isRetention =
    bucket === "잔류" ||
    (newShort != null &&
      originShort !== "—" &&
      newShort === originShort);

  if (isRetention) {
    const teamLabel = newShort && newShort !== "—" ? newShort : originShort;
    return `${teamLabel} 잔류`;
  }

  const isTransfer =
    bucket === "이적" ||
    (newShort != null && originShort !== "—" && newShort !== originShort);

  if (isTransfer) {
    const transfer =
      newShort && newShort !== "—"
        ? `${originShort} → ${newShort}`
        : originShort;
    return `${transfer} · 이적`;
  }

  const statusLabel = bucket;
  return `${originShort} · ${statusLabel}`;
}

function buildRecentContractDetailParts(
  player: FaPlayer,
  originTeam: FaTeam | undefined,
  newTeam: FaTeam | null,
  bucket: ContractStatusBucket,
): RecentContractSubtitlePart[] {
  const statusLine = buildStatusLine(player, originTeam, newTeam, bucket);
  const termsParts = buildContractTermsParts(player);

  const parts: RecentContractSubtitlePart[] = [{ text: statusLine }];
  if (termsParts.length > 0) {
    parts.push({ text: " · " });
    parts.push(...termsParts);
  }
  return parts;
}

function buildLine(
  playerName: string,
  detailParts: RecentContractSubtitlePart[],
  contractDate: string,
): string {
  const detail = detailParts.map((p) => p.text).join("");
  const [, m, d] = contractDate.split("-");
  return `${playerName} · ${detail} · ${m}.${d} 계약`;
}

/** contract_date 기준 최신 계약 (최대 5명) */
export function getRecentContracts(
  players: FaPlayer[],
  teams: FaTeam[],
  limit = RECENT_LIMIT,
): RecentContractEntry[] {
  const teamById = new Map(teams.map((t) => [t.id, t]));

  return players
    .filter(isEligibleRecentContract)
    .sort(comparePlayersByContractDate)
    .slice(0, limit)
    .map((player) => {
      const contractDate = player.contract_date!.trim();
      const originTeam = teamById.get(player.team_id);
      const newTeam =
        player.new_team_id != null
          ? (teamById.get(player.new_team_id) ?? null)
          : null;
      const bucket = normalizeContractStatus(
        player.contract_status,
        originTeam,
      );

      const detailParts = buildRecentContractDetailParts(
        player,
        originTeam,
        newTeam,
        bucket,
      );

      const line = buildLine(player.player_name, detailParts, contractDate);

      return {
        playerId: player.id,
        playerName: player.player_name,
        contractDate,
        detailParts,
        line,
      };
    });
}
