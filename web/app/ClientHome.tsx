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
import { fetchLinkPreviewImageUrl } from "@/lib/linkPreviewClient";
import { fetchFilteredNewsItems } from "@/lib/newsFeed";
import {
  fetchFaPlayers,
  fetchFaTeams,
  fetchNewsItemsTotalCount,
  fetchNewsPlayerMentionsByNewsIds,
} from "@/lib/supabase";
import {
  buildFeedMaps,
  buildPlayerFilterOptions,
  buildTeamFilterOptions,
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
  const [lastDetectedAt, setLastDetectedAt] = useState<string | null>(null);
  const [totalNewsCount, setTotalNewsCount] = useState<number | null>(null);
  /** 첫 뉴스 카드 LCP용 OG 이미지 (undefined=로딩 중) */
  const [heroImageUrl, setHeroImageUrl] = useState<string | null | undefined>(
    undefined,
  );

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
    setHeroImageUrl(undefined);
    try {
      const needsPlayersFirst = teamId !== "all" || playerId !== "all";
      let teamRows: FaTeam[] = [];
      let playerRows: FaPlayer[] = [];

      if (needsPlayersFirst) {
        [teamRows, playerRows] = await Promise.all([
          fetchFaTeams(),
          fetchFaPlayers(),
        ]);
        setTeams(teamRows);
        setPlayers(playerRows);
      }

      void fetchNewsItemsTotalCount().then((count) => {
        setTotalNewsCount(count);
      });

      const news = await fetchFilteredNewsItems(
        teamId,
        playerId,
        playerRows,
        100,
      );
      setItems(news);
      setLastDetectedAt(news[0]?.detected_at ?? null);

      const firstLink = news[0]?.link;
      if (firstLink) {
        void fetchLinkPreviewImageUrl(firstLink).then((url) => {
          setHeroImageUrl(url);
        });
      } else {
        setHeroImageUrl(null);
      }

      if (!needsPlayersFirst) {
        [teamRows, playerRows] = await Promise.all([
          fetchFaTeams(),
          fetchFaPlayers(),
        ]);
        setTeams(teamRows);
        setPlayers(playerRows);
      }

      const newsIds = news.map((n) => n.id);
      const mentionRows = await fetchNewsPlayerMentionsByNewsIds(newsIds);
      setMentions(mentionRows);

      setLoadState("success");
    } catch (error) {
      logLoadError("loadNews", error);
      setLoadState("error");
      setHeroImageUrl(null);
    }
  }, [teamId, playerId]);

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

  const displayedNewsCount =
    loadState === "success" ? items.length : undefined;
  const hasNewsInDb =
    loadState === "success" &&
    ((totalNewsCount ?? 0) > 0 || items.length > 0);
  const hasFeedResults = loadState === "success" && items.length > 0;
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
        lastDetectedAt={lastDetectedAt}
        totalNewsCount={totalNewsCount}
        displayedNewsCount={displayedNewsCount}
      />

      <main className="mx-auto max-w-[640px] px-4 pb-6 pt-6">
        <TabsNav active={tab} onChange={(next) => setParam("tab", next)} />

        {tab === "feed" ? (
          <>
            {hasNewsInDb ? (
              <FeedIntro
                totalNewsCount={totalNewsCount}
                displayedNewsCount={items.length}
              />
            ) : null}

            {hasNewsInDb ? (
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
            {loadState === "success" && !hasNewsInDb && (
              <FeedState variant="empty" />
            )}
            {loadState === "success" && hasNewsInDb && !hasFeedResults && (
              <FilterEmptyState
                message={getFilterEmptyMessage(teamId, playerId)}
              />
            )}

            {hasFeedResults ? (
              <ul className="flex flex-col gap-6">
                {items.map((item, index) => (
                  <li key={item.id}>
                    <NewsCard
                      item={item}
                      isLatest={index === 0 && !filterActive}
                      imagePriority={index === 0}
                      prefetchedImageUrl={
                        index === 0 ? heroImageUrl : undefined
                      }
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
