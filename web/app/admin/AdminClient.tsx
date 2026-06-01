"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  ADMIN_CONTRACT_STATUS_OPTIONS,
  type AdminContractStatus,
} from "@/lib/adminFaPlayers";
import {
  formatAmountComma,
  parseAmountInput,
} from "@/lib/formatAmountInput";
import { formatContractAmount } from "@/lib/formatContractAmount";
import { formatContractYears } from "@/lib/formatContractYears";
import {
  buildStatusFilterOptions,
  sortPlayersByContractDate,
  sortTeamsForFilter,
} from "@/lib/filterSort";
import { formatContractDate } from "@/lib/formatContractDate";
import { normalizeContractStatus } from "@/lib/faPlayerStatus";
import { fetchFaPlayers, fetchFaTeams } from "@/lib/supabase";
import type { FaPlayer, FaTeam } from "@/lib/types";

const SESSION_KEY = "kbl-fa-admin-password";

type StatusFilterId =
  | "all"
  | "FA"
  | "잔류"
  | "이적"
  | "계약미체결"
  | "은퇴";

const SAVE_FEEDBACK_MS = 5000;

type SaveFeedback = {
  kind: "success" | "error";
  message: string;
};

function initialContractStatus(
  value: string | null | undefined,
): AdminContractStatus {
  const trimmed = value?.trim() ?? "";
  if (
    (ADMIN_CONTRACT_STATUS_OPTIONS as readonly string[]).includes(trimmed)
  ) {
    return trimmed as AdminContractStatus;
  }
  return "FA";
}

function initialContractYearsInput(years: number | null | undefined): string {
  if (years == null || !Number.isFinite(years) || years <= 0) {
    return "";
  }
  return String(Math.trunc(years));
}

/** 빈 값 → null, 양의 정수 → number, 그 외 비어 있지 않으면 invalid */
function parseContractYearsInput(
  input: string,
): { ok: true; value: number | null } | { ok: false } {
  const trimmed = input.trim();
  if (trimmed === "") {
    return { ok: true, value: null };
  }
  if (!/^\d+$/.test(trimmed)) {
    return { ok: false };
  }
  const n = Number.parseInt(trimmed, 10);
  if (n <= 0) {
    return { ok: true, value: null };
  }
  return { ok: true, value: n };
}

