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

export async function fetchNewsItems(limit = 50): Promise<NewsItem[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("news_items")
    .select(
      "id, title, description, link, original_link, publisher, pub_date, detected_at, matched_keywords, is_alert_sent, created_at",
    )
    .order("detected_at", { ascending: false })
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
