/** 계약금액 UI 표시용 — DB 저장은 number | null */
export function formatAmountComma(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount) || amount < 0) {
    return "";
  }
  return amount.toLocaleString("ko-KR");
}

/** 입력 문자열에서 숫자만 추출. 빈 값이면 null */
export function parseAmountInput(raw: string): number | null {
  const digits = raw.replace(/\D/g, "");
  if (digits === "") {
    return null;
  }
  const n = Number(digits);
  if (!Number.isFinite(n) || n < 0) {
    return null;
  }
  return n;
}
