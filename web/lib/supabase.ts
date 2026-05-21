import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { FaPlayer, FaTeam, NewsItem, NewsPlayerMention } from "@/lib/types";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) {
    return client;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY가 설정되지 않았습니다.",
    );
  }

  client = createClient(url, anonKey);
  return client;
}

const NEWS_ITEM_SELECT =
  "id, title, description, link, original_link, publisher, pub_date, detected_at, matched_keywords, is_alert_sent, created_at";

/** news_items 전체 건수 (필터와 무관). 실패 시 null */
export async function fetchNewsItemsTotalCount(): Promise<number | null> {
  try {
    const supabase = getSupabase();
    const { count, error } = await supabase
      .from("news_items")
      .select("id", { count: "exact", head: true });

    if (error) {
      console.error("[fetchNewsItemsTotalCount]", error.message);
      return null;
    }
    return count ?? null;
  } catch (err) {
    console.error("[fetchNewsItemsTotalCount]", err);
    return null;
  }
}

export async function fetchNewsItems(limit = 50): Promise<NewsItem[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("news_items")
    .select(NEWS_ITEM_SELECT)
    .order("detected_at", { ascending: false })
    .order("pub_date", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as NewsItem[];
}

export async function fetchNewsItemIdsByPlayerId(
  playerId: number,
): Promise<number[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("news_player_mentions")
    .select("news_item_id")
    .eq("player_id", playerId);

  if (error) {
    throw new Error(error.message);
  }

  const ids = new Set<number>();
  for (const row of data ?? []) {
    const id = Number(row.news_item_id);
    if (Number.isFinite(id)) ids.add(id);
  }
  return [...ids];
}

export async function fetchNewsItemIdsByPlayerIds(
  playerIds: number[],
): Promise<number[]> {
  if (playerIds.length === 0) return [];

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("news_player_mentions")
    .select("news_item_id")
    .in("player_id", playerIds);

  if (error) {
    throw new Error(error.message);
  }

  const ids = new Set<number>();
  for (const row of data ?? []) {
    const id = Number(row.news_item_id);
    if (Number.isFinite(id)) ids.add(id);
  }
  return [...ids];
}

export async function fetchNewsItemsByIds(
  newsIds: number[],
  limit = 100,
): Promise<NewsItem[]> {
  if (newsIds.length === 0) return [];

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("news_items")
    .select(NEWS_ITEM_SELECT)
    .in("id", newsIds)
    .order("detected_at", { ascending: false })
    .order("pub_date", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as NewsItem[];
}

export async function fetchFaTeams(): Promise<FaTeam[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("fa_teams")
    .select("id, team_name, short_name, match_keywords, logo_path, created_at")
    .order("id", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as FaTeam[];
}

export async function fetchFaPlayers(): Promise<FaPlayer[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("fa_players")
    .select(
      "id, team_id, player_name, status, contract_status, new_team_id, contract_note, contract_amount, contract_years, status_updated_at, created_at",
    )
    .order("team_id", { ascending: true })
    .order("player_name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as FaPlayer[];
}

export async function fetchNewsPlayerMentionsByNewsIds(
  newsIds: number[],
): Promise<NewsPlayerMention[]> {
  if (newsIds.length === 0) return [];
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("news_player_mentions")
    .select("id, news_item_id, player_id, created_at")
    .in("news_item_id", newsIds);

  if (error) throw new Error(error.message);
  return (data ?? []) as NewsPlayerMention[];
}
