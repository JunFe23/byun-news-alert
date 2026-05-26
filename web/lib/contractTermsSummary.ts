import { formatContractAmount } from "@/lib/formatContractAmount";
import { formatContractYears } from "@/lib/formatContractYears";
import type { FaPlayer } from "@/lib/types";

/** 계약기간·금액 요약 (둘 다 없으면 조건 미공개) */
export function formatContractTermsSummary(player: FaPlayer): string {
  const hasYears =
    player.contract_years != null &&
    Number.isFinite(player.contract_years) &&
    player.contract_years > 0;
  const hasAmount =
    player.contract_amount != null &&
    Number.isFinite(player.contract_amount) &&
    player.contract_amount > 0;

  if (!hasYears && !hasAmount) {
    return "조건 미공개";
  }

  const parts: string[] = [];
  if (hasYears) {
    const yearsLabel = formatContractYears(player.contract_years);
    if (yearsLabel !== "-") {
      parts.push(yearsLabel);
    }
  }
  if (hasAmount) {
    const amountLabel = formatContractAmount(player.contract_amount);
    if (amountLabel !== "-") {
      parts.push(amountLabel);
    }
  }

  return parts.length > 0 ? parts.join(" · ") : "조건 미공개";
}

/** 전광판 등 UI용 — 금액 구간만 nowrap 적용 */
export function buildContractTermsParts(
  player: FaPlayer,
): { text: string; nowrap?: boolean }[] {
  const hasYears =
    player.contract_years != null &&
    Number.isFinite(player.contract_years) &&
    player.contract_years > 0;
  const hasAmount =
    player.contract_amount != null &&
    Number.isFinite(player.contract_amount) &&
    player.contract_amount > 0;

  if (!hasYears && !hasAmount) {
    return [{ text: "조건 미공개" }];
  }

  const parts: { text: string; nowrap?: boolean }[] = [];
  if (hasYears) {
    const yearsLabel = formatContractYears(player.contract_years);
    if (yearsLabel !== "-") {
      if (parts.length > 0) {
        parts.push({ text: " · " });
      }
      parts.push({ text: yearsLabel });
    }
  }
  if (hasAmount) {
    const amountLabel = formatContractAmount(player.contract_amount);
    if (amountLabel !== "-") {
      if (parts.length > 0) {
        parts.push({ text: " · " });
      }
      parts.push({ text: amountLabel, nowrap: true });
    }
  }

  return parts.length > 0 ? parts : [{ text: "조건 미공개" }];
}
