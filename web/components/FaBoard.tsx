import FaBoardSummary from "@/components/FaBoardSummary";
import FilterPills from "@/components/FilterPills";
import TeamLabel from "@/components/TeamLabel";
import { buildTeamFilterOptions } from "@/lib/feedFilters";
import { buildStatusFilterOptions } from "@/lib/filterSort";
import { formatContractAmount } from "@/lib/formatContractAmount";
import { formatContractYears } from "@/lib/formatContractYears";
import { normalizeContractStatus } from "@/lib/faPlayerStatus";
import { normalizeNumericId } from "@/lib/feedFilters";
import type { FaPlayer, FaTeam } from "@/lib/types";

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
    if (
      teamFilter !== "all" &&
      String(normalizeNumericId(p.team_id)) !== teamFilter
    ) {
      return false;
    }
    if (statusFilter !== "all") {
      const team = teamById.get(p.team_id);
      const bucket = normalizeContractStatus(p.contract_status, team);
      if (bucket !== statusFilter) return false;
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
      <FaBoardSummary
        players={players}
        teams={teams}
        statusFilter={statusFilter}
        onStatusFilterChange={onStatusFilterChange}
      />

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
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <TeamLabel team={team} size="md" strong />
                {team?.team_name && team.team_name !== team.short_name ? (
                  <span className="truncate text-[11px] text-brand-muted">
                    {team.team_name}
                  </span>
                ) : null}
              </div>
              <p className="shrink-0 text-[11px] text-brand-muted">
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
  const statusOptions = buildStatusFilterOptions();

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
  const status = normalizeContractStatus(player.contract_status, team);

  return (
    <article className="rounded-2xl border border-brand-border/80 bg-brand-surface shadow-card">
      <div className="px-4 pb-3 pt-4">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 text-[15px] font-semibold tracking-tight text-[#1a1a1a]">
            {player.player_name}
          </p>
          <StatusBadge status={status} />
        </div>
        <TeamTransferInfo
          originalTeam={team}
          newTeam={newTeam}
          contractStatus={status}
        />
        <dl className="mt-2.5 grid grid-cols-[4.5rem_1fr] gap-x-2 gap-y-1.5 rounded-lg border border-brand-border/50 bg-brand-cream/25 px-3 py-2.5 text-xs">
          <dt className="text-[10px] font-medium text-brand-muted">계약기간</dt>
          <dd className="font-semibold tabular-nums text-[#222]">
            {formatContractYears(player.contract_years)}
          </dd>
          <dt className="text-[10px] font-medium text-brand-muted">계약금액</dt>
          <dd className="font-semibold tabular-nums text-[#222]">
            {formatContractAmount(player.contract_amount)}
          </dd>
        </dl>
      </div>

      <div className="border-t border-brand-border-subtle/70 px-4 py-3">
        {player.contract_note ? (
          <p className="text-xs leading-relaxed text-brand-muted">
            {player.contract_note}
          </p>
        ) : null}
        <div
          className={`flex flex-wrap items-center justify-between gap-3 ${
            player.contract_note ? "mt-2" : ""
          }`}
        >
          <p className="text-[11px] text-brand-muted">
            관련 뉴스{" "}
            <span className="font-semibold text-brand-primary">{newsCount}</span>
            건
          </p>
          <button
            type="button"
            onClick={onSelect}
            className="shrink-0 text-[12px] font-semibold text-brand-primary underline-offset-4 hover:underline"
          >
            관련 뉴스 보기 →
          </button>
        </div>
      </div>
    </article>
  );
}

function TeamTransferInfo({
  originalTeam,
  newTeam,
  contractStatus,
}: {
  originalTeam: FaTeam | undefined;
  newTeam: FaTeam | null;
  contractStatus: string;
}) {
  const newTeamFallback =
    contractStatus === "FA" || contractStatus === "미정" ? "미정" : "-";

  return (
    <div className="mt-2 w-full overflow-x-auto [-webkit-overflow-scrolling:touch]">
      <div className="inline-flex min-w-full flex-nowrap items-center gap-x-1.5 text-xs sm:gap-x-2">
        <span className="shrink-0 text-[10px] font-medium text-brand-muted">
          원소속
        </span>
        <TeamLabel team={originalTeam} size="sm" strong />
        <span className="shrink-0 px-0.5 text-brand-muted" aria-hidden>
          →
        </span>
        <span className="shrink-0 text-[10px] font-medium text-brand-muted">
          새 팀
        </span>
        {newTeam ? (
          <TeamLabel team={newTeam} size="sm" strong />
        ) : (
          <span className="shrink-0 whitespace-nowrap font-semibold text-[#1a1a1a]">
            {newTeamFallback}
          </span>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const classes =
    status === "잔류"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
        : status === "이적"
        ? "bg-sky-50 text-sky-800 border-sky-100"
        : status === "계약미체결"
          ? "bg-orange-50 text-orange-800 border-orange-100"
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

