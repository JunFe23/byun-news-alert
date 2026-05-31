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
  /** 현재 단계 마감까지 남은 일수 (해당 없으면 null) */
  daysLeft: number | null;
  /** D-1·D-Day 등 임박 시 true — 전광판 강조색 */
  isCountdownUrgent: boolean;
  /** @deprecated nextScheduleTitle + nextSchedulePeriod 사용 */
  nextScheduleLabel: string | null;
  nextScheduleTitle: string | null;
  nextSchedulePeriod: string | null;
  /** 다음 일정 한 줄 부가 설명 (선택) */
  nextScheduleDetail: string | null;
};

const PHASES = {
  announcement: "2026-05-18",
  freeNegotiationEnd: "2026-06-01",
  intentStart: "2026-06-02",
  intentEnd: "2026-06-04",
  renegotiationStart: "2026-06-05",
  renegotiationEnd: "2026-06-08",
  marketEnd: "2026-06-09",
} as const;

type NextSchedule = {
  title: string;
  period: string;
  detail: string | null;
};

function buildNextSchedule(
  title: string,
  period: string,
  detail: string | null = null,
): NextSchedule {
  return { title, period, detail };
}

function toNextScheduleFields(next: NextSchedule | null): {
  nextScheduleLabel: string | null;
  nextScheduleTitle: string | null;
  nextSchedulePeriod: string | null;
  nextScheduleDetail: string | null;
} {
  if (!next) {
    return {
      nextScheduleLabel: null,
      nextScheduleTitle: null,
      nextSchedulePeriod: null,
      nextScheduleDetail: null,
    };
  }
  return {
    nextScheduleLabel: `${next.title} ${next.period}`,
    nextScheduleTitle: next.title,
    nextSchedulePeriod: next.period,
    nextScheduleDetail: next.detail,
  };
}

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
  base: Omit<
    FaScheduleStatus,
    | "countdownShort"
    | "countdownPrefix"
    | "daysLeft"
    | "isCountdownUrgent"
    | "nextScheduleLabel"
    | "nextScheduleTitle"
    | "nextSchedulePeriod"
    | "nextScheduleDetail"
  > & { nextSchedule: NextSchedule | null },
  daysLeft: number | null,
): FaScheduleStatus {
  const { countdownShort, countdownPrefix } = splitCountdown(base.countdownLabel);
  const nextFields = toNextScheduleFields(base.nextSchedule);
  const isCountdownUrgent =
    daysLeft !== null && daysLeft >= 0 && daysLeft <= 1;

  const { nextSchedule: _next, ...rest } = base;

  return {
    ...rest,
    countdownShort,
    countdownPrefix,
    daysLeft,
    isCountdownUrgent,
    ...nextFields,
  };
}

export function getFaScheduleStatus(now: Date = new Date()): FaScheduleStatus {
  const today = getKstDateString(now);

  if (today < PHASES.announcement) {
    const daysLeft = daysUntilKst(today, PHASES.announcement);
    return withCountdown(
      {
        phaseId: "before_announcement",
        phaseLabel: "FA 공시 전",
        periodLabel: `공시 ${formatShortDate(PHASES.announcement)}`,
        countdownLabel: formatCountdown(daysLeft, "공시까지"),
        nextSchedule: buildNextSchedule(
          "구단-선수 자율협상",
          formatPeriod(PHASES.announcement, PHASES.freeNegotiationEnd),
          "FA 공시 후 구단·선수 간 자율 협상 기간",
        ),
      },
      daysLeft,
    );
  }

  if (today <= PHASES.freeNegotiationEnd) {
    const daysLeft = daysUntilKst(today, PHASES.freeNegotiationEnd);
    return withCountdown(
      {
        phaseId: "free_negotiation",
        phaseLabel: "구단-선수 자율협상",
        periodLabel: formatPeriod(PHASES.announcement, PHASES.freeNegotiationEnd),
        countdownLabel: formatCountdown(daysLeft, "자율협상 종료까지"),
        nextSchedule: buildNextSchedule(
          "영입의향서 제출",
          formatPeriod(PHASES.intentStart, PHASES.intentEnd),
          "FA 선수 영입을 희망하는 구단, 영입의향서 제출",
        ),
      },
      daysLeft,
    );
  }

  if (today <= PHASES.intentEnd) {
    const daysLeft = daysUntilKst(today, PHASES.intentEnd);
    return withCountdown(
      {
        phaseId: "intent_submission",
        phaseLabel: "영입의향서 제출",
        periodLabel: formatPeriod(PHASES.intentStart, PHASES.intentEnd),
        countdownLabel: formatCountdown(daysLeft, "영입의향서 제출 마감까지"),
        nextSchedule: buildNextSchedule(
          "원소속구단 재협상",
          formatPeriod(PHASES.renegotiationStart, PHASES.renegotiationEnd),
          "영입의향서 미제출 FA, 원소속 구단과 재협상",
        ),
      },
      daysLeft,
    );
  }

  if (today <= PHASES.renegotiationEnd) {
    const daysLeft = daysUntilKst(today, PHASES.renegotiationEnd);
    return withCountdown(
      {
        phaseId: "renegotiation",
        phaseLabel: "원소속구단 재협상",
        periodLabel: formatPeriod(PHASES.renegotiationStart, PHASES.renegotiationEnd),
        countdownLabel: formatCountdown(daysLeft, "재협상 종료까지"),
        nextSchedule: buildNextSchedule(
          "FA 협상 종료",
          formatShortDate(PHASES.marketEnd),
          "2026 KBL FA 시장 공식 종료",
        ),
      },
      daysLeft,
    );
  }

  return withCountdown(
    {
      phaseId: "ended",
      phaseLabel: "FA 협상 기간 종료",
      periodLabel: `${formatShortDate(PHASES.announcement)} ~ ${formatShortDate(PHASES.renegotiationEnd)}`,
      countdownLabel: "협상 기간 종료",
      nextSchedule: null,
    },
    null,
  );
}
