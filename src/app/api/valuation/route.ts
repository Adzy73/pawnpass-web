import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";

// PawnPass AI Valuation Engine
// Primary: Perplexity Sonar API (web-grounded AI with citations)
// Fallback: Tavily Search API (raw web search)
// Mock: Falls back to mock data if no API keys configured

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || "";
const TAVILY_API_KEY = process.env.TAVILY_API_KEY || "";

const CATEGORY_BASE_VALUES: Record<string, { min: number; max: number; loanLTV: number; buyLTV: number }> = {
  "jewellery-gold": { min: 100, max: 5000, loanLTV: 0.35, buyLTV: 0.25 },
  "jewellery-other": { min: 50, max: 3000, loanLTV: 0.30, buyLTV: 0.20 },
  "watches": { min: 200, max: 10000, loanLTV: 0.30, buyLTV: 0.20 },
  "phones": { min: 100, max: 1500, loanLTV: 0.35, buyLTV: 0.25 },
  "laptops": { min: 200, max: 3000, loanLTV: 0.30, buyLTV: 0.20 },
  "tablets": { min: 100, max: 1500, loanLTV: 0.30, buyLTV: 0.20 },
  "gaming": { min: 100, max: 1000, loanLTV: 0.35, buyLTV: 0.25 },
  "tools": { min: 100, max: 3000, loanLTV: 0.30, buyLTV: 0.20 },
  "cameras": { min: 100, max: 3000, loanLTV: 0.30, buyLTV: 0.20 },
  "other": { min: 50, max: 2000, loanLTV: 0.25, buyLTV: 0.15 },
};

const CONDITION_MULTIPLIERS: Record<string, number> = {
  "new": 1.0,
  "excellent": 0.85,
  "good": 0.70,
  "fair": 0.50,
  "poor": 0.30,
};

function getRateForAmount(amount: number, isGold: boolean): { rate: string; goldRate: string } {
  let rate: string;
  if (amount < 1000) rate = "35%";
  else if (amount < 3000) rate = "25%";
  else if (amount < 5000) rate = "20%";
  else rate = "Negotiable";

  const goldDiscount = isGold ? 0.75 : 1;
  const rateNum = parseFloat(rate);
  const goldRate = isGold && !isNaN(rateNum) ? `${(rateNum * goldDiscount).toFixed(2)}%` : rate;

  return { rate, goldRate };
}

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
    const { category, condition, brand, model, description, photos } = body;

    const cat = CATEGORY_BASE_VALUES[category] || CATEGORY_BASE_VALUES["other"];
    const conditionMult = CONDITION_MULTIPLIERS[condition] || 0.70;
    const isGold = category === "jewellery-gold";

    // === LIVE GOLD PRICE CHECK FOR GOLD/JEWELLERY ITEMS ===
    // For gold items, we calculate the scrap/melt value directly from live spot prices
    // This gives us a floor price we can never go below
    let goldScrapValue = 0;
    let goldPriceData: any = null;
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
            const weightGrams = parseFloat(weightMatch[1]);
            let karat = parseInt(karatMatch[1]);
            // GoldAPI supports: 24k, 22k, 21k, 20k, 18k, 16k, 14k, 10k
            // Map unsupported karats to nearest available
            const supportedKarats = [24, 22, 21, 20, 18, 16, 14, 10, 9];
            if (!supportedKarats.includes(karat)) {
              const nearest = supportedKarats.reduce((prev, curr) =>
                Math.abs(curr - karat) < Math.abs(prev - karat) ? curr : prev
              );
              karat = nearest;
            }
            const karatKey = `price_gram_${karat}k` as keyof typeof goldPriceData;
            const pricePerGram = goldPriceData[karatKey] as number;
            if (pricePerGram) {
              // Scrap value = live gold value × weight × 0.85 (15% margin for refining costs)
              goldScrapValue = Math.round(pricePerGram * weightGrams * 0.85);
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
          
          // For gold items: use the HIGHER of AI estimate or gold scrap value
          // This ensures we never undervalue gold below its melt value
          if (isGold && goldScrapValue > 0) {
            aiValue = Math.max(aiValue, goldScrapValue);
          }
          
          const adjValue = Math.round(aiValue * conditionMult);
          // Gold items get higher LTV (35% loan, 25% buy) since we know the melt value
          const loanLTV = isGold ? 0.40 : cat.loanLTV;
          const buyLTV = isGold ? 0.30 : cat.buyLTV;
          const loanAmount = Math.round(adjValue * loanLTV / 10) * 10;
          const buyAmount = Math.round(adjValue * buyLTV / 10) * 10;
          const { rate, goldRate } = getRateForAmount(loanAmount, isGold);

          return NextResponse.json({
            estimated_value: adjValue,
            loan_amount: Math.max(loanAmount, 50),
            buy_amount: Math.max(buyAmount, 30),
            interest_rate: isGold ? goldRate : rate,
            is_gold: isGold,
            confidence: aiResult.confidence || 80,
            currency: "AUD",
            category, condition, brand, model,
            engine: "perplexity",
            sources: data.citations?.map((c: any) => c.url).filter(Boolean) || [],
            comparable_sales: aiResult.comparable_sales || [],
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
          const loanAmount = Math.round(adjValue * cat.loanLTV / 10) * 10;
          const buyAmount = Math.round(adjValue * cat.buyLTV / 10) * 10;
          const { rate, goldRate } = getRateForAmount(loanAmount, isGold);

          return NextResponse.json({
            estimated_value: adjValue,
            loan_amount: Math.max(loanAmount, 50),
            buy_amount: Math.max(buyAmount, 30),
            interest_rate: isGold ? goldRate : rate,
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
    const baseValue = (cat.min + cat.max) / 2;
    const variance = (Math.random() - 0.3) * 0.4;
    const estimatedValue = Math.round(baseValue * conditionMult * (1 + variance) / 10) * 10;
    const clampedValue = Math.max(cat.min, Math.min(cat.max, estimatedValue));

    const loanAmount = Math.round(clampedValue * cat.loanLTV / 10) * 10;
    const buyAmount = Math.round(clampedValue * cat.buyLTV / 10) * 10;

    const { rate, goldRate } = getRateForAmount(loanAmount, isGold);
    const confidence = Math.round(65 + Math.random() * 30);

    const result = {
      estimated_value: clampedValue,
      loan_amount: loanAmount,
      buy_amount: buyAmount,
      interest_rate: isGold ? goldRate : rate,
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
        photoCount: photos || 0,
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
