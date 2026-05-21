/** fa_players.contract_amount (원) → 한국식 금액 문자열 */
export function formatContractAmount(
  amount: number | string | null | undefined,
): string {
  if (amount === null || amount === undefined || amount === "") {
    return "-";
  }

  const n = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(n) || n <= 0) {
    return "-";
  }

  const eok = Math.floor(n / 100_000_000);
  const remainder = n % 100_000_000;
  const man = remainder / 10_000;

  if (eok > 0 && remainder > 0) {
    return `${eok}억 ${man.toLocaleString("ko-KR")}만`;
  }
  if (eok > 0) {
    return `${eok}억`;
  }
  return `${man.toLocaleString("ko-KR")}만`;
}
