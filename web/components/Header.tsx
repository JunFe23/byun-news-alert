"use client";

import FaRadarMark from "@/components/FaRadarMark";
import { formatKstCompact } from "@/lib/formatDate";

type LoadState = "loading" | "success" | "error";

interface HeaderProps {
  loadNews: () => Promise<void>;
  loadState: LoadState;
  lastUpdated: string | null;
  newsCount?: number;
}

export default function Header({
  loadNews,
  loadState,
  lastUpdated,
  newsCount,
}: HeaderProps) {
  const isRefreshing = loadState === "loading";

  return (
    <header className="sticky top-0 z-20 border-b border-brand-border/80 bg-brand-bg/80 backdrop-blur-sm supports-[backdrop-filter]:bg-brand-bg/70">
      <div
        className="h-px bg-gradient-to-r from-transparent via-brand-primary/35 to-transparent"
        aria-hidden
      />
      <div className="mx-auto max-w-[640px] px-4 pb-3.5 pt-4">
        <HeaderRow loadNews={loadNews} isRefreshing={isRefreshing} />
        <StatusBar
          loadState={loadState}
          lastUpdated={lastUpdated}
          newsCount={newsCount}
          isRefreshing={isRefreshing}
        />
      </div>
    </header>
  );
}

function HeaderRow({
  loadNews,
  isRefreshing,
}: {
  loadNews: () => Promise<void>;
  isRefreshing: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-label text-brand-primary">
          KBL FREE AGENCY WATCH
        </p>
        <h1 className="mt-2 text-[1.4rem] font-semibold leading-[1.2] tracking-tight text-[#1a1a1a]">
          2026 KBL FA 레이더
        </h1>
        <p className="mt-2 max-w-[20rem] text-[13px] leading-[1.55] text-brand-muted sm:max-w-none">
          FA 시장의 흐름을 팀별·선수별로 모아보는 KBL 뉴스 피드
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2.5 pt-0.5">
        <FaRadarMark />
        <button
          type="button"
          onClick={() => void loadNews()}
          disabled={isRefreshing}
          aria-label="새로고침"
          className="text-[11px] font-medium text-brand-muted underline-offset-2 transition hover:text-brand-primary hover:underline disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isRefreshing ? "불러오는 중…" : "새로고침"}
        </button>
      </div>
    </div>
  );
}

function StatusBar({
  loadState,
  lastUpdated,
  newsCount,
  isRefreshing,
}: {
  loadState: LoadState;
  lastUpdated: string | null;
  newsCount?: number;
  isRefreshing: boolean;
}) {
  const showMeta =
    (lastUpdated && loadState === "success") ||
    newsCount !== undefined ||
    isRefreshing;

  if (!showMeta) return null;

  return (
    <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-brand-border-subtle/80 pt-3">
      {isRefreshing ? (
        <span className="flex items-center gap-1.5 text-[11px] text-brand-muted">
          <Spinner />
          피드를 갱신하는 중
        </span>
      ) : null}
      {loadState === "success" && lastUpdated ? (
        <span className="text-[11px] text-brand-muted">
          마지막 감지{" "}
          <time className="font-medium text-[#3d3d3d]">
            {formatKstCompact(lastUpdated)}
          </time>
        </span>
      ) : null}
      {loadState === "success" && newsCount !== undefined ? (
        <span className="text-[11px] text-brand-muted">
          <span className="font-medium text-brand-primary">{newsCount}</span>
          건 수집됨
        </span>
      ) : null}
    </div>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block h-2.5 w-2.5 animate-spin rounded-full border border-brand-border border-t-brand-primary"
      aria-hidden
    />
  );
}
