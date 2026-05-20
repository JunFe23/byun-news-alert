/** KBL FA 레이더 — 중립적인 스포츠 뉴스룸 마크 (구단 마스코트 없음) */
export default function FaRadarMark({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex shrink-0 flex-col items-center gap-1 ${className}`}
      aria-hidden
    >
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-primary/[0.07] ring-1 ring-brand-primary/15">
        <BasketballIcon />
      </span>
      <div className="flex gap-1">
        <span className="rounded-md bg-brand-primary/10 px-1.5 py-0.5 text-[8px] font-bold tracking-wider text-brand-primary">
          FA
        </span>
        <span className="rounded-md bg-brand-border/80 px-1.5 py-0.5 text-[8px] font-semibold tracking-wide text-brand-muted">
          KBL
        </span>
      </div>
    </div>
  );
}

function BasketballIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-brand-primary"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="rgba(122, 30, 44, 0.06)"
      />
      <path
        d="M12 3v18M3 12h18M5.5 5.5c3 3 10 3 13 0M5.5 18.5c3-3 10-3 13 0"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}
