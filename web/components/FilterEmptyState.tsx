export default function FilterEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-brand-border/80 bg-brand-surface/95 px-6 py-12 text-center shadow-card backdrop-blur-sm">
      <p className="text-sm font-medium text-[#2a2a2a]">{message}</p>
      <p className="mt-2 text-xs leading-relaxed text-brand-muted">
        다른 팀·선수를 선택하거나 필터를 전체로 바꿔 보세요.
      </p>
    </div>
  );
}
