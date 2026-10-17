import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";
import valuationDB from "@/data/valuation-db.json";
import {
  getLTV,
  getConditionMultiplier,
  getMonthlyRate,
  formatRate,
  calculateGoldScrapValue,
  GOLD_PURITY,
  GOLD_REFINING_MARGIN,
  getAgeAdjustedLTV,
} from "@/lib/rates";
import { allowMockFallback, isLiveMode } from "@/lib/production";

// PawnPass AI Valuation Engine
// 1. Vision model (OpenRouter) analyses photos → brand, model, condition
// 2. Historical disposal database (80K+ items from 4 CC stores) → ground-truth cross-reference
// 3. Perplexity Sonar API → web-grounded resale value
// 4. Tavily Search API fallback
// 5. Mock data fallback

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || "";
const TAVILY_API_KEY = process.env.TAVILY_API_KEY || "";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";

// Rates and LTV now imported from @/lib/rates — single source of truth

// === HISTORICAL DISPOSAL DATABASE CROSS-REFERENCE ===
// Looks up brand+category in the 80K+ disposal records from 4 CC stores
function lookupHistoricalData(brand: string, category: string): any | null {
  if (!brand) return null;

  // Map PawnPass categories to disposal DB categories
  const categoryMap: Record<string, string[]> = {
    "jewellery-gold": ["jewellery"],
    "jewellery-other": ["jewellery"],
    "watches": ["watches"],
    "phones": ["phones"],
    "laptops": ["tablets_and_laptops", "tablets_&_laptops"],
    "tablets": ["tablets_and_laptops", "tablets_&_laptops"],
    "gaming": ["consoles_and_equipment", "consoles_&_equipment"],
    "tools": ["power_tools_and_industrial", "power_tools_&_industrial"],
    "cameras": ["cameras"],
    "other": [],
  };

  const brandKey = brand.toLowerCase().replace(/[^a-z0-9]/g, "_");
  const possibleCats = categoryMap[category] || [];

  // Try exact match: brand__category
  for (const cat of possibleCats) {
    const key = `${brandKey}__${cat}`;
    if (key in valuationDB) {
      const entry = (valuationDB as any)[key];
      if (entry.sample_count >= 3) return entry;
    }
  }

  // Fuzzy match: any key starting with brand__ that has enough samples
  for (const key of Object.keys(valuationDB)) {
    if (key.startsWith(`${brandKey}__`)) {
      const entry = (valuationDB as any)[key];
      if (entry.sample_count >= 10) return entry;
    }
  }

  return null;
}

// Cross-reference AI estimate against historical disposal data
// Returns adjusted confidence and a flag if the estimate is outside the historical range
// CONSERVATIVE: only boost confidence when brand+category match AND sample size is adequate
// Model-level matching gives stronger boosts than brand-only matching
function crossReferenceHistorical(aiValue: number, historical: any | null, modelMatch: boolean = false): {
  adjustedConfidence: number;
  historicalRef: any | null;
  withinRange: boolean;
} {
  if (!historical) {
    return { adjustedConfidence: 0, historicalRef: null, withinRange: false };
  }

  const avgDisposal = historical.avg_disposal_price;
  const minRetail = historical.min_retail;
  const maxRetail = historical.max_retail;
  const sampleCount = historical.sample_count;

  // Check if AI value is within ±30% of historical average disposal
  const lowerBound = avgDisposal * 0.70;
  const upperBound = avgDisposal * 1.30;
  const withinRange = aiValue >= lowerBound && aiValue <= upperBound;

  // Adjust confidence based on alignment with historical data
  // Weight by sample size and model match
  let adjustedConfidence = 0;
  
  if (withinRange) {
    // Boost depends on sample size and model match
    if (modelMatch && sampleCount >= 5) {
      adjustedConfidence = 20; // Strong boost: model matches + enough samples + within range
    } else if (sampleCount >= 10) {
      adjustedConfidence = 15; // Good boost: brand+category match with enough samples
    } else if (sampleCount >= 3) {
      adjustedConfidence = 10; // Moderate boost: small sample but within range
    } else {
      adjustedConfidence = 5; // Small boost: very few samples, treat cautiously
    }
  } else if (aiValue >= minRetail * 0.5 && aiValue <= maxRetail * 2) {
    adjustedConfidence = 0; // No boost, within plausible range
  } else {
    adjustedConfidence = -20; // Reduce confidence — AI estimate is far from historical data
  }

  return {
    adjustedConfidence,
    historicalRef: {
      brand: historical.brand,
      category: historical.category,
      sample_count: sampleCount,
      avg_disposal_price: avgDisposal,
      avg_retail_price: historical.avg_retail_price,
      min_retail: minRetail,
      max_retail: maxRetail,
      top_models: historical.top_models || {},
    },
    withinRange,
  };
}

