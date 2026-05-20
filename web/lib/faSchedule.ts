const KST = "Asia/Seoul";

type PhaseId =
  | "before_announcement"
  | "free_negotiation"
  | "intent_submission"
  | "renegotiation"
  | "ended";

export type FaScheduleStatus = {
  phaseId: PhaseId;
  phaseLabel: string;
  periodLabel: string;
  countdownLabel: string;
  /** D-3, D-Day, 종료, 협상 기간 종료 등 강조 숫자 */
  countdownShort: string;
  /** D-Day/D-n 앞의 설명 (예: 자율협상 종료까지) */
  countdownPrefix: string;
  nextScheduleLabel: string | null;
};

const PHASES = {
  announcement: "2026-05-18",
  freeNegotiationEnd: "2026-06-01",
  intentEnd: "2026-06-04",
  renegotiationEnd: "2026-06-08",
  marketEnd: "2026-06-09",
} as const;

export function getKstDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: KST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function daysUntilKst(fromIso: string, toIso: string): number {
  const fromMs = Date.parse(`${fromIso}T00:00:00+09:00`);
  const toMs = Date.parse(`${toIso}T00:00:00+09:00`);
  return Math.round((toMs - fromMs) / 86_400_000);
}

function formatPeriod(startIso: string, endIso: string): string {
  return `${formatShortDate(startIso)} ~ ${formatShortDate(endIso)}`;
}

function formatShortDate(iso: string): string {
  const [, month, day] = iso.split("-");
  return `${Number(month)}.${Number(day)}`;
}

function formatCountdown(daysLeft: number, prefix: string): string {
  if (daysLeft < 0) {
    return "종료";
  }
  if (daysLeft === 0) {
    return `${prefix} D-Day`;
  }
  return `${prefix} D-${daysLeft}`;
}

function splitCountdown(full: string): {
  countdownShort: string;
  countdownPrefix: string;
} {
  const match = full.match(/(D-Day|D-\d+)/);
  if (match) {
    return {
      countdownShort: match[1],
      countdownPrefix: full.replace(match[1], "").trim(),
    };
  }
  return { countdownShort: full, countdownPrefix: "" };
}

function withCountdown(
  base: Omit<FaScheduleStatus, "countdownShort" | "countdownPrefix">,
): FaScheduleStatus {
  const { countdownShort, countdownPrefix } = splitCountdown(base.countdownLabel);
  return { ...base, countdownShort, countdownPrefix };
}

export function getFaScheduleStatus(now: Date = new Date()): FaScheduleStatus {
  const today = getKstDateString(now);

  if (today < PHASES.announcement) {
    const daysLeft = daysUntilKst(today, PHASES.announcement);
    return withCountdown({
      phaseId: "before_announcement",
      phaseLabel: "FA 공시 전",
      periodLabel: `공시 ${formatShortDate(PHASES.announcement)}`,
      countdownLabel: formatCountdown(daysLeft, "공시까지"),
      nextScheduleLabel: `구단-선수 자율협상 ${formatPeriod(
        PHASES.announcement,
        PHASES.freeNegotiationEnd,
      )}`,
    });
  }

  if (today <= PHASES.freeNegotiationEnd) {
    const daysLeft = daysUntilKst(today, PHASES.freeNegotiationEnd);
    return withCountdown({
      phaseId: "free_negotiation",
      phaseLabel: "구단-선수 자율협상",
      periodLabel: formatPeriod(PHASES.announcement, PHASES.freeNegotiationEnd),
      countdownLabel: formatCountdown(daysLeft, "자율협상 종료까지"),
      nextScheduleLabel: `영입의향서 제출 ${formatPeriod(
        "2026-06-02",
        PHASES.intentEnd,
      )}`,
    });
  }

  if (today <= PHASES.intentEnd) {
    const daysLeft = daysUntilKst(today, PHASES.intentEnd);
    return withCountdown({
      phaseId: "intent_submission",
      phaseLabel: "영입의향서 제출",
      periodLabel: formatPeriod("2026-06-02", PHASES.intentEnd),
      countdownLabel: formatCountdown(daysLeft, "영입의향서 제출 마감까지"),
      nextScheduleLabel: `원소속구단 재협상 ${formatPeriod(
        "2026-06-05",
        PHASES.renegotiationEnd,
      )}`,
    });
  }

  if (today <= PHASES.renegotiationEnd) {
    const daysLeft = daysUntilKst(today, PHASES.renegotiationEnd);
    return withCountdown({
      phaseId: "renegotiation",
      phaseLabel: "원소속구단 재협상",
      periodLabel: formatPeriod("2026-06-05", PHASES.renegotiationEnd),
      countdownLabel: formatCountdown(daysLeft, "재협상 종료까지"),
      nextScheduleLabel: `FA 협상 종료 ${formatShortDate(PHASES.marketEnd)}`,
    });
  }

  return withCountdown({
    phaseId: "ended",
    phaseLabel: "FA 협상 기간 종료",
    periodLabel: `${formatShortDate(PHASES.announcement)} ~ ${formatShortDate(PHASES.renegotiationEnd)}`,
    countdownLabel: "협상 기간 종료",
    nextScheduleLabel: null,
  });
}
