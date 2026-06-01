export interface NewsItem {
  id: number;
  title: string;
  description: string | null;
  link: string;
  original_link: string | null;
  publisher: string | null;
  pub_date: string | null;
  detected_at: string;
  matched_keywords: string[] | null;
  is_alert_sent: boolean;
  created_at: string;
}

export interface FaTeam {
  id: number;
  team_name: string;
  short_name: string;
  match_keywords: string[] | null;
  logo_path: string | null;
  created_at?: string;
}

export type ContractStatus =
  | "FA"
  | "잔류"
  | "이적"
  | "계약미체결"
  | "은퇴"
  | string;

export interface FaPlayer {
  id: number;
  team_id: number;
  player_name: string;
  status: string | null;
  contract_status: ContractStatus | null;
  new_team_id: number | null;
  contract_note: string | null;
  contract_amount: number | null;
  contract_years: number | null;
  /** Supabase DATE — YYYY-MM-DD */
  contract_date: string | null;
  status_updated_at: string | null;
  created_at?: string;
}

export interface NewsPlayerMention {
  id: number;
  news_item_id: number;
  player_id: number;
  created_at: string;
}
