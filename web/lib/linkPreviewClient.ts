import type { LinkPreview } from "@/lib/linkPreview";

/** 클라이언트에서 OG 이미지 URL만 조회 (LCP용 선행 fetch 등) */
export async function fetchLinkPreviewImageUrl(
  articleUrl: string,
): Promise<string | null> {
  try {
    const response = await fetch(
      `/api/link-preview?url=${encodeURIComponent(articleUrl)}`,
    );
    if (!response.ok) return null;
    const data = (await response.json()) as LinkPreview;
    return data.imageUrl ?? null;
  } catch {
    return null;
  }
}
