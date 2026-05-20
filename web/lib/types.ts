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
