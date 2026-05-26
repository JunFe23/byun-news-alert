/** YYYY-MM-DD → 2026.05.22 */
export function formatContractDate(
  date: string | null | undefined,
): string {
  const trimmed = date?.trim();
  if (!trimmed || !/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return "-";
  }
  const [y, m, d] = trimmed.split("-");
  return `${y}.${m}.${d}`;
}

/** YYYY-MM-DD → 05.22 (전광판 최근 계약 등 짧은 표기) */
export function formatContractDateShort(
  date: string | null | undefined,
): string | null {
  const trimmed = date?.trim();
  if (!trimmed || !/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return null;
  }
  const [, m, d] = trimmed.split("-");
  return `${m}.${d}`;
}
