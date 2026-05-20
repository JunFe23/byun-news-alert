import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { NewsItem } from "@/lib/types";

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
