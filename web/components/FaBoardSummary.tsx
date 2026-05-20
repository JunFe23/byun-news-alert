"use client";

import { useMemo } from "react";
import {
  buildStatusSummaryLine,
  CONTRACT_STATUS_BUCKETS,
  getStatusCounts,
  type ContractStatusBucket,
} from "@/lib/faPlayerStatus";
import { getFaScheduleStatus } from "@/lib/faSchedule";
import type { FaPlayer, FaTeam } from "@/lib/types";

type StatKey = "all" | ContractStatusBucket;

const STAT_ITEMS: {
  key: StatKey;
  label: string;
  countKey: keyof ReturnType<typeof getStatusCounts> | "total";
  className: string;
  activeClassName: string;
}[] = [
  {
    key: "all",
    label: "전체",
    countKey: "total",
    className: "border-[#d8d4cf] bg-white text-[#333]",
    activeClassName: "border-[#3d3d3d] bg-[#3d3d3d] text-white",
  },
  {
    key: "FA",
    label: "FA",
    countKey: "FA",
    className: "border-brand-primary/20 bg-brand-primary/[0.06] text-brand-primary",
    activeClassName: "border-brand-primary bg-brand-primary text-white",
  },
  {
    key: "잔류",
    label: "잔류",
    countKey: "잔류",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    activeClassName: "border-emerald-600 bg-emerald-600 text-white",
  },
  {
    key: "이적",
    label: "이적",
    countKey: "이적",
    className: "border-sky-200 bg-sky-50 text-sky-800",
    activeClassName: "border-sky-600 bg-sky-600 text-white",
  },
  {
    key: "계약미체결",
    label: "미체결",
    countKey: "계약미체결",
    className: "border-orange-200 bg-orange-50 text-orange-800",
    activeClassName: "border-orange-600 bg-orange-600 text-white",
  },
  {
    key: "미정",
    label: "미정",
    countKey: "미정",
    className: "border-brand-border bg-brand-cream text-brand-muted",
    activeClassName: "border-[#6b6560] bg-[#6b6560] text-white",
  },
];

export default function FaBoardSummary({
  players,
  teams,
  statusFilter,
  onStatusFilterChange,
}: {
  players: FaPlayer[];
  teams: FaTeam[];
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
}) {
  const counts = useMemo(() => getStatusCounts(players, teams), [players, teams]);
  const schedule = useMemo(() => getFaScheduleStatus(), []);

  const activeStatKey: StatKey =
    statusFilter === "all" ||
    CONTRACT_STATUS_BUCKETS.includes(statusFilter as ContractStatusBucket)
      ? statusFilter === "all"
        ? "all"
        : (statusFilter as ContractStatusBucket)
      : "all";

  return (
    <section
      aria-label="FA 진행 현황"
      className="rounded-2xl border border-brand-border/80 bg-brand-surface/95 p-4 shadow-card backdrop-blur-sm"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-label text-brand-primary">
            2026 KBL FA
          </p>
          <h2 className="mt-1 text-[15px] font-semibold text-[#1a1a1a]">
            FA 진행 현황
          </h2>
        </div>
        <p className="text-[10px] text-brand-muted">전체 FA 기준</p>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-brand-muted">
        {buildStatusSummaryLine(counts)}
      </p>

      <div className="-mx-1 mt-3 overflow-x-auto px-1 pb-0.5 [-webkit-overflow-scrolling:touch]">
        <div className="grid min-w-[min(100%,320px)] grid-cols-3 gap-2 sm:min-w-0 sm:grid-cols-6">
          {STAT_ITEMS.map((item) => {
            const count = counts[item.countKey];
            const isActive =
              item.key === "all"
                ? activeStatKey === "all"
                : activeStatKey === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() =>
                  onStatusFilterChange(item.key === "all" ? "all" : item.key)
                }
                className={`rounded-xl border px-2 py-2.5 text-left transition ${
                  isActive ? item.activeClassName : item.className
                }`}
                aria-pressed={isActive}
              >
                <p className="text-[10px] font-medium opacity-90">{item.label}</p>
                <p className="mt-0.5 text-lg font-bold tabular-nums leading-none">
                  {count}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-brand-primary/20 bg-brand-primary/[0.05] p-3.5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium text-brand-muted">현재 단계</p>
            <p className="mt-0.5 text-sm font-semibold text-brand-primary">
              {schedule.phaseLabel}
            </p>
            <p className="mt-1 text-[11px] text-brand-muted">
              기간 {schedule.periodLabel}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] font-medium text-brand-muted">남은 기간</p>
            <p className="mt-0.5 text-xl font-bold tabular-nums leading-none text-brand-primary">
              {schedule.countdownShort}
            </p>
            {schedule.countdownPrefix ? (
              <p className="mt-1 max-w-[9rem] text-[10px] leading-snug text-brand-muted">
                {schedule.countdownPrefix}
              </p>
            ) : null}
          </div>
        </div>
        {schedule.nextScheduleLabel ? (
          <p className="mt-3 border-t border-brand-primary/10 pt-3 text-[11px] text-brand-muted">
            다음 일정:{" "}
            <span className="font-medium text-[#333]">
              {schedule.nextScheduleLabel}
            </span>
          </p>
        ) : null}
      </div>
    </section>
  );
}
