"use client";

import { useEffect, useState } from "react";
import { formatKstDateTime } from "@/lib/formatDate";
import type { LinkPreview } from "@/lib/linkPreview";
import type { RelatedPlayerBadge } from "@/lib/feedFilters";
import type { NewsItem } from "@/lib/types";

interface NewsCardProps {
  item: NewsItem;
  isLatest?: boolean;
  relatedPlayers?: RelatedPlayerBadge[];
}

export default function NewsCard({
  item,
  isLatest = false,
  relatedPlayers = [],
}: NewsCardProps) {
  const keywords = item.matched_keywords ?? [];
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPreview() {
      setPreviewImageUrl(null);
      setImageFailed(false);

      try {
        const response = await fetch(
          `/api/link-preview?url=${encodeURIComponent(item.link)}`,
        );

        if (!response.ok) return;

        const data = (await response.json()) as LinkPreview;
        if (!cancelled && data.imageUrl) {
          setPreviewImageUrl(data.imageUrl);
        }
      } catch {
        // 미리보기 실패 시 텍스트 카드만 표시
      }
    }

    void loadPreview();
    return () => {
      cancelled = true;
    };
  }, [item.link]);

  const showImage = Boolean(previewImageUrl) && !imageFailed;
  const publisher = item.publisher ?? "출처 미상";

  return (
    <article
      className={`group overflow-hidden rounded-2xl border bg-brand-surface shadow-card transition-all duration-300 hover:-translate-y-px hover:shadow-card-hover ${
        isLatest
          ? "border-brand-primary/25 ring-1 ring-brand-primary/10"
          : "border-brand-border/90"
      }`}
    >
      <div className="flex items-start justify-between gap-2 px-4 pb-2 pt-3.5">
        <CardMetaLine
          publisher={publisher}
          pubDate={item.pub_date}
          detectedAt={item.detected_at}
        />
        {isLatest ? <LatestBadge /> : null}
      </div>

      {showImage && previewImageUrl ? (
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block overflow-hidden"
        >
          <PreviewImage
            src={previewImageUrl}
            onError={() => setImageFailed(true)}
          />
        </a>
      ) : null}

      <div className="px-4 pb-4 pt-3">
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-[1.0625rem] font-semibold leading-[1.45] tracking-tight text-[#1a1a1a] transition-colors group-hover:text-brand-primary"
        >
          {item.title}
        </a>

        {item.description ? (
          <p className="mt-2.5 line-clamp-3 text-[13px] leading-[1.65] text-brand-muted">
            {item.description}
          </p>
        ) : null}

        {relatedPlayers.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {relatedPlayers.map((player) => (
              <span
                key={player.playerId}
                className="rounded-full border border-brand-primary/20 bg-brand-primary/[0.06] px-2.5 py-0.5 text-[10px] font-semibold text-brand-primary"
              >
                {player.playerName}
                {player.teamShortName ? (
                  <span className="font-medium text-brand-primary/70">
                    {" "}
                    · {player.teamShortName}
                  </span>
                ) : null}
              </span>
            ))}
          </div>
        ) : null}

        {keywords.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {keywords.map((keyword) => (
              <span
                key={keyword}
                className="rounded-full border border-brand-border/80 bg-brand-cream px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-brand-muted"
              >
                {keyword}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-brand-border-subtle/70 pt-3.5">
          <span className="text-[10px] uppercase tracking-wide text-brand-muted/90">
            {formatKstDateTime(item.detected_at)} 감지
          </span>
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[32px] items-center gap-1 text-[13px] font-medium text-brand-primary underline-offset-4 transition hover:text-brand-primary-dark hover:underline"
          >
            기사 보기
            <span aria-hidden className="text-brand-accent">
              →
            </span>
          </a>
        </div>
      </div>
    </article>
  );
}

function CardMetaLine({
  publisher,
  pubDate,
  detectedAt,
}: {
  publisher: string;
  pubDate: string | null;
  detectedAt: string;
}) {
  return (
    <p className="min-w-0 flex-1 text-[11px] leading-relaxed text-brand-muted">
      <span className="font-medium text-[#333]">{publisher}</span>
      <span className="mx-1.5 text-brand-border">·</span>
      <span>발행 {formatKstDateTime(pubDate)}</span>
      <span className="mx-1.5 text-brand-border">·</span>
      <span>감지 {formatKstDateTime(detectedAt)}</span>
    </p>
  );
}

function LatestBadge() {
  return (
    <span className="shrink-0 rounded-full bg-brand-primary/[0.08] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-brand-primary">
      New
    </span>
  );
}

function PreviewImage({
  src,
  onError,
}: {
  src: string;
  onError: () => void;
}) {
  return (
    <div className="relative aspect-video w-full overflow-hidden bg-brand-cream">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.015]"
        loading="lazy"
        onError={onError}
      />
    </div>
  );
}
