import type { FaPlayer, FaTeam, NewsItem, NewsPlayerMention } from "@/lib/types";

export type FeedMaps = {
  teamById: Map<number, FaTeam>;
  playerById: Map<number, FaPlayer>;
  playersByTeamId: Map<number, FaPlayer[]>;
  mentionsByNewsId: Map<number, NewsPlayerMention[]>;
  newsIdsByPlayerId: Map<number, Set<number>>;
};

export function buildFeedMaps(
  teams: FaTeam[],
  players: FaPlayer[],
  mentions: NewsPlayerMention[],
): FeedMaps {
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const playerById = new Map(players.map((p) => [p.id, p]));
  const playersByTeamId = new Map<number, FaPlayer[]>();
  const mentionsByNewsId = new Map<number, NewsPlayerMention[]>();
  const newsIdsByPlayerId = new Map<number, Set<number>>();

  for (const player of players) {
    const list = playersByTeamId.get(player.team_id) ?? [];
    list.push(player);
    playersByTeamId.set(player.team_id, list);
  }

  for (const mention of mentions) {
    const byNews = mentionsByNewsId.get(mention.news_item_id) ?? [];
    byNews.push(mention);
    mentionsByNewsId.set(mention.news_item_id, byNews);

    const byPlayer =
      newsIdsByPlayerId.get(mention.player_id) ?? new Set<number>();
    byPlayer.add(mention.news_item_id);
    newsIdsByPlayerId.set(mention.player_id, byPlayer);
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
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function filterNewsByMentions(
  newsItems: NewsItem[],
  mentions: NewsPlayerMention[],
  players: FaPlayer[],
  teamFilter: string,
  playerFilter: string,
): NewsItem[] {
  const selectedTeamId = parseFilterId(teamFilter);
  const selectedPlayerId = parseFilterId(playerFilter);

  if (selectedTeamId === null && selectedPlayerId === null) {
    return newsItems;
  }

  const teamPlayerIds =
    selectedTeamId === null
      ? null
      : new Set(
          players
            .filter((p) => p.team_id === selectedTeamId)
            .map((p) => p.id),
        );

  return newsItems.filter((news) => {
    const newsMentions = mentions.filter((m) => m.news_item_id === news.id);
    if (newsMentions.length === 0) return false;

    if (selectedPlayerId !== null) {
      return newsMentions.some((m) => m.player_id === selectedPlayerId);
    }

    if (teamPlayerIds !== null) {
      return newsMentions.some((m) => teamPlayerIds.has(m.player_id));
    }

    return true;
  });
}

export function buildTeamFilterOptions(teams: FaTeam[]): { id: string; label: string }[] {
  return [
    { id: "all", label: "전체" },
    ...teams
      .slice()
      .sort((a, b) => a.short_name.localeCompare(b.short_name, "ko"))
      .map((t) => ({ id: String(t.id), label: t.short_name })),
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
      : players.filter((p) => p.team_id === selectedTeamId);

  return [
    { id: "all", label: "전체" },
    ...scoped
      .slice()
      .sort((a, b) => a.player_name.localeCompare(b.player_name, "ko"))
      .map((p) => ({ id: String(p.id), label: p.player_name })),
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

  return player.team_id === teamId;
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
  mentions: NewsPlayerMention[],
  maps: FeedMaps,
): RelatedPlayerBadge[] {
  const seen = new Set<number>();
  const badges: RelatedPlayerBadge[] = [];

  for (const mention of mentions) {
    if (mention.news_item_id !== newsId || seen.has(mention.player_id)) {
      continue;
    }
    seen.add(mention.player_id);
    const player = maps.playerById.get(mention.player_id);
    if (!player) continue;
    const team = maps.teamById.get(player.team_id);
    badges.push({
      playerId: player.id,
      playerName: player.player_name,
      teamShortName: team?.short_name ?? "",
    });
  }

  return badges.sort((a, b) =>
    a.playerName.localeCompare(b.playerName, "ko"),
  );
}
