"use client";

import { useEffect, useState } from "react";
import { formatKstDateTime, formatKstShort } from "@/lib/formatDate";
import { fetchLinkPreviewImageUrl } from "@/lib/linkPreviewClient";
import type { RelatedPlayerBadge } from "@/lib/feedFilters";
import type { NewsItem } from "@/lib/types";

interface NewsCardProps {
  item: NewsItem;
  isLatest?: boolean;
  /** 첫 카드 LCP: 전면 이미지 eager + high priority, 블러 배경 대신 gradient */
  imagePriority?: boolean;
  /** 첫 카드용 선행 fetch URL. undefined=부모 로딩 중, null=없음, string=URL */
  prefetchedImageUrl?: string | null;
  relatedPlayers?: RelatedPlayerBadge[];
}

type ImgPriorityProps = {
  loading: "eager" | "lazy";
  fetchPriority: "high" | "auto";
};

function imagePriorityProps(priority: boolean): ImgPriorityProps {
  return priority
    ? { loading: "eager", fetchPriority: "high" }
    : { loading: "lazy", fetchPriority: "auto" };
}

export default function NewsCard({
  item,
  isLatest = false,
  imagePriority = false,
  prefetchedImageUrl,
  relatedPlayers = [],
}: NewsCardProps) {
  const keywords = item.matched_keywords ?? [];
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    if (imagePriority && prefetchedImageUrl !== undefined) {
      setPreviewImageUrl(prefetchedImageUrl);
      setImageFailed(false);
      return;
    }

    let cancelled = false;

    async function loadPreview() {
      setPreviewImageUrl(null);
      setImageFailed(false);

      const url = await fetchLinkPreviewImageUrl(item.link);
      if (!cancelled) {
        setPreviewImageUrl(url);
      }
    }

    void loadPreview();
    return () => {
      cancelled = true;
    };
  }, [item.link, imagePriority, prefetchedImageUrl]);

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
            alt={item.title}
            priority={imagePriority}
            onError={() => setImageFailed(true)}
          />
        </a>
      ) : imagePriority ? (
        <ImagePlaceholder />
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
    <div className="min-w-0 flex-1">
      <p className="truncate text-[11px] font-medium text-[#333]">{publisher}</p>
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-brand-muted">
        <span className="inline-flex shrink-0 items-center whitespace-nowrap sm:hidden">
          발행 {formatKstShort(pubDate)}
        </span>
        <span className="inline-flex shrink-0 items-center whitespace-nowrap sm:hidden">
          감지 {formatKstShort(detectedAt)}
        </span>
        <span className="hidden whitespace-nowrap sm:inline">
          발행 {formatKstDateTime(pubDate)}
        </span>
        <span className="hidden text-brand-border sm:inline" aria-hidden>
          ·
        </span>
        <span className="hidden whitespace-nowrap sm:inline">
          감지 {formatKstDateTime(detectedAt)}
        </span>
      </div>
    </div>
  );
}

function LatestBadge() {
  return (
    <span className="shrink-0 rounded-full bg-brand-primary/[0.08] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-brand-primary">
      New
    </span>
  );
}

/** LCP 후보 카드: 이미지 URL 로딩 전 레이아웃 고정 */
function ImagePlaceholder() {
  return (
    <div
      className="aspect-[16/9] w-full max-h-[360px] min-h-[min(48vw,200px)] bg-gradient-to-br from-brand-cream via-[#ebe8e4] to-brand-primary/[0.08] sm:max-h-[420px] sm:min-h-[220px]"
      aria-hidden
    />
  );
}

function PreviewImage({
  src,
  alt,
  onError,
  priority,
}: {
  src: string;
  alt: string;
  onError: () => void;
  priority: boolean;
}) {
  const imgProps = imagePriorityProps(priority);

  if (priority) {
    return (
      <div className="relative aspect-[16/9] w-full max-h-[360px] min-h-[min(48vw,200px)] overflow-hidden bg-gradient-to-br from-brand-cream via-[#ebe8e4] to-brand-primary/[0.08] sm:max-h-[420px] sm:min-h-[220px]">
        <div
          className="pointer-events-none absolute inset-0 bg-white/40"
          aria-hidden
        />
        <div className="relative z-10 flex h-full min-h-[inherit] items-center justify-center py-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            width={640}
            height={360}
            className="mx-auto h-auto max-h-[min(52vw,340px)] w-full object-contain sm:max-h-[400px]"
            decoding="async"
            onError={onError}
            {...imgProps}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-[16/9] w-full max-h-[360px] min-h-[min(48vw,200px)] overflow-hidden bg-brand-cream sm:max-h-[420px] sm:min-h-[220px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        aria-hidden="true"
        width={640}
        height={360}
        className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-35 blur-2xl"
        {...imgProps}
      />
      <div
        className="pointer-events-none absolute inset-0 bg-white/45"
        aria-hidden="true"
      />
      <div className="relative z-10 flex h-full min-h-[inherit] items-center justify-center py-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          width={640}
          height={360}
          className="mx-auto h-auto max-h-[min(52vw,340px)] w-full object-contain sm:max-h-[400px]"
          decoding="async"
          onError={onError}
          {...imgProps}
        />
      </div>
    </div>
  );
}
