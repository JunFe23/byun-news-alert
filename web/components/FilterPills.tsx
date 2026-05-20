export type PillOption = {
  id: string;
  label: string;
};

export default function FilterPills({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: PillOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <section aria-label={label} className="mb-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-label text-brand-muted">
          {label}
        </p>
      </div>
      <div className="-mx-4 overflow-x-auto px-4 pb-1">
        <div className="flex w-max gap-2">
          {options.map((opt) => {
            const active = opt.id === value;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange(opt.id)}
                className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-[12px] font-medium transition ${
                  active
                    ? "border-brand-primary/25 bg-brand-primary/[0.08] text-brand-primary"
                    : "border-brand-border/80 bg-brand-surface/70 text-brand-muted hover:bg-brand-cream"
                }`}
                aria-pressed={active}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

