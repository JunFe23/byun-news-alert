"use client";

import { useMemo } from "react";
import { getRecentContracts } from "@/lib/faRecentContracts";
import {
  formatContractDate,
  formatContractDateShort,
} from "@/lib/formatContractDate";
import {
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
    className:
      "border-white/20 bg-white/10 text-white/90 hover:bg-white/15",
    activeClassName: "border-white bg-white text-[#1a1a1a]",
  },
  {
    key: "FA",
    label: "FA",
    countKey: "FA",
    className:
      "border-brand-primary/40 bg-brand-primary/20 text-white hover:bg-brand-primary/30",
    activeClassName: "border-brand-accent bg-brand-accent text-[#1a1a1a]",
  },
  {
    key: "잔류",
    label: "잔류",
    countKey: "잔류",
    className:
      "border-emerald-400/30 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25",
    activeClassName: "border-emerald-300 bg-emerald-400 text-[#1a1a1a]",
  },
  {
    key: "이적",
    label: "이적",
    countKey: "이적",
    className:
      "border-sky-400/30 bg-sky-500/15 text-sky-100 hover:bg-sky-500/25",
    activeClassName: "border-sky-300 bg-sky-400 text-[#1a1a1a]",
  },
  {
    key: "계약미체결",
    label: "미체결",
    countKey: "계약미체결",
    className:
      "border-orange-400/30 bg-orange-500/15 text-orange-100 hover:bg-orange-500/25",
    activeClassName: "border-orange-300 bg-orange-400 text-[#1a1a1a]",
  },
  {
    key: "미정",
    label: "미정",
    countKey: "미정",
    className:
      "border-white/15 bg-white/5 text-white/70 hover:bg-white/10",
    activeClassName: "border-white/60 bg-white/80 text-[#1a1a1a]",
  },
];

