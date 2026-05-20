export interface LinkPreview {
  imageUrl: string | null;
  title: string | null;
  description: string | null;
  siteName: string | null;
}

const EMPTY_PREVIEW: LinkPreview = {
  imageUrl: null,
  title: null,
  description: null,
  siteName: null,
};

const FETCH_TIMEOUT_MS = 5000;
const MAX_HTML_BYTES = 512_000;

export function parseUrlParam(urlParam: string | null): URL | null {
  if (!urlParam) {
    return null;
  }

  try {
    const parsed = new URL(urlParam);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function fetchLinkPreview(pageUrl: string): Promise<LinkPreview> {
  try {
    const response = await fetch(pageUrl, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent":
          "Mozilla/5.0 (compatible; ByunNewsAlert/1.0; +https://github.com/byun-news-alert)",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      return { ...EMPTY_PREVIEW };
    }

    const html = (await response.text()).slice(0, MAX_HTML_BYTES);
    return parseHtmlForPreview(html, pageUrl);
  } catch {
    return { ...EMPTY_PREVIEW };
  }
}

export function parseHtmlForPreview(html: string, pageUrl: string): LinkPreview {
  const ogImage = extractMetaContent(html, "property", "og:image");
  const twitterImage = extractMetaContent(html, "name", "twitter:image");
  const imageCandidate = ogImage ?? twitterImage;

  return {
    imageUrl: imageCandidate
      ? resolveAbsoluteUrl(pageUrl, decodeHtmlEntities(imageCandidate))
      : null,
    title: decodeHtmlEntities(
      extractMetaContent(html, "property", "og:title") ?? "",
    ) || null,
    description: decodeHtmlEntities(
      extractMetaContent(html, "property", "og:description") ?? "",
    ) || null,
    siteName: decodeHtmlEntities(
      extractMetaContent(html, "property", "og:site_name") ?? "",
    ) || null,
  };
}

function extractMetaContent(
  html: string,
  attr: "property" | "name",
  value: string,
): string | null {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(
      `<meta[^>]*${attr}=["']${escaped}["'][^>]*content=["']([^"']+)["'][^>]*>`,
      "i",
    ),
    new RegExp(
      `<meta[^>]*content=["']([^"']+)["'][^>]*${attr}=["']${escaped}["'][^>]*>`,
      "i",
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return null;
}

function resolveAbsoluteUrl(baseUrl: string, maybeRelative: string): string {
  try {
    return new URL(maybeRelative, baseUrl).href;
  } catch {
    return maybeRelative;
  }
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&nbsp;/gi, " ");
}
