import FilterPills from "@/components/FilterPills";
import { buildTeamFilterOptions } from "@/lib/feedFilters";
import type { FaPlayer, FaTeam } from "@/lib/types";

const STATUS_ORDER = ["FA", "잔류", "이적", "계약미체결", "미정"] as const;

export default function FaBoard({
  teams,
  players,
  newsCountByPlayerId,
  teamFilter,
  statusFilter,
  onTeamFilterChange,
  onStatusFilterChange,
  onSelectPlayer,
}: {
  teams: FaTeam[];
  players: FaPlayer[];
  newsCountByPlayerId: Map<number, number>;
  teamFilter: string;
  statusFilter: string;
  onTeamFilterChange: (teamId: string) => void;
  onStatusFilterChange: (status: string) => void;
  onSelectPlayer: (playerId: number) => void;
}) {
  if (players.length === 0) {
    return (
      <div className="rounded-2xl border border-brand-border/80 bg-brand-surface/95 px-6 py-12 text-center shadow-card backdrop-blur-sm">
        <p className="text-sm font-medium text-[#2a2a2a]">
          FA 선수 목록이 없습니다.
        </p>
        <p className="mt-2 text-xs leading-relaxed text-brand-muted">
          FA 선수 데이터가 준비되면 이곳에 표시됩니다.
        </p>
      </div>
    );
  }

  const teamById = new Map(teams.map((t) => [t.id, t]));

  const filtered = players.filter((p) => {
    if (teamFilter !== "all" && String(p.team_id) !== teamFilter) return false;
    if (statusFilter !== "all") {
      const s = normalizeStatus(p.contract_status);
      if (s !== statusFilter) return false;
    }
    return true;
  });

  const grouped = new Map<number, FaPlayer[]>();
  for (const p of filtered) {
    const list = grouped.get(p.team_id) ?? [];
    list.push(p);
    grouped.set(p.team_id, list);
  }

  const sortedTeamIds = [...grouped.keys()].sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      <BoardFilters
        teams={teams}
        teamFilter={teamFilter}
        statusFilter={statusFilter}
        onTeamFilterChange={onTeamFilterChange}
        onStatusFilterChange={onStatusFilterChange}
      />

      {sortedTeamIds.map((teamId) => {
        const team = teamById.get(teamId);
        const teamPlayers = grouped.get(teamId) ?? [];
        return (
          <section key={teamId} className="space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-sm font-semibold tracking-tight text-[#222]">
                {team?.team_name ?? `팀 #${teamId}`}
              </h2>
              <p className="text-[11px] text-brand-muted">
                {teamPlayers.length}명
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {teamPlayers.map((p) => (
                <PlayerCard
                  key={p.id}
                  player={p}
                  team={team}
                  newTeam={
                    p.new_team_id ? teamById.get(p.new_team_id) ?? null : null
                  }
                  newsCount={newsCountByPlayerId.get(p.id) ?? 0}
                  onSelect={() => onSelectPlayer(p.id)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function BoardFilters({
  teams,
  teamFilter,
  statusFilter,
  onTeamFilterChange,
  onStatusFilterChange,
}: {
  teams: FaTeam[];
  teamFilter: string;
  statusFilter: string;
  onTeamFilterChange: (teamId: string) => void;
  onStatusFilterChange: (status: string) => void;
}) {
  const teamOptions = buildTeamFilterOptions(teams);
  const statusOptions = [
    { id: "all", label: "전체" },
    ...STATUS_ORDER.map((s) => ({ id: s, label: s })),
  ];

  return (
    <div className="space-y-1">
      <FilterPills
        label="팀 필터"
        options={teamOptions}
        value={teamFilter}
        onChange={onTeamFilterChange}
      />
      <FilterPills
        label="상태 필터"
        options={statusOptions}
        value={statusFilter}
        onChange={onStatusFilterChange}
      />
    </div>
  );
}

function PlayerCard({
  player,
  team,
  newTeam,
  newsCount,
  onSelect,
}: {
  player: FaPlayer;
  team: FaTeam | undefined;
  newTeam: FaTeam | null;
  newsCount: number;
  onSelect: () => void;
}) {
  const status = normalizeStatus(player.contract_status);
  return (
    <article className="rounded-2xl border border-brand-border/80 bg-brand-surface shadow-card">
      <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-4">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold tracking-tight text-[#1a1a1a]">
            {player.player_name}
          </p>
          <p className="mt-1 text-xs text-brand-muted">
            원소속팀 {team?.short_name ?? "—"}
            {newTeam ? ` → 새 팀 ${newTeam.short_name}` : ""}
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      {(player.contract_note || newsCount > 0) && (
        <div className="border-t border-brand-border-subtle/70 px-4 py-3">
          {player.contract_note ? (
            <p className="text-xs leading-relaxed text-brand-muted">
              {player.contract_note}
            </p>
          ) : null}
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-[11px] text-brand-muted">
              관련 뉴스{" "}
              <span className="font-semibold text-brand-primary">
                {newsCount}
              </span>
              건
            </p>
            <button
              type="button"
              onClick={onSelect}
              className="text-[12px] font-semibold text-brand-primary underline-offset-4 hover:underline"
            >
              관련 뉴스 보기 →
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

function StatusBadge({ status }: { status: string }) {
  const classes =
    status === "잔류"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : status === "이적"
        ? "bg-amber-50 text-amber-800 border-amber-100"
        : status === "계약미체결"
          ? "bg-gray-50 text-gray-700 border-gray-100"
          : status === "FA"
            ? "bg-brand-primary/[0.08] text-brand-primary border-brand-primary/15"
            : "bg-brand-cream text-brand-muted border-brand-border/60";

  return (
    <span
      className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${classes}`}
    >
      {status}
    </span>
  );
}

function normalizeStatus(value: unknown): string {
  if (typeof value !== "string" || value.trim() === "") return "미정";
  return value;
}