function PlayerAdminCard({
  player,
  teams,
  teamById,
  adminPassword,
  onSaved,
}: {
  player: FaPlayer;
  teams: FaTeam[];
  teamById: Map<number, FaTeam>;
  adminPassword: string;
  onSaved: () => void;
}) {
  const originTeam = teamById.get(player.team_id);
  const [contractStatus, setContractStatus] = useState<AdminContractStatus>(
    () => initialContractStatus(player.contract_status),
  );
  const [newTeamId, setNewTeamId] = useState<string>(
    player.new_team_id != null ? String(player.new_team_id) : "",
  );
  const [contractAmountValue, setContractAmountValue] = useState<number | null>(
    () => player.contract_amount ?? null,
  );
  const [amountDisplay, setAmountDisplay] = useState(() =>
    formatAmountComma(player.contract_amount),
  );
  const [contractYearsInput, setContractYearsInput] = useState(() =>
    initialContractYearsInput(player.contract_years),
  );
  const [contractDate, setContractDate] = useState(
    () => player.contract_date?.trim() ?? "",
  );
  const [contractNote, setContractNote] = useState(player.contract_note ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<SaveFeedback | null>(null);
  const feedbackGenRef = useRef(0);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearFeedbackTimer = useCallback(() => {
    if (feedbackTimeoutRef.current != null) {
      clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }
  }, []);

  const showFeedback = useCallback(
    (kind: SaveFeedback["kind"], message: string) => {
      clearFeedbackTimer();
      const gen = ++feedbackGenRef.current;
      setFeedback({ kind, message });
      feedbackTimeoutRef.current = setTimeout(() => {
        if (feedbackGenRef.current === gen) {
          setFeedback(null);
          feedbackTimeoutRef.current = null;
        }
      }, SAVE_FEEDBACK_MS);
    },
    [clearFeedbackTimer],
  );

  useEffect(() => {
    return () => {
      clearFeedbackTimer();
    };
  }, [clearFeedbackTimer]);

  useEffect(() => {
    setContractStatus(initialContractStatus(player.contract_status));
    setNewTeamId(
      player.new_team_id != null ? String(player.new_team_id) : "",
    );
    const amount = player.contract_amount ?? null;
    setContractAmountValue(amount);
    setAmountDisplay(formatAmountComma(amount));
    setContractYearsInput(initialContractYearsInput(player.contract_years));
    setContractDate(player.contract_date?.trim() ?? "");
    setContractNote(player.contract_note ?? "");
  }, [
    player.id,
    player.contract_status,
    player.new_team_id,
    player.contract_amount,
    player.contract_years,
    player.contract_date,
    player.contract_note,
  ]);

  const handleAmountChange = (raw: string) => {
    const parsed = parseAmountInput(raw);
    setContractAmountValue(parsed);
    setAmountDisplay(parsed == null ? "" : formatAmountComma(parsed));
  };

  const displayBucket = normalizeContractStatus(
    player.contract_status,
    originTeam,
  );
  const newTeamLabel =
    player.new_team_id != null
      ? (teamById.get(player.new_team_id)?.short_name ?? "—")
      : "—";

  const handleSave = async () => {
    setIsSaving(true);
    clearFeedbackTimer();
    setFeedback(null);

    const parsedAmount = contractAmountValue;
    const parsedYears = parseContractYearsInput(contractYearsInput);
    if (!parsedYears.ok) {
      showFeedback("error", "저장 실패");
      setIsSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/admin/fa-players/${player.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminPassword,
          contract_status: contractStatus,
          new_team_id: newTeamId === "" ? null : Number(newTeamId),
          contract_years: parsedYears.value,
          contract_amount: parsedAmount,
          contract_date: contractDate.trim() === "" ? null : contractDate.trim(),
          contract_note: contractNote.trim() === "" ? null : contractNote.trim(),
        }),
      });

      if (!res.ok) {
        showFeedback("error", "저장 실패");
        return;
      }

      showFeedback("success", "반영 완료");
      onSaved();
    } catch {
      showFeedback("error", "저장 실패");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <article className="rounded-2xl border border-brand-border/80 bg-brand-surface p-4 shadow-card">
      <header className="mb-3 border-b border-brand-border/60 pb-3">
        <p className="text-xs text-brand-text-muted">
          {originTeam?.short_name ?? "팀 미상"}
        </p>
        <h2 className="text-lg font-semibold text-brand-text">
          {player.player_name}
        </h2>
        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-brand-text-muted">
          <div>
            <dt className="inline">현재 상태 </dt>
            <dd className="inline font-medium text-brand-text">
              {player.status?.trim() || "—"}
            </dd>
          </div>
          <div>
            <dt className="inline">계약 상태 </dt>
            <dd className="inline font-medium text-brand-text">
              {displayBucket}
            </dd>
          </div>
          <div>
            <dt className="inline">계약팀 </dt>
            <dd className="inline font-medium text-brand-text">
              {newTeamLabel}
            </dd>
          </div>
          <div>
            <dt className="inline">계약기간 </dt>
            <dd className="inline font-medium text-brand-text">
              {formatContractYears(player.contract_years)}
            </dd>
          </div>
          <div>
            <dt className="inline">계약금액 </dt>
            <dd className="inline font-medium text-brand-text">
              {formatContractAmount(player.contract_amount)}
            </dd>
          </div>
          <div>
            <dt className="inline">계약일자 </dt>
            <dd className="inline font-medium text-brand-text">
              {formatContractDate(player.contract_date)}
            </dd>
          </div>
        </dl>
        {player.contract_note ? (
          <p className="mt-2 text-xs text-brand-text-muted">
            메모: {player.contract_note}
          </p>
        ) : null}
      </header>

      <div className="space-y-3">
        <label className="block text-sm">
          <span className="mb-1 block text-brand-text-muted">계약 상태</span>
          <select
            className="w-full rounded-xl border border-brand-border bg-white px-3 py-2 text-sm"
            value={contractStatus}
            onChange={(e) =>
              setContractStatus(e.target.value as AdminContractStatus)
            }
          >
            {ADMIN_CONTRACT_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-brand-text-muted">계약팀</span>
          <select
            className="w-full rounded-xl border border-brand-border bg-white px-3 py-2 text-sm"
            value={newTeamId}
            onChange={(e) => setNewTeamId(e.target.value)}
          >
            <option value="">없음</option>
            {teams.map((t) => (
              <option key={t.id} value={String(t.id)}>
                {t.short_name} ({t.team_name})
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-brand-text-muted">계약년수</span>
            <div className="relative">
              <input
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                autoComplete="off"
                placeholder="2"
                className="w-full rounded-xl border border-brand-border bg-white py-2 pl-3 pr-9 text-sm"
                value={contractYearsInput}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") {
                    setContractYearsInput("");
                    return;
                  }
                  if (/^\d+$/.test(v)) {
                    setContractYearsInput(v);
                  }
                }}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-brand-text-muted">
                년
              </span>
            </div>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-brand-text-muted">
              계약금액 (원)
            </span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="예: 600,000,000"
              className="w-full rounded-xl border border-brand-border bg-white px-3 py-2 text-sm"
              value={amountDisplay}
              onChange={(e) => handleAmountChange(e.target.value)}
            />
          </label>

          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-brand-text-muted">계약일자</span>
            <input
              type="date"
              className="w-full rounded-xl border border-brand-border bg-white px-3 py-2 text-sm"
              value={contractDate}
              onChange={(e) => setContractDate(e.target.value)}
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block text-brand-text-muted">메모</span>
          <textarea
            rows={2}
            placeholder='예: "3년 6억", "보수총액 2억"'
            className="w-full resize-y rounded-xl border border-brand-border bg-white px-3 py-2 text-sm"
            value={contractNote}
            onChange={(e) => setContractNote(e.target.value)}
          />
        </label>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="rounded-xl bg-brand-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-primary-dark disabled:opacity-60"
          >
            {isSaving ? "저장 중…" : "저장"}
          </button>
          {feedback?.kind === "success" ? (
            <span className="text-sm font-medium text-emerald-700">
              {feedback.message}
            </span>
          ) : null}
          {feedback?.kind === "error" ? (
            <span className="text-sm font-medium text-red-700">
              {feedback.message}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default function AdminClient() {
  const router = useRouter();
  const [adminPassword, setAdminPassword] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const [teams, setTeams] = useState<FaTeam[]>([]);
  const [players, setPlayers] = useState<FaPlayer[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilterId>("all");

  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? sessionStorage.getItem(SESSION_KEY)
        : null;
    if (stored) {
      setAdminPassword(stored);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoadingData(true);
    setLoadError(null);
    try {
      const [teamsData, playersData] = await Promise.all([
        fetchFaTeams(),
        fetchFaPlayers(),
      ]);
      setTeams(sortTeamsForFilter(teamsData));
      setPlayers(sortPlayersByContractDate(playersData));
    } catch {
      setLoadError("데이터를 불러오지 못했습니다.");
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (adminPassword) {
      void loadData();
    }
  }, [adminPassword, loadData]);

  const teamById = useMemo(
    () => new Map(teams.map((t) => [t.id, t])),
    [teams],
  );

  const statusOptions = useMemo(() => buildStatusFilterOptions(), []);

  const filteredPlayers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return players.filter((p) => {
      if (q && !p.player_name.toLowerCase().includes(q)) {
        return false;
      }
      if (teamFilter !== "all" && String(p.team_id) !== teamFilter) {
        return false;
      }
      if (statusFilter !== "all") {
        const team = teamById.get(p.team_id);
        const bucket = normalizeContractStatus(p.contract_status, team);
        if (bucket !== statusFilter) {
          return false;
        }
      }
      return true;
    });
  }, [players, search, teamFilter, statusFilter, teamById]);

  const handleEnterAdmin = async () => {
    setLoginError(null);
    setLoginLoading(true);
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminPassword: passwordInput }),
      });
      if (!res.ok) {
        setLoginError("비밀번호가 올바르지 않습니다.");
        return;
      }
      sessionStorage.setItem(SESSION_KEY, passwordInput);
      setAdminPassword(passwordInput);
      setPasswordInput("");
    } catch {
      setLoginError("연결에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAdminPassword(null);
    setPlayers([]);
    setTeams([]);
    router.push("/?tab=board");
  };

  if (!adminPassword) {
    return (
      <main className="mx-auto min-h-screen max-w-md px-4 py-10">
        <h1 className="text-2xl font-bold text-brand-primary">
          FA 계약 현황 관리
        </h1>
        <p className="mt-2 text-sm text-brand-text-muted">
          뉴스는 자동 수집되지만, 계약 체결 현황은 직접 확인 후 반영합니다.
        </p>

        <div className="mt-8 rounded-2xl border border-brand-border/80 bg-brand-surface p-5 shadow-card">
          <label className="block text-sm">
            <span className="mb-2 block font-medium text-brand-text">
              관리자 비밀번호
            </span>
            <input
              type="password"
              autoComplete="current-password"
              className="w-full rounded-xl border border-brand-border px-3 py-2.5 text-sm"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  void handleEnterAdmin();
                }
              }}
            />
          </label>
          {loginError ? (
            <p className="mt-2 text-sm text-red-700">{loginError}</p>
          ) : null}
          <button
            type="button"
            disabled={loginLoading || passwordInput.length === 0}
            onClick={() => void handleEnterAdmin()}
            className="mt-4 w-full rounded-xl bg-brand-primary py-2.5 text-sm font-medium text-white hover:bg-brand-primary-dark disabled:opacity-60"
          >
            {loginLoading ? "확인 중…" : "관리자 모드 진입"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg px-4 py-6 pb-16">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-brand-primary sm:text-2xl">
            FA 계약 현황 관리
          </h1>
          <p className="mt-1 text-xs text-brand-text-muted sm:text-sm">
            뉴스는 자동 수집되지만, 계약 체결 현황은 직접 확인 후 반영합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="shrink-0 rounded-lg border border-brand-border px-2 py-1 text-xs text-brand-text-muted hover:bg-brand-bg-tint"
        >
          나가기
        </button>
      </div>

      <div className="mb-4 space-y-2 rounded-2xl border border-brand-border/80 bg-brand-surface/95 p-3 shadow-card">
        <input
          type="search"
          placeholder="선수명 검색"
          className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <select
            className="min-w-0 flex-1 rounded-xl border border-brand-border bg-white px-2 py-2 text-sm"
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
          >
            <option value="all">팀: 전체</option>
            {teams.map((t) => (
              <option key={t.id} value={String(t.id)}>
                {t.short_name}
              </option>
            ))}
          </select>
          <select
            className="min-w-0 flex-1 rounded-xl border border-brand-border bg-white px-2 py-2 text-sm"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as StatusFilterId)
            }
          >
            {statusOptions.map((o) => (
              <option key={o.id} value={o.id}>
                상태: {o.label}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-brand-text-muted">
          {filteredPlayers.length}명 표시
          {loadingData ? " · 불러오는 중…" : ""}
        </p>
      </div>

      {loadError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {loadError}
        </p>
      ) : null}

      <div className="space-y-4">
        {filteredPlayers.map((player) => (
          <PlayerAdminCard
            key={player.id}
            player={player}
            teams={teams}
            teamById={teamById}
            adminPassword={adminPassword}
            onSaved={() => void loadData()}
          />
        ))}
      </div>

      {!loadingData && !loadError && filteredPlayers.length === 0 ? (
        <p className="py-8 text-center text-sm text-brand-text-muted">
          조건에 맞는 선수가 없습니다.
        </p>
      ) : null}
    </main>
  );
}
