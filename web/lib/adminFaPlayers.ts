export const ADMIN_CONTRACT_STATUS_OPTIONS = [
  "FA",
  "잔류",
  "이적",
  "계약미체결",
  "은퇴",
] as const;

export type AdminContractStatus =
  (typeof ADMIN_CONTRACT_STATUS_OPTIONS)[number];

const MAX_CONTRACT_NOTE_LENGTH = 500;
const MAX_CONTRACT_STATUS_LENGTH = 32;

export type AdminFaPlayerUpdateFields = {
  contract_status: AdminContractStatus;
  new_team_id: number | null;
  contract_years: number | null;
  contract_amount: number | null;
  contract_date: string | null;
  contract_note: string | null;
};

type ParseResult =
  | { ok: true; data: AdminFaPlayerUpdateFields }
  | { ok: false; error: string };

function isAdminContractStatus(value: string): value is AdminContractStatus {
  return (ADMIN_CONTRACT_STATUS_OPTIONS as readonly string[]).includes(value);
}

function parseNullableTeamId(value: unknown): number | null | undefined {
  if (value === null || value === "" || value === "none") {
    return null;
  }
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }
  if (typeof value === "string" && /^\d+$/.test(value)) {
    const n = Number(value);
    return n > 0 ? n : undefined;
  }
  return undefined;
}

function parseNullableContractYears(value: unknown): number | null | undefined {
  if (value === null || value === "") {
    return null;
  }
  if (typeof value === "number" && Number.isInteger(value)) {
    return value > 0 ? value : null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") {
      return null;
    }
    if (!/^\d+$/.test(trimmed)) {
      return undefined;
    }
    const n = Number.parseInt(trimmed, 10);
    return n > 0 ? n : null;
  }
  return undefined;
}

function parseNullableAmount(value: unknown): number | null | undefined {
  if (value === null || value === "") {
    return null;
  }
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n) && n >= 0) {
      return n;
    }
  }
  return undefined;
}

function parseNullableContractDate(value: unknown): string | null | undefined {
  if (value === null || value === "") {
    return null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") {
      return null;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
  }
  return undefined;
}

function parseContractNote(value: unknown): string | null | undefined {
  if (value === null || value === "") {
    return null;
  }
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length > MAX_CONTRACT_NOTE_LENGTH) {
    return undefined;
  }
  return trimmed.length === 0 ? null : trimmed;
}

/** PATCH body에서 업데이트 가능 필드만 추출 (adminPassword 제외). */
export function parseAdminFaPlayerUpdateBody(body: unknown): ParseResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Invalid request body" };
  }

  const record = body as Record<string, unknown>;

  if (typeof record.contract_status !== "string") {
    return { ok: false, error: "contract_status is required" };
  }

  const statusTrimmed = record.contract_status.trim();
  if (
    statusTrimmed.length === 0 ||
    statusTrimmed.length > MAX_CONTRACT_STATUS_LENGTH
  ) {
    return { ok: false, error: "Invalid contract_status" };
  }

  if (!isAdminContractStatus(statusTrimmed)) {
    return { ok: false, error: "Invalid contract_status value" };
  }

  const newTeamId = parseNullableTeamId(record.new_team_id);
  if (newTeamId === undefined) {
    return { ok: false, error: "Invalid new_team_id" };
  }

  const contractYears = parseNullableContractYears(record.contract_years);
  if (contractYears === undefined) {
    return { ok: false, error: "Invalid contract_years" };
  }

  const contractAmount = parseNullableAmount(record.contract_amount);
  if (contractAmount === undefined) {
    return { ok: false, error: "Invalid contract_amount" };
  }

  const contractDate = parseNullableContractDate(record.contract_date);
  if (contractDate === undefined) {
    return { ok: false, error: "Invalid contract_date" };
  }

  const contractNote = parseContractNote(record.contract_note);
  if (contractNote === undefined) {
    return { ok: false, error: "Invalid contract_note" };
  }

  return {
    ok: true,
    data: {
      contract_status: statusTrimmed,
      new_team_id: newTeamId,
      contract_years: contractYears,
      contract_amount: contractAmount,
      contract_date: contractDate,
      contract_note: contractNote,
    },
  };
}

export function verifyAdminPassword(body: unknown): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || expected.length === 0) {
    return false;
  }
  if (typeof body !== "object" || body === null) {
    return false;
  }
  const password = (body as Record<string, unknown>).adminPassword;
  return typeof password === "string" && password === expected;
}
