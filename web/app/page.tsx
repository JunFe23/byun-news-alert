"use client";

import { useCallback, useEffect, useState } from "react";
import FeedIntro from "@/components/FeedIntro";
import FeedState from "@/components/FeedState";
import Header from "@/components/Header";
import NewsCard from "@/components/NewsCard";
import SiteFooter from "@/components/SiteFooter";
import { fetchNewsItems } from "@/lib/supabase";
import type { NewsItem } from "@/lib/types";

type LoadState = "loading" | "success" | "error";

export default function HomePage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const loadNews = useCallback(async () => {
    setLoadState("loading");
    setErrorMessage(null);

    try {
      const data = await fetchNewsItems(50);
      setItems(data);
      setLastUpdated(new Date().toISOString());
      setLoadState("success");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "뉴스를 불러오는 중 오류가 발생했습니다.";
      setErrorMessage(message);
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    void loadNews();
  }, [loadNews]);

  const showFeed = loadState === "success" && items.length > 0;
  const newsCount = loadState === "success" ? items.length : undefined;

  return (
    <div className="page-shell">
      <Header
        loadNews={loadNews}
        loadState={loadState}
        lastUpdated={lastUpdated}
        newsCount={newsCount}
      />

      <main className="mx-auto max-w-[640px] px-4 pb-6 pt-6">
        {loadState === "success" && items.length > 0 ? (
          <FeedIntro newsCount={items.length} />
        ) : null}

        {loadState === "loading" && <FeedState variant="loading" />}

        {loadState === "error" && (
          <FeedState
            variant="error"
            errorMessage={errorMessage}
            onRetry={loadNews}
          />
        )}

        {loadState === "success" && items.length === 0 && (
          <FeedState variant="empty" />
        )}

        {showFeed ? (
          <ul className="flex flex-col gap-6">
            {items.map((item, index) => (
              <li key={item.id}>
                <NewsCard item={item} isLatest={index === 0} />
              </li>
            ))}
          </ul>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  );
}
