/**
 * PawnPass Rate Configuration — SINGLE SOURCE OF TRUTH
 * 
 * Every API route, page, and component must import from here.
 * Never hardcode rates or LTV ratios anywhere else.
 * 
 * To change a rate: edit this file, run `npm run build`, restart dev server.
 */

// === PAWN LOAN INTEREST RATES (per month) ===
export interface RateTier {
  minAmount: number;
  maxAmount: number | null; // null = no upper limit
  standardRate: number; // e.g. 0.35 = 35% per month
  goldRate: number; // 25% discount on standard
  label: string;
}

export const LOAN_RATE_TIERS: RateTier[] = [
  { minAmount: 0, maxAmount: 1000, standardRate: 0.35, goldRate: 0.2625, label: "Under $1,000" },
  { minAmount: 1000, maxAmount: 3000, standardRate: 0.25, goldRate: 0.1875, label: "$1,000 – $3,000" },
  { minAmount: 3000, maxAmount: 5000, standardRate: 0.20, goldRate: 0.15, label: "$3,000 – $5,000" },
  { minAmount: 5000, maxAmount: null, standardRate: 0.15, goldRate: 0.1125, label: "Over $5,000 (negotiable)" },
];

export const GOLD_RATE_DISCOUNT = 0.25; // 25% off standard rate

// === LOAN-TO-VALUE RATIOS ===
// Percentage of estimated value we lend / buy at
export interface LTVConfig {
  loanLTV: number;
  buyLTV: number;
}

export const LTV_BY_CATEGORY: Record<string, LTVConfig> = {
  "jewellery-gold": { loanLTV: 0.40, buyLTV: 0.30 },
  "jewellery-other": { loanLTV: 0.50, buyLTV: 0.50 },
  "watches": { loanLTV: 0.50, buyLTV: 0.50 },
  "phones": { loanLTV: 0.50, buyLTV: 0.50 },
  "laptops": { loanLTV: 0.50, buyLTV: 0.50 },
  "tablets": { loanLTV: 0.50, buyLTV: 0.50 },
  "gaming": { loanLTV: 0.50, buyLTV: 0.50 },
  "tools": { loanLTV: 0.50, buyLTV: 0.50 },
  "cameras": { loanLTV: 0.50, buyLTV: 0.50 },
  "other": { loanLTV: 0.50, buyLTV: 0.50 },
};

export const DEFAULT_LTV: LTVConfig = { loanLTV: 0.50, buyLTV: 0.50 };

// === CONDITION MULTIPLIERS ===
// Applied to AI resale estimate ONLY (never to gold scrap value)
export const CONDITION_MULTIPLIERS: Record<string, number> = {
  "new": 1.0,
  "excellent": 0.85,
  "good": 0.70,
  "fair": 0.50,
  "poor": 0.30,
};

// === GOLD PRICING ===
export const GOLD_REFINING_MARGIN = 0.85; // 15% deducted for refining costs

// Gold purity by carat (fraction of 24k)
export const GOLD_PURITY: Record<string, number> = {
  "9ct": 9 / 24,   // 0.375 (37.5%)
  "10ct": 10 / 24, // 0.4167
  "14ct": 14 / 24, // 0.5833
  "18ct": 18 / 24, // 0.75
  "22ct": 22 / 24, // 0.9167
  "24ct": 24 / 24, // 1.0
};

// === FEES ===
export const FEES = {
  establishmentFee: 0,
  monthlyFee: 0,
  lateFee: 0, // within regulatory limits
  dishonourFee: 0,
  idVerificationFee: 2.00, // Stripe Identity per verification
};

// === LOAN TERMS ===
export const LOAN_TERM = {
  defaultMonths: 3,
  gracePeriodDays: 30,
  extension: "Pay interest to extend",
};

// === HELPER FUNCTIONS ===

/** Get the rate tier for a given loan amount */
export function getRateTier(loanAmount: number): RateTier {
  return LOAN_RATE_TIERS.find(
    (t) => loanAmount >= t.minAmount && (t.maxAmount === null || loanAmount < t.maxAmount)
  ) || LOAN_RATE_TIERS[LOAN_RATE_TIERS.length - 1];
}

/** Get the monthly interest rate for a loan amount, considering gold status */
export function getMonthlyRate(loanAmount: number, isGold: boolean): number {
  const tier = getRateTier(loanAmount);
  return isGold ? tier.goldRate : tier.standardRate;
}

