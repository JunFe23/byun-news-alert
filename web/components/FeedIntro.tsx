interface FeedIntroProps {
  newsCount?: number;
}

export default function FeedIntro({ newsCount }: FeedIntroProps) {
  return (
    <section className="mb-7" aria-label="피드 소개">
      <p className="text-[10px] font-semibold uppercase tracking-label text-brand-primary">
        2026 FA 시장 레이더
      </p>
      <p className="mt-2 text-[15px] leading-relaxed text-[#2a2a2a]">
        KBL 전체 FA 뉴스를 팀·선수별로 모아봅니다
      </p>
      <p className="mt-1 text-xs leading-relaxed text-brand-muted">
        네이버 스포츠 농구 기사가 감지되면 피드에 쌓입니다.
        {typeof newsCount === "number" && newsCount > 0 ? (
          <span className="text-brand-primary/80">
            {" "}
            · 지금 {newsCount}건의 기사가 있습니다.
          </span>
        ) : null}
      </p>
      <div className="feed-divider mt-5" />
    </section>
  );
}
