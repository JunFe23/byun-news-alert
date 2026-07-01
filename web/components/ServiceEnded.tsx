export default function ServiceEnded() {
  return (
    <main className="page-shell flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-brand-border/80 bg-brand-surface/95 px-6 py-10 text-center shadow-card">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-primary">
          KBL FREE AGENCY WATCH
        </p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-brand-text">
          서비스 종료
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-brand-text-muted">
          2026 KBL FA 레이더는 FA 시장 종료에 따라 운영을 마쳤습니다.
          <br />
          이용해 주셔서 감사합니다.
        </p>
      </div>
    </main>
  );
}