/** Get LTV config for a category */
export function getLTV(category: string): LTVConfig {
  return LTV_BY_CATEGORY[category] || DEFAULT_LTV;
}

/** Get condition multiplier */
export function getConditionMultiplier(condition: string): number {
  return CONDITION_MULTIPLIERS[condition] || 0.70;
}

/** Calculate gold scrap value from live spot price */
export function calculateGoldScrapValue(
  spotPricePerGramAUD: number, // 24k spot price per gram
  weightGrams: number,
  carat: string
): number {
  const purity = GOLD_PURITY[carat] || GOLD_PURITY["9ct"];
  const pricePerGram = spotPricePerGramAUD * purity;
  return Math.round(pricePerGram * weightGrams * GOLD_REFINING_MARGIN);
}

/** Calculate loan amount from estimated value */
export function calculateLoanAmount(estimatedValue: number, category: string): number {
  const ltv = getLTV(category);
  return Math.round(estimatedValue * ltv.loanLTV / 10) * 10;
}

/** Calculate buy-outright amount from estimated value */
export function calculateBuyAmount(estimatedValue: number, category: string): number {
  const ltv = getLTV(category);
  return Math.round(estimatedValue * ltv.buyLTV / 10) * 10;
}

/** Format rate as percentage string */
export function formatRate(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

/** Convert numeric confidence to a customer-friendly label */
export function getConfidenceLabel(confidence: number): { label: string; color: string; description: string } {
  if (confidence >= 80) {
    return { label: "Strong estimate", color: "#00A87E", description: "Based on multiple matching sales and historical data." };
  } else if (confidence >= 60) {
    return { label: "Provisional", color: "#FF9500", description: "Based on limited data. Final offer confirmed after inspection." };
  } else {
    return { label: "Needs manual review", color: "#FF6B00", description: "Limited data available. Offer subject to in-person inspection." };
  }
}

// === AGE-BASED LTV TRIM ===
// Electronics depreciate with age. Trim LTV by 5% per year past age 2.
// Gold and watches are exempt (gold holds value, watches are model-dependent).
const ELECTRONICS_CATEGORIES = ["phones", "laptops", "tablets", "gaming", "cameras"];
const AGE_TRIM_PER_YEAR = 0.05; // 5% per year
const AGE_TRIM_START_YEAR = 2; // start trimming after 2 years
const MAX_AGE_TRIM = 0.20; // never trim more than 20% (floor at 80% of base LTV)

/** Estimate item age from model string (returns years, 0 = current) */
export function estimateItemAge(model: string): number {
  if (!model) return 0;
  // Look for year patterns: "iPhone 15" (2023), "2021", "Gen 3" (rough), "Series X"
  const yearMatch = model.match(/20(\d{2})/);
  if (yearMatch) {
    const year = 2000 + parseInt(yearMatch[1]);
    return Math.max(0, new Date().getFullYear() - year);
  }
  // iPhone model number → approximate age (15=2023, 14=2022, 13=2021, 12=2020)
  const iphoneMatch = model.match(/iPhone\s*(\d+)/i);
  if (iphoneMatch) {
    const gen = parseInt(iphoneMatch[1]);
    if (gen >= 12) {
      const baseYear = gen === 12 ? 2020 : gen === 13 ? 2021 : gen === 14 ? 2022 : gen === 15 ? 2023 : gen === 16 ? 2024 : 2025;
      return Math.max(0, new Date().getFullYear() - baseYear);
    }
  }
  // Galaxy S{N} → S24=2024, S23=2023, S22=2022, S21=2021
  const galaxyMatch = model.match(/Galaxy\s*S(\d+)/i);
  if (galaxyMatch) {
    const gen = parseInt(galaxyMatch[1]);
    if (gen >= 20) {
      const baseYear = 2000 + gen;
      return Math.max(0, new Date().getFullYear() - baseYear);
    }
  }
  return 0; // unknown age, no trim
}

/** Apply age-based LTV trim for electronics */
export function getAgeAdjustedLTV(category: string, model: string, baseLTV: number): number {
  if (!ELECTRONICS_CATEGORIES.includes(category)) return baseLTV;
  const age = estimateItemAge(model);
  if (age <= AGE_TRIM_START_YEAR) return baseLTV;
  const trim = Math.min((age - AGE_TRIM_START_YEAR) * AGE_TRIM_PER_YEAR, MAX_AGE_TRIM);
  return Math.max(baseLTV * (1 - trim), baseLTV * (1 - MAX_AGE_TRIM));
}
