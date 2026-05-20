"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FeedIntro from "@/components/FeedIntro";
import FeedState from "@/components/FeedState";
import FaBoard from "@/components/FaBoard";
import Header from "@/components/Header";
import FilterPills from "@/components/FilterPills";
import NewsCard from "@/components/NewsCard";
import SiteFooter from "@/components/SiteFooter";
import TabsNav from "@/components/TabsNav";
import {
  fetchFaPlayers,
  fetchFaTeams,
  fetchNewsItems,
  fetchNewsPlayerMentionsByNewsIds,
} from "@/lib/supabase";
import type { FaPlayer, FaTeam, NewsItem, NewsPlayerMention } from "@/lib/types";

type LoadState = "loading" | "success" | "error";

export default function ClientHome() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<NewsItem[]>([]);
  const [teams, setTeams] = useState<FaTeam[]>([]);
  const [players, setPlayers] = useState<FaPlayer[]>([]);
  const [mentions, setMentions] = useState<NewsPlayerMention[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const rawTab = searchParams.get("tab");
  const tab = rawTab === "board" ? "board" : "feed";
  const teamId = searchParams.get("team") ?? "all";
  const playerId = searchParams.get("player") ?? "all";
  const boardTeamId = searchParams.get("bteam") ?? "all";
  const boardStatus = searchParams.get("bstatus") ?? "all";

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value === "all" || value === "") next.delete(key);
      else next.set(key, value);
      router.replace(`/?${next.toString()}`);
    },
    [router, searchParams],
  );

  const loadNews = useCallback(async () => {
    setLoadState("loading");
    setErrorMessage(null);

    try {
      const [news, teamRows, playerRows] = await Promise.all([
        fetchNewsItems(100),
        fetchFaTeams(),
        fetchFaPlayers(),
      ]);
      setItems(news);
      setTeams(teamRows);
      setPlayers(playerRows);

      const newsIds = news.map((n) => n.id);
      const mentionRows = await fetchNewsPlayerMentionsByNewsIds(newsIds);
      setMentions(mentionRows);

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

  const newsCount = loadState === "success" ? items.length : undefined;

  const playerById = new Map(players.map((p) => [p.id, p]));

  const mentionByNewsId = new Map<number, number[]>();
  for (const m of mentions) {
    const list = mentionByNewsId.get(m.news_item_id) ?? [];
    list.push(m.player_id);
    mentionByNewsId.set(m.news_item_id, list);
  }

  const newsCountByPlayerId = new Map<number, number>();
  for (const m of mentions) {
    newsCountByPlayerId.set(
      m.player_id,
      (newsCountByPlayerId.get(m.player_id) ?? 0) + 1,
    );
  }

  const filteredNews = items.filter((news) => {
    if (teamId === "all" && playerId === "all") return true;
    const playerIds = mentionByNewsId.get(news.id) ?? [];
    if (playerId !== "all") {
      return playerIds.includes(Number(playerId));
    }
    if (teamId !== "all") {
      for (const pid of playerIds) {
        const p = playerById.get(pid);
        if (p && String(p.team_id) === teamId) return true;
      }
      return false;
    }
    return true;
  });

  const showFeed = loadState === "success" && filteredNews.length > 0;

  const teamOptions = [
    { id: "all", label: "전체" },
    ...teams.map((t) => ({ id: String(t.id), label: t.short_name })),
  ];

  const playerOptions = [
    { id: "all", label: "전체" },
    ...players
      .slice()
      .sort((a, b) => a.player_name.localeCompare(b.player_name, "ko"))
      .map((p) => ({ id: String(p.id), label: p.player_name })),
  ];

  return (
    <div className="page-shell">
      <Header
        loadNews={loadNews}
        loadState={loadState}
        lastUpdated={lastUpdated}
        newsCount={newsCount}
      />

      <main className="mx-auto max-w-[640px] px-4 pb-6 pt-6">
        <TabsNav active={tab} onChange={(next) => setParam("tab", next)} />

        {tab === "feed" ? (
          <>
            {loadState === "success" && items.length > 0 ? (
              <FeedIntro newsCount={items.length} />
            ) : null}

            {loadState === "success" && items.length > 0 ? (
              <>
                <FilterPills
                  label="팀 필터"
                  options={teamOptions}
                  value={teamId}
                  onChange={(id) => {
                    setParam("team", id);
                    setParam("player", "all");
                  }}
                />
                <FilterPills
                  label="선수 필터"
                  options={
                    teamId === "all"
                      ? playerOptions
                      : [
                          { id: "all", label: "전체" },
                          ...players
                            .filter((p) => String(p.team_id) === teamId)
                            .sort((a, b) =>
                              a.player_name.localeCompare(b.player_name, "ko"),
                            )
                            .map((p) => ({
                              id: String(p.id),
                              label: p.player_name,
                            })),
                        ]
                  }
                  value={playerId}
                  onChange={(id) => setParam("player", id)}
                />
              </>
            ) : null}

            {loadState === "loading" && <FeedState variant="loading" />}
            {loadState === "error" && (
              <FeedState
                variant="error"
                errorMessage={errorMessage}
                onRetry={loadNews}
              />
            )}
            {loadState === "success" && filteredNews.length === 0 && (
              <FeedState variant="empty" />
            )}

            {showFeed ? (
              <ul className="flex flex-col gap-6">
                {filteredNews.map((item, index) => (
                  <li key={item.id}>
                    <NewsCard item={item} isLatest={index === 0} />
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        ) : (
          <>
            {loadState === "loading" && <FeedState variant="loading" />}
            {loadState === "error" && (
              <FeedState
                variant="error"
                errorMessage={errorMessage}
                onRetry={loadNews}
              />
            )}
            {loadState === "success" ? (
              <FaBoard
                teams={teams}
                players={players}
                newsCountByPlayerId={newsCountByPlayerId}
                teamFilter={boardTeamId}
                statusFilter={boardStatus}
                onTeamFilterChange={(v) => setParam("bteam", v)}
                onStatusFilterChange={(v) => setParam("bstatus", v)}
                onSelectPlayer={(pid) => {
                  const next = new URLSearchParams(searchParams.toString());
                  next.set("tab", "feed");
                  next.delete("team");
                  next.set("player", String(pid));
                  router.replace(`/?${next.toString()}`);
                }}
              />
            ) : null}
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

