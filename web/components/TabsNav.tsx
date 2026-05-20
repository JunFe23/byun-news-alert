type TabKey = "feed" | "board";

export default function TabsNav({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}) {
  return (
    <nav aria-label="탭" className="mb-5">
      <div className="flex gap-2 rounded-2xl border border-brand-border/80 bg-brand-surface/60 p-1.5 shadow-card backdrop-blur-sm">
        <TabButton
          active={active === "feed"}
          onClick={() => onChange("feed")}
          label="뉴스 피드"
        />
        <TabButton
          active={active === "board"}
          onClick={() => onChange("board")}
          label="FA 현황판"
        />
      </div>
    </nav>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-xl px-3 py-2 text-[13px] font-semibold transition ${
        active
          ? "bg-brand-primary text-white shadow-sm"
          : "text-brand-muted hover:bg-brand-cream"
      }`}
      aria-current={active ? "page" : undefined}
    >
      {label}
    </button>
  );
}

