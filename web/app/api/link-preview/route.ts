import { NextRequest, NextResponse } from "next/server";
import { fetchLinkPreview, parseUrlParam } from "@/lib/linkPreview";

const CACHE_CONTROL =
  "public, s-maxage=86400, stale-while-revalidate=604800";

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get("url");
  const parsed = parseUrlParam(urlParam);

  if (!parsed) {
    return NextResponse.json(
      { error: "url query parameter must be a valid http or https URL" },
      { status: 400 },
    );
  }

  const preview = await fetchLinkPreview(parsed.toString());

  return NextResponse.json(preview, {
    headers: {
      "Cache-Control": CACHE_CONTROL,
    },
  });
}
