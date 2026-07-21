import { NextResponse } from "next/server";

export async function GET() {
  const checks: Record<string, boolean> = {
    site: true,
    perplexity: !!process.env.PERPLEXITY_API_KEY,
    goldapi: !!process.env.GOLDAPI_KEY,
    database: !!process.env.DATABASE_URL,
    session: !!process.env.SESSION_SECRET,
    openrouter: !!process.env.OPENROUTER_API_KEY,
    gmail: !!process.env.GMAIL_USER,
  };

  const allHealthy = Object.values(checks).every(Boolean);

  return NextResponse.json(
    {
      status: allHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allHealthy ? 200 : 503 }
  );
}
