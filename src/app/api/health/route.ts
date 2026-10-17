import { NextResponse } from "next/server";

export async function GET() {
  const checks: Record<string, boolean> = {
    site: true,
    perplexity: !!process.env.PERPLEXITY_API_KEY,
    goldapi: !!process.env.GOLDAPI_KEY,
    database: !!process.env.DATABASE_URL,
    session: !!process.env.SESSION_SECRET,
    stripe: !!process.env.STRIPE_SECRET_KEY,
    tavily: !!process.env.TAVILY_API_KEY,
    mapbox: !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    // Optional services (don't affect health status)
    openrouter: !!process.env.OPENROUTER_API_KEY,
    gmail: !!process.env.GMAIL_USER,
  };

  // Core services that must be healthy
  const coreKeys = ["site", "perplexity", "goldapi", "database", "session", "stripe"];
  const coreHealthy = coreKeys.every((k) => checks[k]);

  return NextResponse.json(
    {
      status: coreHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: coreHealthy ? 200 : 503 }
  );
}
