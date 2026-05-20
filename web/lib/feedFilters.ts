import { sortPlayersForFilter, sortTeamsForFilter } from "@/lib/filterSort";
import type { FaPlayer, FaTeam, NewsItem, NewsPlayerMention } from "@/lib/types";

export type FeedMaps = {
  teamById: Map<number, FaTeam>;
  playerById: Map<number, FaPlayer>;
  playersByTeamId: Map<number, FaPlayer[]>;
  mentionsByNewsId: Map<number, NewsPlayerMention[]>;
  newsIdsByPlayerId: Map<number, Set<number>>;
};

export function normalizeNumericId(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function buildFeedMaps(
  teams: FaTeam[],
  players: FaPlayer[],
  mentions: NewsPlayerMention[],
): FeedMaps {
  const teamById = new Map<number, FaTeam>();
  for (const team of teams) {
    const id = normalizeNumericId(team.id);
    if (id !== null) teamById.set(id, team);
  }

  const playerById = new Map<number, FaPlayer>();
  const playersByTeamId = new Map<number, FaPlayer[]>();
  const mentionsByNewsId = new Map<number, NewsPlayerMention[]>();
  const newsIdsByPlayerId = new Map<number, Set<number>>();

  for (const player of players) {
    const playerId = normalizeNumericId(player.id);
    const teamId = normalizeNumericId(player.team_id);
    if (playerId === null || teamId === null) continue;

    playerById.set(playerId, player);
    const list = playersByTeamId.get(teamId) ?? [];
    list.push(player);
    playersByTeamId.set(teamId, list);
  }

  for (const mention of mentions) {
    const newsId = normalizeNumericId(mention.news_item_id);
    const playerId = normalizeNumericId(mention.player_id);
    if (newsId === null || playerId === null) continue;

    const byNews = mentionsByNewsId.get(newsId) ?? [];
    byNews.push(mention);
    mentionsByNewsId.set(newsId, byNews);

    const byPlayer = newsIdsByPlayerId.get(playerId) ?? new Set<number>();
    byPlayer.add(newsId);
    newsIdsByPlayerId.set(playerId, byPlayer);
  }

  return {
    teamById,
    playerById,
    playersByTeamId,
    mentionsByNewsId,
    newsIdsByPlayerId,
  };
}

export function parseFilterId(value: string): number | null {
  if (value === "all" || value === "") return null;
  return normalizeNumericId(value);
}

/** news_player_mentions + fa_players.team_id 관계만 사용 (title/description 미사용) */
export function filterNewsByMentions(
  newsItems: NewsItem[],
  maps: FeedMaps,
  teamFilter: string,
  playerFilter: string,
): NewsItem[] {
  const selectedTeamId = parseFilterId(teamFilter);
  const selectedPlayerId = parseFilterId(playerFilter);

  if (selectedTeamId === null && selectedPlayerId === null) {
    return newsItems;
  }

  const teamPlayers = selectedTeamId
    ? (maps.playersByTeamId.get(selectedTeamId) ?? [])
    : [];
  const teamPlayerIds = new Set(
    teamPlayers
      .map((p) => normalizeNumericId(p.id))
      .filter((id): id is number => id !== null),
  );

  return newsItems.filter((news) => {
    const newsId = normalizeNumericId(news.id);
    if (newsId === null) return false;

    const newsMentions = maps.mentionsByNewsId.get(newsId) ?? [];
    if (newsMentions.length === 0) return false;

    if (selectedPlayerId !== null) {
      return newsMentions.some(
        (m) => normalizeNumericId(m.player_id) === selectedPlayerId,
      );
    }

    if (selectedTeamId !== null) {
      return newsMentions.some((m) => {
        const pid = normalizeNumericId(m.player_id);
        return pid !== null && teamPlayerIds.has(pid);
      });
    }

    return true;
  });
}

export function buildTeamFilterOptions(
  teams: FaTeam[],
): { id: string; label: string }[] {
  const sorted = sortTeamsForFilter(teams);
  return [
    { id: "all", label: "전체" },
    ...sorted.map((t) => ({ id: String(t.id), label: t.short_name })),
  ];
}

export function buildPlayerFilterOptions(
  players: FaPlayer[],
  teamFilter: string,
): { id: string; label: string }[] {
  const selectedTeamId = parseFilterId(teamFilter);
  const scoped =
    selectedTeamId === null
      ? players
      : players.filter(
          (p) => normalizeNumericId(p.team_id) === selectedTeamId,
        );

  const sorted = sortPlayersForFilter(scoped);

  return [
    { id: "all", label: "전체" },
    ...sorted.map((p) => ({ id: String(p.id), label: p.player_name })),
  ];
}

export function isPlayerValidForTeamFilter(
  playerFilter: string,
  teamFilter: string,
  playerById: Map<number, FaPlayer>,
): boolean {
  const playerId = parseFilterId(playerFilter);
  if (playerId === null) return true;

  const player = playerById.get(playerId);
  if (!player) return false;

  const teamId = parseFilterId(teamFilter);
  if (teamId === null) return true;

  return normalizeNumericId(player.team_id) === teamId;
}

export function getFilterEmptyMessage(
  teamFilter: string,
  playerFilter: string,
): string {
  if (parseFilterId(playerFilter) !== null) {
    return "이 선수와 연결된 뉴스가 아직 없습니다.";
  }
  if (parseFilterId(teamFilter) !== null) {
    return "이 팀과 연결된 뉴스가 아직 없습니다.";
  }
  return "아직 감지된 뉴스가 없습니다.";
}

export type RelatedPlayerBadge = {
  playerId: number;
  playerName: string;
  teamShortName: string;
};

export function getRelatedPlayersForNews(
  newsId: number,
  maps: FeedMaps,
): RelatedPlayerBadge[] {
  const normalizedNewsId = normalizeNumericId(newsId);
  if (normalizedNewsId === null) return [];

  const newsMentions = maps.mentionsByNewsId.get(normalizedNewsId) ?? [];
  const seen = new Set<number>();
  const badges: RelatedPlayerBadge[] = [];

  for (const mention of newsMentions) {
    const playerId = normalizeNumericId(mention.player_id);
    if (playerId === null || seen.has(playerId)) continue;
    seen.add(playerId);

    const player = maps.playerById.get(playerId);
    if (!player) continue;

    const teamId = normalizeNumericId(player.team_id);
    const team = teamId !== null ? maps.teamById.get(teamId) : undefined;

    badges.push({
      playerId,
      playerName: player.player_name,
      teamShortName: team?.short_name ?? "",
    });
  }

  return badges.sort((a, b) =>
    a.playerName.localeCompare(b.playerName, "ko"),
  );
}
