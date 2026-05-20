const KST = "Asia/Seoul";

const KST_OPTIONS: Intl.DateTimeFormatOptions = {
  timeZone: KST,
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
};

/** 카드 메타 등 — 2026년 5월 20일 13:42 */
export function formatKstDateTime(value: string | null | undefined): string {
  const date = parseDate(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat("ko-KR", KST_OPTIONS).format(date);
}

/** 헤더 상태 바 — 2026.05.20 13:42 */
export function formatKstCompact(value: string | null | undefined): string {
  const date = parseDate(value);
  if (!date) return "—";

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: KST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return `${get("year")}.${get("month")}.${get("day")} ${get("hour")}:${get("minute")}`;
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
