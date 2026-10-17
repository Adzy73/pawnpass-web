import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

// Historical valuation lookup — instant (<100ms) JSON from pawnpass-valuation-db.json
// GET /api/valuation/historical?category=X&brand=Y
// Returns aggregated loan/buy estimates across matching brand+category entries.

type DbEntry = {
  brand: string;
  category: string;
  sample_count: number;
  avg_cost_price: number;
  avg_retail_price: number;
  avg_disposal_price: number;
  min_retail: number;
  max_retail: number;
  avg_margin_pct: number;
  pawnpass_loan_estimate: number;
  pawnpass_buy_estimate: number;
  top_models?: Record<string, number>;
};

// Load once at module scope (cached across requests in the same server instance)
let dbCache: Record<string, DbEntry> | null = null;
function loadDb(): Record<string, DbEntry> {
  if (dbCache) return dbCache;
  try {
    const filePath = join(process.cwd(), "src", "data", "valuation-db.json");
    const raw = readFileSync(filePath, "utf-8");
    dbCache = JSON.parse(raw) as Record<string, DbEntry>;
  } catch (e) {
    console.error("Failed to load valuation-db.json:", e);
    dbCache = {};
  }
  return dbCache!;
}

// Map our UI category ids to the DB's category labels
const CATEGORY_MAP: Record<string, string[]> = {
  "jewellery-gold": ["Jewellery"],
  "watches": ["Wearables"],
  "phones": ["Phones", "Phone & Communications"],
  "laptops": ["Tablets & Laptops", "Desktop PCs & Monitors"],
  "tablets": ["Tablets & Laptops"],
  "gaming": [
    "Consoles & Equipment",
    "Handheld Systems & Equipment",
    "PC Gaming",
    "Gaming Peripherals",
    "Games (Discs & Cartridges)",
  ],
  "tools": [
    "Tools & Hardware",
    "Hand Tools",
    "Power Tools & Industrial",
    "Hardware & Parts",
  ],
  "cameras": ["Cameras"],
  "other": [],
};

function norm(s: string): string {
  return (s || "").trim().toLowerCase().replace(/\s+/g, " ");
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "";
    const brand = searchParams.get("brand") || "";

    const db = loadDb();
    const entries = Object.values(db);

    // Filter by category (if provided and mapped)
    const dbCats = category ? (CATEGORY_MAP[category] || []) : [];
    let filtered = entries;
    if (dbCats.length > 0) {
      filtered = filtered.filter((e) =>
        dbCats.some((c) => norm(e.category) === norm(c))
      );
    }

    // Further filter by brand (if provided) — case-insensitive contains match
    if (brand) {
      const nb = norm(brand);
      const brandMatches = filtered.filter((e) => norm(e.brand).includes(nb));
      // If brand matches exist, use them; otherwise fall back to category-only
      if (brandMatches.length > 0) filtered = brandMatches;
    }

    if (filtered.length === 0) {
      return NextResponse.json({
        found: false,
        category,
        brand,
        sample_count: 0,
        message: "No historical data for this combination",
      });
    }

    // Aggregate
    const loanEsts = filtered.map((e) => e.pawnpass_loan_estimate).filter((n) => n > 0);
    const buyEsts = filtered.map((e) => e.pawnpass_buy_estimate).filter((n) => n > 0);
    const retails = filtered.map((e) => e.avg_retail_price).filter((n) => n > 0);

    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
    const avg = (arr: number[]) => (arr.length ? sum(arr) / arr.length : 0);
    const min = (arr: number[]) => (arr.length ? Math.min(...arr) : 0);
    const max = (arr: number[]) => (arr.length ? Math.max(...arr) : 0);

    const loanAvg = Math.round(avg(loanEsts));
    const loanMin = Math.round(min(loanEsts));
    const loanMax = Math.round(max(loanEsts));
    const buyAvg = Math.round(avg(buyEsts));
    const retailAvg = Math.round(avg(retails));

    // Collect top models across matched entries
    const modelCounts: Record<string, number> = {};
    for (const e of filtered) {
      if (e.top_models) {
        for (const [m, c] of Object.entries(e.top_models)) {
          modelCounts[m] = (modelCounts[m] || 0) + c;
        }
      }
    }
    const topModels = Object.entries(modelCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([model, count]) => ({ model, count }));

    return NextResponse.json({
      found: true,
      category,
      brand,
      sample_count: filtered.reduce((a, e) => a + e.sample_count, 0),
      entries_matched: filtered.length,
      loan_estimate_avg: loanAvg,
      loan_estimate_min: loanMin,
      loan_estimate_max: loanMax,
      buy_estimate_avg: buyAvg,
      retail_avg: retailAvg,
      top_models: topModels,
      source: "historical_db",
      cached_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Historical valuation error:", error);
    return NextResponse.json(
      { error: "Historical lookup failed", detail: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
