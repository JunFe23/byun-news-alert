interface FeedIntroProps {
  newsCount?: number;
}

export default function FeedIntro({ newsCount }: FeedIntroProps) {
  return (
    <section className="mb-7" aria-label="피드 소개">
      <p className="text-[10px] font-semibold uppercase tracking-label text-brand-primary">
        오늘의 FA 레이더
      </p>
      <p className="mt-2 text-[15px] leading-relaxed text-[#2a2a2a]">
        FA 시장의 작은 신호도 놓치지 않기 위해
      </p>
      <p className="mt-1 text-xs leading-relaxed text-brand-muted">
        새 기사가 감지되면 피드에 조용히 쌓입니다.
        {typeof newsCount === "number" && newsCount > 0 ? (
          <span className="text-brand-primary/80">
            {" "}
            · 지금 {newsCount}건의 소식이 있습니다.
          </span>
        ) : null}
      </p>
      <div className="feed-divider mt-5" />
    </section>
  );
}