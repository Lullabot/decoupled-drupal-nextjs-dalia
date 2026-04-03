import { NextRequest, NextResponse } from "next/server";

const DRUPAL_BASE_URL = process.env.DRUPAL_BASE_URL || "http://localhost";

export async function GET(request: NextRequest) {
  const targetUrl = request.nextUrl.searchParams.get("url");
  if (!targetUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // Rewrite the URL to use the internal Drupal base
  const internalUrl = targetUrl.replace(
    /^https?:\/\/[^/]+/,
    DRUPAL_BASE_URL
  );

  const res = await fetch(internalUrl, {
    headers: { Accept: "application/vnd.api+json" },
  });

  const json = await res.json();
  return NextResponse.json(json, { status: res.status });
}
