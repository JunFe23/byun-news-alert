/** fa_players.contract_years → 현황판 표시 문자열 */
export function formatContractYears(
  years: number | null | undefined,
): string {
  if (years == null || !Number.isFinite(years) || years <= 0) {
    return "-";
  }
  return `${Math.trunc(years)}년`;
}