// Old getRateForAmount removed — now using getMonthlyRate + formatRate from @/lib/rates

export async function POST(request: NextRequest) {
  try {
    // === RATE LIMITING ===
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: "Too many quote requests. Please try again later.",
          reset_at: new Date(rateLimit.resetAt).toISOString(),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "10",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimit.resetAt.toString(),
            "Retry-After": Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    const body = await request.json();
    const { category, condition, description } = body;
    let brand: string = body.brand || "";
    let model: string = body.model || "";
    const photos: string[] = Array.isArray(body.photos) ? body.photos : [];

    const ltv = getLTV(category);
    const ageAdjustedLoanLTV = getAgeAdjustedLTV(category, model || "", ltv.loanLTV);
    const ageAdjustedBuyLTV = getAgeAdjustedLTV(category, model || "", ltv.buyLTV);
    const conditionMult = getConditionMultiplier(condition);
    const isGold = category === "jewellery-gold";

    // === VISION ANALYSIS: Analyse photos with OpenRouter vision model ===
    let visionAnalysis: { brand: string; model: string; condition: string; notes: string } | null = null;
    const hasPhotos = Array.isArray(photos) && photos.length > 0 && typeof photos[0] === "string" && photos[0].startsWith("data:");

    if (hasPhotos && OPENROUTER_API_KEY) {
      try {
        const visionContent: any[] = [
          { type: "text", text: `You are a pawnbroking expert. Analyse this item photo for a ${category} valuation. Identify the brand, model, visible condition, and any notable features. Respond ONLY with a JSON object:\n{"brand":"<brand or empty>","model":"<model or empty>","condition":"<new|excellent|good|fair|poor>","notes":"<brief observations>"}` },
        ];
        for (const photo of (photos as string[]).slice(0, 4)) {
          visionContent.push({ type: "image_url", image_url: { url: photo } });
        }

        const visionRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          },
          body: JSON.stringify({
            model: "google/gemini-3.5-flash",
            messages: [{ role: "user", content: visionContent }],
            max_tokens: 300,
            temperature: 0.2,
          }),
        });

        if (visionRes.ok) {
          const vData = await visionRes.json();
          let vContent = vData.choices?.[0]?.message?.content?.trim() || "";
          if (vContent.startsWith("```")) {
            vContent = vContent.replace(/^```(?:json)?\n?/, "").replace(/```$/, "").trim();
          }
          visionAnalysis = JSON.parse(vContent);

          // Enrich user-provided fields with vision data
          if (visionAnalysis) {
            if (visionAnalysis.brand && !brand) brand = visionAnalysis.brand;
            if (visionAnalysis.model && !model) model = visionAnalysis.model;
          }
        }
      } catch (e) {
        console.error("Vision analysis failed:", e);
      }
    }

    // === LIVE GOLD PRICE CHECK FOR GOLD/JEWELLERY ITEMS ===
    // For gold items, we calculate the scrap/melt value directly from live spot prices
    // This gives us a floor price we can never go below
    // CORRECT MATH: spot_24k_AUD/gram × (carat÷24) × weight × refining_margin
    // Condition multiplier is NEVER applied to melt value — gold is gold regardless of scratches
    let goldScrapValue = 0;
    let goldPriceData: any = null;
    let goldCarat: string = "";
    let goldWeight: number = 0;
    if (isGold) {
      try {
        const goldRes = await fetch(`${request.nextUrl.origin}/api/gold-price`);
        if (goldRes.ok) {
          goldPriceData = await goldRes.json();
          // Try to extract weight from model/description (e.g. "20g", "10 gram", "5.5g")
          const weightRegex = /(\d+(?:\.\d+)?)\s*(?:g|gram|grams)/i;
          const weightMatch = (model + " " + (description || "")).match(weightRegex);
          // Try to extract karat (e.g. "9ct", "18k", "24ct")
          const karatRegex = /(\d+)\s*(?:ct|k|carat)/i;
          const karatMatch = (model + " " + (description || "")).match(karatRegex);
          
          if (weightMatch && karatMatch) {
            goldWeight = parseFloat(weightMatch[1]);
            const karatNum = parseInt(karatMatch[1]);
            goldCarat = `${karatNum}ct`;
            
            // Use 24k spot price from GoldAPI and apply purity fraction
            // This is mathematically correct: 9ct = 37.5% pure, not 41.7% (10k)
            const spotPerGram24k = goldPriceData.price_gram_24k as number;
            if (spotPerGram24k && goldWeight > 0) {
              goldScrapValue = calculateGoldScrapValue(spotPerGram24k, goldWeight, goldCarat);
            }
          }
        }
      } catch (e) {
        console.error("Gold price fetch failed:", e);
      }
    }

    // === TRY PERPLEXITY SONAR API FIRST ===
    if (PERPLEXITY_API_KEY) {
      try {
        const itemDesc = `${brand || ""} ${model || ""}`.trim() || category;
        const prompt = `You are a product valuation expert for an Australian pawnbroking business. Estimate the fair resale value (in AUD) of this item:\nCategory: ${category}\nBrand: ${brand}\nModel: ${model}\nCondition: ${condition}\nDescription: ${description || "N/A"}\n\nCRITICAL CURRENCY RULES:\n- Search eBay Australia (ebay.com.au), Gumtree, and Facebook Marketplace Australia ONLY.\n- If you find prices in USD or any non-AUD currency, convert to AUD using current exchange rates.\n- The estimated_value_aud field MUST be in Australian Dollars.\n- Label all comparable sale prices with "AU $" or "AUD" to confirm they are converted.\n\nRespond ONLY with a JSON object (no markdown):\n{"estimated_value_aud": <number_in_aud>, "confidence": <0-100>, "comparable_sales": [<brief descriptions with AU $ prices>], "notes": "<brief>"}`;

        const perplexityRes = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
          },
          body: JSON.stringify({
            model: "sonar",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 500,
            temperature: 0.2,
          }),
        });

        if (perplexityRes.ok) {
          const data = await perplexityRes.json();
          let content = data.choices?.[0]?.message?.content?.trim() || "";
          if (content.startsWith("```")) {
            content = content.split("\n", 1)[0] + content.substring(content.indexOf("\n") + 1);
            content = content.replace(/```$/, "").trim();
          }
          const aiResult = JSON.parse(content);
          let aiValue = aiResult.estimated_value_aud || 0;
          
          // For gold items: the scrap/melt value is a FLOOR that is NOT affected by condition
          // Gold is gold — scratches don't reduce melt value
          // The AI resale estimate IS affected by condition (a scratched chain sells for less)
          // But the melt floor stays constant
          let adjValue: number;
          if (isGold && goldScrapValue > 0) {
            const adjAiValue = Math.round(aiValue * conditionMult);
            // Use the higher of: condition-adjusted AI estimate OR raw scrap value (no condition)
            adjValue = Math.max(adjAiValue, goldScrapValue);
          } else {
            adjValue = Math.round(aiValue * conditionMult);
          }
          const loanAmount = Math.round(adjValue * ageAdjustedLoanLTV / 10) * 10;
          const buyAmount = Math.round(adjValue * ageAdjustedBuyLTV / 10) * 10;
          const monthlyRate = getMonthlyRate(loanAmount, isGold);
          const rateStr = formatRate(monthlyRate);

          // === CROSS-REFERENCE WITH HISTORICAL DISPOSAL DATA ===
          const historical = lookupHistoricalData(brand || "", category);
          // Check if the model string matches any top models in the historical data
          const modelMatch = !!(historical?.top_models && model && 
            Object.keys(historical.top_models).some((m: string) => 
              m.toLowerCase().includes(model.toLowerCase()) || model.toLowerCase().includes(m.toLowerCase())
            ));
          const xref = crossReferenceHistorical(aiValue, historical, modelMatch);
          const finalConfidence = Math.max(30, Math.min(98, (aiResult.confidence || 80) + xref.adjustedConfidence));

          return NextResponse.json({
            estimated_value: adjValue,
            loan_amount: Math.max(loanAmount, 50),
            buy_amount: Math.max(buyAmount, 30),
            interest_rate: rateStr,
            is_gold: isGold,
            confidence: finalConfidence,
            currency: "AUD",
            category, condition, brand, model,
            engine: "perplexity",
            sources: data.citations?.map((c: any) => c.url).filter(Boolean) || [],
            comparable_sales: aiResult.comparable_sales || [],
            historical_ref: xref.historicalRef || undefined,
            historical_within_range: xref.withinRange || undefined,
            gold_scrap_value: goldScrapValue || undefined,
            gold_price_per_gram: goldPriceData?.price_gram_18k || undefined,
            gold_price_cached: goldPriceData?.cached || false,
            mock: false,
            message: (aiResult.confidence || 80) < 75 ? "Low confidence — hub verification required for final quote" : "High confidence quote",
          });
        }
      } catch (e) {
        console.error("Perplexity failed, trying Tavily:", e);
      }
    }

    // === FALLBACK: TAVILY SEARCH API ===
    if (TAVILY_API_KEY) {
      try {
        const itemDesc = `${brand || ""} ${model || ""}`.trim() || category;
        const tavilyRes = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${TAVILY_API_KEY}`,
          },
          body: JSON.stringify({
            query: `${itemDesc} ${condition} condition sold price AUD Australia site:ebay.com.au OR site:gumtree.com.au`,
            max_results: 5,
            include_answer: true,
            search_depth: "basic",
          }),
        });

        if (tavilyRes.ok) {
          const tavilyData = await tavilyRes.json();
          const answer = tavilyData.answer || "";
          const results = tavilyData.results || [];
          // Extract prices from results
          const prices: number[] = [];
          const priceRegex = /\$[\d,]+(?:\.\d{2})?/g;
          let match;
          while ((match = priceRegex.exec(answer)) !== null) {
            prices.push(parseFloat(match[0].replace(/[$,]/g, "")));
          }
          for (const r of results) {
            while ((match = priceRegex.exec(r.content || "")) !== null) {
              prices.push(parseFloat(match[0].replace(/[$,]/g, "")));
            }
          }

          let estimatedValue = 0;
          let confidence = 50;
          if (prices.length > 0) {
            prices.sort((a, b) => a - b);
            estimatedValue = Math.round(prices[Math.floor(prices.length / 2)]);
            confidence = Math.min(60 + prices.length * 10, 85);
          }

          const adjValue = Math.round(estimatedValue * conditionMult);
          const loanAmount = Math.round(adjValue * ageAdjustedLoanLTV / 10) * 10;
          const buyAmount = Math.round(adjValue * ageAdjustedBuyLTV / 10) * 10;
          const tavilyRate = formatRate(getMonthlyRate(loanAmount, isGold));

          return NextResponse.json({
            estimated_value: adjValue,
            loan_amount: Math.max(loanAmount, 50),
            buy_amount: Math.max(buyAmount, 30),
            interest_rate: tavilyRate,
            is_gold: isGold,
            confidence,
            currency: "AUD",
            category, condition, brand, model,
            engine: "tavily",
            sources: results.map((r: any) => r.url).filter(Boolean),
            comparable_sales: results.map((r: any) => r.title).slice(0, 3),
            mock: false,
            message: confidence < 75 ? "Low confidence — hub verification required for final quote" : "Tavily fallback valuation",
          });
        }
      } catch (e) {
        console.error("Tavily failed, using mock:", e);
      }
    }

    // === FINAL FALLBACK: MOCK VALUATION ===
    // In production (live mode): NEVER return mock data — return an error
    if (isLiveMode()) {
      return NextResponse.json(
        { error: "Valuation engine unavailable. Please try again later." },
        { status: 503 }
      );
    }

    const minVal = 100;
    const maxVal = 3000;
    const baseValue = (minVal + maxVal) / 2;
    const variance = (Math.random() - 0.3) * 0.4;
    const estimatedValue = Math.round(baseValue * conditionMult * (1 + variance) / 10) * 10;
    const clampedValue = Math.max(minVal, Math.min(maxVal, estimatedValue));

    const loanAmount = Math.round(clampedValue * ltv.loanLTV / 10) * 10;
    const buyAmount = Math.round(clampedValue * ltv.buyLTV / 10) * 10;

    const mockRate = formatRate(getMonthlyRate(loanAmount, isGold));
    const confidence = Math.round(65 + Math.random() * 30);

    const result = {
      estimated_value: clampedValue,
      loan_amount: loanAmount,
      buy_amount: buyAmount,
      interest_rate: mockRate,
      is_gold: isGold,
      confidence,
      currency: "AUD",
      category, condition, brand, model,
      engine: "mock",
      mock: true,
      message: confidence < 75 ? "Low confidence — hub verification required for final quote" : "High confidence quote",
    };

    // Save quote to database if user is logged in
    const userId = await getSessionUserId();
    if (userId) {
      await db.insert(schema.quotes).values({
        userId,
        category, condition, brand, model,
        description: description || null,
        photoCount: photos.length,
        estimatedValue: result.estimated_value,
        loanAmount: result.loan_amount,
        buyAmount: result.buy_amount,
        interestRate: result.interest_rate,
        isGold: result.is_gold,
        confidence: result.confidence,
        engine: result.engine,
        message: result.message,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Valuation failed", detail: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
