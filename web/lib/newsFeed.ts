import {
  fetchNewsItemIdsByPlayerId,
  fetchNewsItemIdsByPlayerIds,
  fetchNewsItems,
  fetchNewsItemsByIds,
} from "@/lib/supabase";
import { parseFilterId } from "@/lib/feedFilters";
import type { FaPlayer, NewsItem } from "@/lib/types";

const FEED_LIMIT = 100;

function dedupeNewsItemIds(ids: number[]): number[] {
  return [...new Set(ids)];
}

/** 팀/선수 필터는 Supabase 조회 단계에서 적용 후 최신 FEED_LIMIT건 반환 */
export async function fetchFilteredNewsItems(
  teamFilter: string,
  playerFilter: string,
  players: FaPlayer[],
  limit = FEED_LIMIT,
): Promise<NewsItem[]> {
  const selectedPlayerId = parseFilterId(playerFilter);
  const selectedTeamId = parseFilterId(teamFilter);

  if (selectedPlayerId !== null) {
    const newsIds = dedupeNewsItemIds(
      await fetchNewsItemIdsByPlayerId(selectedPlayerId),
    );
    return fetchNewsItemsByIds(newsIds, limit);
  }

  if (selectedTeamId !== null) {
    const teamPlayerIds = players
      .map((p) => {
        const pid = Number(p.id);
        const tid = Number(p.team_id);
        return tid === selectedTeamId && Number.isFinite(pid) ? pid : null;
      })
      .filter((id): id is number => id !== null);

    const newsIds = dedupeNewsItemIds(
      await fetchNewsItemIdsByPlayerIds(teamPlayerIds),
    );
    return fetchNewsItemsByIds(newsIds, limit);
  }

  return fetchNewsItems(limit);
}
