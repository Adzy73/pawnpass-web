import { NextRequest, NextResponse } from "next/server";

// PawnPass Gold Price API
// Uses GoldAPI.io to fetch live gold spot prices in AUD per gram by karat
// This enables dynamic LTV ratios for gold/jewellery loans and buys

const GOLDAPI_KEY = process.env.GOLDAPI_KEY || "";

// Cache the gold price for 1 hour to avoid hitting API rate limits
let cachedPrice: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function GET(request: NextRequest) {
  try {
    // Check cache first
    if (cachedPrice && Date.now() - cachedPrice.timestamp < CACHE_TTL) {
      return NextResponse.json({
        ...cachedPrice.data,
        cached: true,
        cached_at: new Date(cachedPrice.timestamp).toISOString(),
      });
    }

    if (!GOLDAPI_KEY) {
      // Mock gold price (approximate, July 2026)
      return NextResponse.json({
        metal: "XAU",
        currency: "AUD",
        price_per_ounce_aud: 4665,
        price_gram_24k: 150.01,
        price_gram_22k: 137.51,
        price_gram_21k: 131.26,
        price_gram_20k: 125.01,
        price_gram_18k: 112.51,
        price_gram_16k: 100.01,
        price_gram_14k: 87.51,
        price_gram_10k: 62.50,
        price_gram_9k: 56.25,
        timestamp: Math.floor(Date.now() / 1000),
        mock: true,
        message: "Mock gold price — add GOLDAPI_KEY to .env for live prices",
      });
    }

    const res = await fetch("https://www.goldapi.io/api/XAU/AUD", {
      headers: {
        "x-access-token": GOLDAPI_KEY,
      },
    });

    if (!res.ok) {
      throw new Error(`GoldAPI returned ${res.status}`);
    }

    const data = await res.json();

    // Build our response with the fields we care about
    const goldPrice = {
      metal: "XAU",
      currency: "AUD",
      price_per_ounce_aud: data.price,
      prev_close_price: data.prev_close_price,
      open_price: data.open_price,
      high_price: data.high_price,
      low_price: data.low_price,
      change: data.ch,
      change_percent: data.chp,
      price_gram_24k: data.price_gram_24k,
      price_gram_22k: data.price_gram_22k,
      price_gram_21k: data.price_gram_21k,
      price_gram_20k: data.price_gram_20k,
      price_gram_18k: data.price_gram_18k,
      price_gram_16k: data.price_gram_16k,
      price_gram_14k: data.price_gram_14k,
      price_gram_10k: data.price_gram_10k,
      // 9ct = 37.5% of 24k purity — common in Australia
      price_gram_9k: Math.round((data.price_gram_24k * 0.375) * 100) / 100,
      timestamp: data.timestamp,
      exchange: data.exchange,
      mock: false,
    };

    // Update cache
    cachedPrice = { data: goldPrice, timestamp: Date.now() };

    return NextResponse.json(goldPrice);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch gold price", detail: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
