"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FeedIntro from "@/components/FeedIntro";
import FeedState from "@/components/FeedState";
import FilterEmptyState from "@/components/FilterEmptyState";
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
import {
  buildFeedMaps,
  buildPlayerFilterOptions,
  buildTeamFilterOptions,
  filterNewsByMentions,
  getFilterEmptyMessage,
  getRelatedPlayersForNews,
  isPlayerValidForTeamFilter,
} from "@/lib/feedFilters";
import type { FaPlayer, FaTeam, NewsItem, NewsPlayerMention } from "@/lib/types";
import { logLoadError } from "@/lib/userFacingError";

type LoadState = "loading" | "success" | "error";

export default function ClientHome() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<NewsItem[]>([]);
  const [teams, setTeams] = useState<FaTeam[]>([]);
  const [players, setPlayers] = useState<FaPlayer[]>([]);
  const [mentions, setMentions] = useState<NewsPlayerMention[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
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
      logLoadError("loadNews", error);
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    void loadNews();
  }, [loadNews]);

  const feedMaps = useMemo(
    () => buildFeedMaps(teams, players, mentions),
    [teams, players, mentions],
  );

  useEffect(() => {
    if (loadState !== "success") return;
    if (!isPlayerValidForTeamFilter(playerId, teamId, feedMaps.playerById)) {
      setParam("player", "all");
    }
  }, [loadState, playerId, teamId, feedMaps.playerById, setParam]);

  const filteredNews = useMemo(
    () => filterNewsByMentions(items, feedMaps, teamId, playerId),
    [items, feedMaps, teamId, playerId],
  );

  const newsCountByPlayerId = useMemo(() => {
    const counts = new Map<number, number>();
    for (const m of mentions) {
      counts.set(m.player_id, (counts.get(m.player_id) ?? 0) + 1);
    }
    return counts;
  }, [mentions]);

  const teamOptions = useMemo(() => buildTeamFilterOptions(teams), [teams]);
  const playerOptions = useMemo(
    () => buildPlayerFilterOptions(players, teamId),
    [players, teamId],
  );

  const newsCount = loadState === "success" ? items.length : undefined;
  const hasAnyNews = loadState === "success" && items.length > 0;
  const hasFilteredResults = loadState === "success" && filteredNews.length > 0;
  const filterActive = teamId !== "all" || playerId !== "all";

  const applySearchParams = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "all" || value === "") {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      }
      router.replace(`/?${next.toString()}`);
    },
    [router, searchParams],
  );

  const handleTeamFilterChange = (id: string) => {
    applySearchParams({
      team: id === "all" ? null : id,
      player: null,
    });
  };

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
            {hasAnyNews ? <FeedIntro newsCount={items.length} /> : null}

            {hasAnyNews ? (
              <>
                <FilterPills
                  label="팀 필터"
                  options={teamOptions}
                  value={teamId}
                  onChange={handleTeamFilterChange}
                />
                <FilterPills
                  label="선수 필터"
                  options={playerOptions}
                  value={playerId}
                  onChange={(id) => setParam("player", id)}
                />
              </>
            ) : null}

            {loadState === "loading" && <FeedState variant="loading" />}
            {loadState === "error" && (
              <FeedState variant="error" onRetry={loadNews} />
            )}
            {loadState === "success" && !hasAnyNews && (
              <FeedState variant="empty" />
            )}
            {loadState === "success" && hasAnyNews && !hasFilteredResults && (
              <FilterEmptyState
                message={getFilterEmptyMessage(teamId, playerId)}
              />
            )}

            {hasFilteredResults ? (
              <ul className="flex flex-col gap-6">
                {filteredNews.map((item, index) => (
                  <li key={item.id}>
                    <NewsCard
                      item={item}
                      isLatest={index === 0 && !filterActive}
                      relatedPlayers={getRelatedPlayersForNews(
                        item.id,
                        feedMaps,
                      )}
                    />
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        ) : (
          <>
            {loadState === "loading" && <FeedState variant="loading" />}
            {loadState === "error" && (
              <FeedState variant="error" onRetry={loadNews} />
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
                  const player = players.find((p) => p.id === pid);
                  const next = new URLSearchParams(searchParams.toString());
                  next.set("tab", "feed");
                  if (player) {
                    next.set("team", String(player.team_id));
                  } else {
                    next.delete("team");
                  }
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