export default function FaScoreboard({
  players,
  teams,
  statusFilter,
  onStatusFilterChange,
  onSelectPlayer,
}: {
  players: FaPlayer[];
  teams: FaTeam[];
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onSelectPlayer: (playerId: number) => void;
}) {
  const counts = useMemo(() => getStatusCounts(players, teams), [players, teams]);
  const schedule = useMemo(() => getFaScheduleStatus(), []);
  const recentContracts = useMemo(
    () => getRecentContracts(players, teams),
    [players, teams],
  );

  const activeStatKey: StatKey =
    statusFilter === "all" ||
    CONTRACT_STATUS_BUCKETS.includes(statusFilter as ContractStatusBucket)
      ? statusFilter === "all"
        ? "all"
        : (statusFilter as ContractStatusBucket)
      : "all";

  return (
    <section
      aria-label="FA 전광판"
      className="overflow-hidden rounded-2xl border-2 border-[#3d3d3d]/20 bg-gradient-to-br from-[#2a2226] via-[#352a30] to-brand-primary/90 text-white shadow-card"
    >
      <div className="border-b border-white/10 px-4 py-3.5 sm:px-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent">
          2026 KBL FA SCOREBOARD
        </p>
        <h2 className="mt-1 text-lg font-bold tracking-tight sm:text-xl">
          FA 전광판
        </h2>
        <p className="mt-1 text-[11px] text-white/65">
          2026 KBL FA 현황 · 실시간 계약 반영
        </p>
      </div>

      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-2 lg:gap-5">
        <div className="space-y-4">
          <div className="-mx-0.5 overflow-x-auto pb-0.5 [-webkit-overflow-scrolling:touch] lg:overflow-visible">
            <div className="grid w-full min-w-[min(100%,300px)] grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-1.5 lg:gap-2">
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
                      onStatusFilterChange(
                        item.key === "all" ? "all" : item.key,
                      )
                    }
                    className={`w-full min-w-0 rounded-lg border px-1.5 py-2 text-left transition sm:px-2 lg:flex lg:flex-col lg:items-center lg:justify-center lg:text-center ${
                      isActive ? item.activeClassName : item.className
                    }`}
                    aria-pressed={isActive}
                  >
                    <p className="text-[9px] font-semibold uppercase tracking-wide opacity-90 sm:whitespace-nowrap sm:tracking-normal lg:w-full">
                      {item.label}
                    </p>
                    <p className="mt-0.5 font-mono text-xl font-bold tabular-nums leading-none sm:text-2xl lg:mt-1 lg:flex lg:w-full lg:justify-center">
                      <span className="lg:inline-flex lg:min-w-[3ch] lg:justify-center lg:[font-variant-numeric:proportional-nums]">
                        {count}
                      </span>
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-white/15 bg-black/25 p-3.5 sm:p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium uppercase tracking-wide text-white/55">
                  현재 단계
                </p>
                <p className="mt-1 text-sm font-bold text-brand-accent sm:text-base">
                  {schedule.phaseLabel}
                </p>
                <p className="mt-1 text-[11px] text-white/70">
                  {schedule.periodLabel}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p
                  className={`text-[10px] font-medium ${
                    schedule.isCountdownUrgent
                      ? "text-red-300/90"
                      : "text-white/55"
                  }`}
                >
                  {schedule.countdownPrefix || "남은 기간"}
                </p>
                <p
                  className={`mt-0.5 font-mono text-2xl font-bold tabular-nums leading-none sm:text-3xl ${
                    schedule.isCountdownUrgent ? "text-red-400" : "text-white"
                  }`}
                >
                  {schedule.countdownShort}
                </p>
              </div>
            </div>
            {schedule.nextScheduleTitle ? (
              <div className="mt-3 border-t border-white/10 pt-3">
                <p className="text-[10px] font-medium uppercase tracking-wide text-white/50">
                  다음 일정
                </p>
                <p className="mt-1 text-[12px] font-semibold leading-snug text-white">
                  {schedule.nextScheduleTitle}
                  {schedule.nextSchedulePeriod ? (
                    <span className="ml-1.5 font-normal tabular-nums text-white/85">
                      {schedule.nextSchedulePeriod}
                    </span>
                  ) : null}
                </p>
                {schedule.nextScheduleDetail ? (
                  <p className="mt-1 text-[10px] leading-relaxed text-white/60">
                    {schedule.nextScheduleDetail}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex min-h-0 flex-col rounded-xl border border-white/15 bg-black/20">
          <div className="border-b border-white/10 px-3.5 py-2.5 sm:px-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-accent">
              RECENT
            </p>
            <h3 className="text-sm font-bold">최근 계약</h3>
            <p className="text-[10px] text-white/55">
              계약일 기준 최신 5명
            </p>
          </div>
          {recentContracts.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-white/50">
              등록된 계약일이 있는 선수가 없습니다.
            </p>
          ) : (
            <ul className="divide-y divide-white/10">
              {recentContracts.map((entry) => (
                <li key={entry.playerId}>
                  <button
                    type="button"
                    onClick={() => onSelectPlayer(entry.playerId)}
                    className="group w-full px-3.5 py-3 text-left transition hover:bg-white/10 sm:px-4"
                  >
                    <p className="text-[14px] font-semibold leading-tight text-white group-hover:text-brand-accent">
                      {entry.playerName}
                    </p>
                    <p className="mt-1 text-[12px] leading-snug text-white/75 group-hover:text-white/90">
                      {entry.detailParts.map((part, index) => (
                        <span
                          key={index}
                          className={
                            part.nowrap ? "whitespace-nowrap" : undefined
                          }
                        >
                          {part.text}
                        </span>
                      ))}
                      <span className="whitespace-nowrap">
                        <span className="lg:hidden">
                          {" · "}
                          {formatContractDateShort(entry.contractDate)} 계약
                        </span>
                        <span className="hidden lg:inline">
                          {" · "}
                          {formatContractDate(entry.contractDate)} 계약
                        </span>
                      </span>
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
