"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useApp, QuoteResult } from "@/lib/AppContext";
import catalog from "@/catalog/pawnpass.json";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface Quote {
  estimated_value: number;
  loan_amount: number;
  buy_amount: number;
  interest_rate: string;
  is_gold: boolean;
  confidence: number;
  category: string;
  condition: string;
  brand: string;
  model: string;
  mock: boolean;
  message: string;
  engine?: string;
  sources?: string[];
  comparable_sales?: string[];
  gold_scrap_value?: number;
  gold_price_per_gram?: number;
  historical_ref?: any;
  historical_within_range?: boolean;
}

interface HistoricalHint {
  found: boolean;
  loan_estimate_min?: number;
  loan_estimate_max?: number;
  loan_estimate_avg?: number;
  sample_count?: number;
}

// Get categories from catalog
const CATALOG_CATEGORIES = Object.entries(catalog.categories || {}).map(([key, val]: [string, any]) => ({
  id: key,
  label: val.label,
  icon: val.icon,
  subcategories: val.subcategories,
  brands: val.brands,
  attributes: val.attributes,
}));

const CONDITIONS = [
  { id: "new", label: "New / Sealed", mult: "100%" },
  { id: "excellent", label: "Excellent", mult: "85%" },
  { id: "good", label: "Good", mult: "70%" },
  { id: "fair", label: "Fair", mult: "50%" },
  { id: "poor", label: "Poor / Damaged", mult: "30%" },
];

const PROGRESS_STEPS = [
  "Checking 3,000+ sold items...",
  "Searching live listings...",
  "Calculating your offer",
];

// ─── Count-up animation hook ───
function useCountUp(target: number, durationMs = 1500, run = true) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    if (!run || target <= 0) {
      if (run) setValue(0);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / durationMs, 1);
      // easeOutExpo for a snappy premium feel
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setValue(Math.round(target * eased));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setValue(target);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, durationMs, run]);
  return value;
}

export default function QuotePage() {
  const { setQuote } = useApp();
  const [step, setStep] = useState<"form" | "loading" | "result">("form");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [formState, setFormState] = useState<Record<string, any>>({});
  const [condition, setCondition] = useState("");

  // Backward-compatible aliases
  const brand = selectedBrand || (formState.brand as string) || "";
  const model = selectedModel || (formState.model as string) || "";
  const setBrand = (v: string) => { setSelectedBrand(v); setFormState(prev => ({ ...prev, brand: v })); };
  const setModel = (v: string) => { setSelectedModel(v); setFormState(prev => ({ ...prev, model: v })); };

  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [quoteData, setQuoteData] = useState<Quote | null>(null);

  // ─── Progressive valuation state ───
  const [hint, setHint] = useState<HistoricalHint | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [bgQuote, setBgQuote] = useState<Quote | null>(null); // background-prefetched quote
  const [bgQuotePending, setBgQuotePending] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [tipsOpen, setTipsOpen] = useState(false);

  // Track the latest background request so stale responses are ignored
  const bgReqId = useRef(0);
  const hintReqId = useRef(0);

  // ─── Historical hint: category-only ───
  useEffect(() => {
    if (!category) {
      setHint(null);
      return;
    }
    const id = ++hintReqId.current;
    setHintLoading(true);
    fetch(`/api/valuation/historical?category=${encodeURIComponent(category)}`)
      .then((r) => r.json())
      .then((data: HistoricalHint) => {
        if (id !== hintReqId.current) return; // stale
        setHint(data);
        setHintLoading(false);
      })
      .catch(() => {
        if (id !== hintReqId.current) return;
        setHint(null);
        setHintLoading(false);
      });
  }, [category]);

  // ─── Historical hint: category + brand (debounced 500ms) ───
  useEffect(() => {
    if (!category) return;
    const b = brand.trim();
    if (!b) return; // category-only hint already handled above
    const id = ++hintReqId.current;
    const t = setTimeout(() => {
      setHintLoading(true);
      fetch(
        `/api/valuation/historical?category=${encodeURIComponent(
          category
        )}&brand=${encodeURIComponent(b)}`
      )
        .then((r) => r.json())
        .then((data: HistoricalHint) => {
          if (id !== hintReqId.current) return;
          setHint(data);
          setHintLoading(false);
        })
        .catch(() => {
          if (id !== hintReqId.current) return;
          setHintLoading(false);
        });
    }, 500);
    return () => clearTimeout(t);
  }, [category, brand]);

  // ─── Background valuation: category + condition + brand + model (debounced 500ms) ───
  useEffect(() => {
    if (!category || !condition) {
      setBgQuote(null);
      setBgQuotePending(false);
      return;
    }
    const m = model.trim();
    const b = brand.trim();
    // Only fire background valuation once we have at least a model OR a brand to ground it.
    if (!b && !m) {
      setBgQuote(null);
      setBgQuotePending(false);
      return;
    }
    // Build model for jewellery gold regex
    const bgMetal = formState.metal || "";
    let bgModel = m || "";
    if (!bgModel && category === "jewellery") {
      const parts: string[] = [];
      if (formState.carat) parts.push(formState.carat);
      if (bgMetal) parts.push(bgMetal.toLowerCase().replace(/\s+/g, "-"));
      if (formState.weight_grams) parts.push(`${formState.weight_grams}g`);
      bgModel = parts.join(" ");
    }
    const id = ++bgReqId.current;
    const t = setTimeout(() => {
      setBgQuotePending(true);
      fetch("/api/valuation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          condition,
          brand: b,
          model: bgModel,
          description,
          photos: [],
        }),
      })
        .then((r) => r.json())
        .then((data: Quote) => {
          if (id !== bgReqId.current) return; // stale
          setBgQuote(data);
          setBgQuotePending(false);
        })
        .catch(() => {
          if (id !== bgReqId.current) return;
          setBgQuotePending(false);
        });
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, condition, brand, model, description]);

  // ─── Progress step cycling during loading ───
  useEffect(() => {
    if (step !== "loading") return;
    setProgressStep(0);
    const interval = setInterval(() => {
      setProgressStep((prev) => (prev < PROGRESS_STEPS.length - 1 ? prev + 1 : prev));
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  const animatedLoan = useCountUp(quoteData?.loan_amount ?? 0, 1500, step === "result" && !!quoteData);
  const animatedBuy = useCountUp(quoteData?.buy_amount ?? 0, 1500, step === "result" && !!quoteData);

  // ─── Photo helpers (unchanged logic) ───
  async function compressImage(file: File, maxWidth = 800, quality = 0.7): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let { width, height } = img;
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Canvas not supported"));
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const remaining = 4 - photos.length;
    const toProcess = files.slice(0, remaining);
    for (const file of toProcess) {
      if (!file.type.startsWith("image/")) continue;
      try {
        const compressed = await compressImage(file);
        setPhotos((prev) => [...prev, compressed]);
      } catch (err) {
        console.error("Photo compression failed:", err);
      }
    }
    e.target.value = "";
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  // ─── Get Quote: prefer background-prefetched result for instant reveal ───
  async function getQuote() {
    setStep("loading");
    setProgressStep(0);

    // If we already have a fresh background result matching current inputs, show instantly.
    const fresh = bgQuote && bgQuotePending === false;
    if (fresh) {
      const data = bgQuote as Quote;
      const quoteResult: QuoteResult = {
        ...data,
        description,
        photo_count: photos.length,
        created_at: new Date().toISOString(),
      };
      setQuote(quoteResult);
      setQuoteData(data);
      // Tiny delay so the progress shimmer is visible even on instant reveals (feels premium).
      setTimeout(() => setStep("result"), 350);
      return;
    }

    // Otherwise fire the real request now.
    // Map category: jewellery with gold metal → jewellery-gold, silver/platinum → jewellery-other
    const metal = formState.metal || "";
    const isGoldMetal = ["Yellow Gold", "White Gold", "Rose Gold", "Two-Tone"].includes(metal);
    const apiCategory = category === "jewellery" ? (isGoldMetal ? "jewellery-gold" : "jewellery-other") : category;
    
    // Build a model string that the gold regex can parse for jewellery items
    // e.g. "9ct yellow-gold chain-necklace 20g" so the API can extract carat (9ct) and weight (20g)
    let apiModel = selectedModel || "";
    if (!apiModel && category === "jewellery") {
      const parts: string[] = [];
      if (formState.carat) parts.push(formState.carat);
      if (metal) parts.push(metal.toLowerCase().replace(/\s+/g, "-"));
      if (subcategory) parts.push(subcategory.toLowerCase().replace(/[/\s]+/g, "-"));
      if (formState.weight_grams) parts.push(`${formState.weight_grams}g`);
      apiModel = parts.join(" ");
    }
    
    // Build description from formState if not manually entered
    const formDescription = description || Object.entries(formState)
      .filter(([k]) => !["brand", "model"].includes(k))
      .map(([k, v]) => v ? `${k}: ${v}` : null)
      .filter(Boolean)
      .join(", ");
    
    try {
      const res = await fetch("/api/valuation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: apiCategory,
          condition,
          brand,
          model: apiModel,
          description: formDescription,
          photos: photos,
          formState,
        }),
      });
      const data = (await res.json()) as Quote;
      const quoteResult: QuoteResult = {
        ...data,
        description,
        photo_count: photos.length,
        created_at: new Date().toISOString(),
      };
      setQuote(quoteResult);
      setQuoteData(data);
      setStep("result");
    } catch (err) {
      console.error("Quote failed:", err);
      setStep("form");
    }
  }

  const canSubmit = category && condition;

  // ─── Hint text ───
  const hintText =
    hintLoading && !hint
      ? "Searching typical loan ranges..."
      : hint && hint.found && hint.loan_estimate_min != null && hint.loan_estimate_max != null
      ? `Typical loans: $${hint.loan_estimate_min.toLocaleString()}–$${hint.loan_estimate_max.toLocaleString()}`
      : hint && !hint.found
      ? "We'll value this item live for you"
      : null;

  // ─── Value improvement tips (anchor-and-adjust) ───
  const tips = buildTips(category, brand, model, description, condition);

  return (
    <div className="min-h-screen" style={{ background: "#0A0A0A" }}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {["Quote", "Shipping", "Payment"].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  i === 0 ? "text-white" : "text-gray-500"
                }`}
                style={i === 0 ? { background: "#FF6B00" } : { background: "rgba(255,255,255,0.06)" }}
              >
                {i + 1}
              </div>
              <span
                className={`text-sm font-medium ${i === 0 ? "text-white" : "text-gray-500"}`}
              >
                {label}
              </span>
              {i < 2 && <div className="w-12 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />}
            </div>
          ))}
        </div>

        {/* FORM STEP */}
        {step === "form" && (
          <div>
            <h1 className="text-3xl font-bold mb-2 text-white">Get your instant quote</h1>
            <p className="text-sm text-gray-400 mb-8">
              Tell us about your item. Our AI gives you a loan and buy price in seconds.
            </p>

            {/* Category */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-white mb-3">
                What are you pawning?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {CATALOG_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setCategory(cat.id); setSubcategory(""); setSelectedBrand(""); setSelectedModel(""); setFormState({}); }}
                    className={`rounded-xl p-3 text-center border-2 transition-all hover:scale-[1.02] ${
                      category === cat.id
                        ? "border-[#FF6B00] bg-[#FF6B00]/10"
                        : "border-white/10 bg-white/[0.03] hover:border-white/20"
                    }`}
                  >
                    <div className="text-2xl mb-1">{cat.icon}</div>
                    <div className="text-xs font-medium text-gray-300">{cat.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic form fields based on selected category */}
            {category && (() => {
              const cat = CATALOG_CATEGORIES.find(c => c.id === category);
              if (!cat) return null;
              return (
                <>
                  {/* Subcategory */}
                  {cat.subcategories && cat.subcategories.length > 0 && (
                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-white mb-2">Type</label>
                      <select
                        value={subcategory}
                        onChange={(e) => setSubcategory(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-[#FF6B00] transition-colors"
                      >
                        <option value="">Select type...</option>
                        {cat.subcategories.map((sub: string) => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Brand dropdown */}
                  {cat.brands && Object.keys(cat.brands).length > 0 && (
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-semibold text-white mb-2">Brand</label>
                        <select
                          value={selectedBrand}
                          onChange={(e) => { setSelectedBrand(e.target.value); setSelectedModel(""); setFormState(prev => ({ ...prev, brand: e.target.value })); }}
                          className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-[#FF6B00] transition-colors"
                        >
                          <option value="">Select brand...</option>
                          {Object.keys(cat.brands).map((b: string) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>
                      {/* Model dropdown (cascading from brand) */}
                      {selectedBrand && cat.brands[selectedBrand] && (
                        <div>
                          <label className="block text-sm font-semibold text-white mb-2">Model</label>
                          <select
                            value={selectedModel}
                            onChange={(e) => { setSelectedModel(e.target.value); setFormState(prev => ({ ...prev, model: e.target.value })); }}
                            className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-[#FF6B00] transition-colors"
                          >
                            <option value="">Select model...</option>
                            {cat.brands[selectedBrand].map((m: string) => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Attributes */}
                  {cat.attributes && cat.attributes.map((attr: any) => {
                    // Check showIf condition
                    if (attr.showIf) {
                      const field = Object.keys(attr.showIf)[0];
                      const expected = attr.showIf[field];
                      const actual = formState[field] || (field === "brand" ? selectedBrand : "");
                      if (Array.isArray(expected)) {
                        if (!expected.includes(actual)) return null;
                      } else if (actual !== expected) {
                        return null;
                      }
                    }

                    const val = formState[attr.name] || "";
                    const setVal = (v: any) => setFormState(prev => ({ ...prev, [attr.name]: v }));

                    return (
                      <div key={attr.name} className="mb-4">
                        <label className="block text-sm font-semibold text-white mb-2">
                          {attr.label}
                          {attr.required && <span className="text-[#FF6B00]"> *</span>}
                        </label>
                        {attr.type === "select" && (
                          <select
                            value={val}
                            onChange={(e) => setVal(e.target.value)}
                            className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-[#FF6B00] transition-colors"
                          >
                            <option value="">Select...</option>
                            {attr.options.map((opt: string) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        )}
                        {attr.type === "text" && (
                          <input
                            type="text"
                            value={val}
                            onChange={(e) => setVal(e.target.value)}
                            placeholder={attr.placeholder || ""}
                            className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#FF6B00] transition-colors"
                          />
                        )}
                        {attr.type === "number" && (
                          <input
                            type="number"
                            value={val}
                            onChange={(e) => setVal(parseFloat(e.target.value) || 0)}
                            min={attr.min}
                            max={attr.max}
                            step={attr.step}
                            placeholder={attr.hint || ""}
                            className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#FF6B00] transition-colors"
                          />
                        )}
                        {attr.type === "slider" && (
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              value={val || attr.min || 0}
                              onChange={(e) => setVal(parseInt(e.target.value))}
                              min={attr.min}
                              max={attr.max}
                              step={attr.step}
                              className="flex-1 accent-[#FF6B00]"
                            />
                            <span className="text-sm text-gray-300 w-12 text-right">{val || attr.min || 0}{attr.unit || ""}</span>
                          </div>
                        )}
                        {attr.hint && attr.type !== "number" && (
                          <p className="text-xs text-gray-500 mt-1">{attr.hint}</p>
                        )}
                      </div>
                    );
                  })}
                </>
              );
            })()}

            {/* Condition */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-white mb-3">Condition</label>
              <div className="space-y-2">
                {CONDITIONS.map((cond) => (
                  <button
                    key={cond.id}
                    onClick={() => setCondition(cond.id)}
                    className={`w-full text-left rounded-xl p-4 border-2 transition-all hover:scale-[1.01] flex items-center justify-between ${
                      condition === cond.id
                        ? "border-[#FF6B00] bg-[#FF6B00]/10"
                        : "border-white/10 bg-white/[0.03] hover:border-white/20"
                    }`}
                  >
                    <span className="text-sm font-medium text-gray-200">{cond.label}</span>
                    <span className="text-xs text-gray-500">Value: {cond.mult}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Progressive hint */}
            {hintText && (
              <div className="mb-6 flex items-center gap-2 text-sm">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    hintLoading ? "animate-pulse" : ""
                  }`}
                  style={{ background: "#00A87E" }}
                />
                <span className="text-gray-400">{hintText}</span>
                {bgQuotePending && (
                  <span className="text-xs text-gray-500 animate-pulse">
                    · searching market...
                  </span>
                )}
              </div>
            )}

            {/* Description */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-white mb-2">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Any details that affect value — scratches, accessories, original packaging, etc."
                rows={3}
                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#FF6B00] transition-colors resize-none"
              />
            </div>

            {/* Photos */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-white mb-2">
                Photos ({photos.length}/4)
              </label>
              {(() => {
                const photoHints: Record<string, string[]> = {
                  jewellery: [
                    "📸 Photo 1: Full item, flat, good lighting",
                    "📸 Photo 2: Hallmark/stamp (e.g. '375' for 9ct, '750' for 18ct)",
                    "📸 Photo 3: Clasp or fitting (if chain/bracelet)",
                    "📸 Photo 4: Any maker's mark or engraving"
                  ],
                  watches: [
                    "📸 Photo 1: Dial face, straight on",
                    "📸 Photo 2: Caseback (shows model/serial)",
                    "📸 Photo 3: Crown and side profile",
                    "📸 Photo 4: Box, papers, or receipt if available"
                  ],
                  phones: [
                    "📸 Photo 1: Front screen (show any damage)",
                    "📸 Photo 2: Back of phone",
                    "📸 Photo 3: All four edges/corners",
                    "📸 Photo 4: Settings → About (shows model & storage)"
                  ],
                  laptops: [
                    "📸 Photo 1: Open laptop, screen on",
                    "📸 Photo 2: Bottom (serial number visible)",
                    "📸 Photo 3: Any dents or damage",
                    "📸 Photo 4: Charger if included"
                  ],
                  gaming: [
                    "📸 Photo 1: Front of console",
                    "📸 Photo 2: Back ports (show any damage)",
                    "📸 Photo 3: Controllers and accessories",
                    "📸 Photo 4: Original box if available"
                  ],
                  tools: [
                    "📸 Photo 1: Main tool, clear view",
                    "📸 Photo 2: Model/serial number plate",
                    "📸 Photo 3: Batteries and charger",
                    "📸 Photo 4: Case if included"
                  ],
                  cameras: [
                    "📸 Photo 1: Front of camera with lens",
                    "📸 Photo 2: Back screen and controls",
                    "📸 Photo 3: Model number on body",
                    "📸 Photo 4: Lens cap, battery, charger"
                  ],
                };
                const hints = photoHints[category] || [
                  "📸 Photo 1: Full item, clear and well-lit",
                  "📸 Photo 2: Any model numbers or markings",
                  "📸 Photo 3: Any damage or wear",
                  "📸 Photo 4: Accessories if included"
                ];
                return (
                  <div className="rounded-lg p-3 mb-3" style={{ background: "rgba(255,107,0,0.05)", border: "1px solid rgba(255,107,0,0.15)" }}>
                    {hints.map((hint, i) => (
                      <p key={i} className="text-xs text-gray-400 leading-relaxed">{hint}</p>
                    ))}
                  </div>
                );
              })()}
              <p className="text-xs text-gray-500 mb-3">
                Upload up to 4 photos. Good lighting and clear shots get better quotes.
              </p>
              <div className="grid grid-cols-4 gap-3">
                {photos.map((photo, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-xl border-2 border-[#FF6B00] bg-[#FF6B00]/10 overflow-hidden relative"
                  >
                    <img src={photo} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {photos.length < 4 && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-white/15 bg-white/[0.03] hover:border-white/30 flex items-center justify-center cursor-pointer transition-all">
                    <span className="text-3xl text-gray-400">+</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={getQuote}
              disabled={!canSubmit}
              className="w-full rounded-full py-4 text-base font-medium text-white transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ background: "#FF6B00" }}
            >
              Get my instant quote →
            </button>

            {bgQuote && !bgQuotePending && (
              <p className="text-center text-xs text-gray-500 mt-3">
                ✓ Your quote is ready — tap above to reveal it instantly
              </p>
            )}
          </div>
        )}

        {/* LOADING STEP — skeleton shimmer + progress steps */}
        {step === "loading" && (
          <div className="py-12">
            {/* Animated progress steps */}
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-2 mb-4">
                {PROGRESS_STEPS.map((s, i) => (
                  <div key={s} className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === progressStep ? "scale-125" : ""
                      }`}
                      style={{
                        background: i <= progressStep ? "#FF6B00" : "rgba(255,255,255,0.15)",
                      }}
                    />
                    <span
                      className={`text-xs transition-colors ${
                        i === progressStep ? "text-white" : "text-gray-400"
                      }`}
                    >
                      {s}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 animate-pulse">
                {PROGRESS_STEPS[progressStep]}
              </p>
            </div>

            {/* Skeleton shimmer quote cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl p-6 border-2 border-white/10 bg-white/[0.02] relative overflow-hidden"
                >
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
                  <div className="h-5 w-24 rounded-full bg-white/[0.06] mb-4" />
                  <div className="h-9 w-28 rounded-md bg-white/[0.08] mb-2" />
                  <div className="h-3 w-32 rounded bg-white/[0.05] mb-4" />
                  <div className="space-y-2">
                    <div className="h-3 w-full rounded bg-white/[0.05]" />
                    <div className="h-3 w-full rounded bg-white/[0.05]" />
                    <div className="h-3 w-2/3 rounded bg-white/[0.05]" />
                  </div>
                </div>
              ))}
            </div>
            {/* Skeleton item summary */}
            <div className="rounded-2xl p-5 border border-white/10 bg-white/[0.02] relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
              <div className="h-3 w-24 rounded bg-white/[0.06] mb-4" />
              <div className="space-y-2">
                <div className="h-3 w-full rounded bg-white/[0.05]" />
                <div className="h-3 w-full rounded bg-white/[0.05]" />
                <div className="h-3 w-2/3 rounded bg-white/[0.05]" />
              </div>
            </div>
          </div>
        )}

        {/* RESULT STEP */}
        {step === "result" && quoteData && (
          <div>
            <div className="text-center mb-8">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "#00A87E" }}
              >
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold mb-2 text-white">Your instant quote</h1>
              <p className="text-sm text-gray-400">
                Quote valid for 48 hours · Subject to physical inspection
              </p>
            </div>

            {/* Quote cards */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {/* Pawn Loan */}
              <div
                className="rounded-2xl p-6 border-2 bg-white/[0.02] relative"
                style={{ borderColor: "#FF6B00" }}
              >
                <div
                  className="absolute -top-3 left-4 px-3 py-1 rounded-full text-xs font-medium text-white"
                  style={{ background: "#FF6B00" }}
                >
                  PAWN LOAN
                </div>
                <div className="text-3xl font-bold mb-1" style={{ color: "#FF6B00" }}>
                  ${animatedLoan.toLocaleString()}
                </div>
                <p className="text-xs text-gray-500 mb-3">Borrow against your item</p>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Rate</span>
                    <span className="font-medium text-gray-200">{quoteData.interest_rate}/mo</span>
                  </div>
                  {quoteData.is_gold && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Gold rate</span>
                      <span className="font-medium" style={{ color: "#00A87E" }}>
                        25% off ✓
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Buy Outright */}
              <div className="rounded-2xl p-6 border-2 border-white/10 bg-white/[0.02] relative">
                <div className="absolute -top-3 left-4 px-3 py-1 rounded-full text-xs font-medium text-white bg-gray-800">
                  SELL NOW
                </div>
                <div className="text-3xl font-bold mb-1 text-white">
                  ${animatedBuy.toLocaleString()}
                </div>
                <p className="text-xs text-gray-500 mb-3">We buy your item outright</p>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">No loan</span>
                    <span className="font-medium text-gray-200">Item is ours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment</span>
                    <span className="font-medium text-gray-200">Instant Osko</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">No callback</span>
                    <span className="font-medium text-gray-200">Walk away</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Confidence label + provisional language */}
            <div className="flex items-center gap-3 mb-6 px-4 py-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              {(() => {
                const conf = quoteData.confidence;
                const label = conf >= 80 ? "Strong estimate" : conf >= 60 ? "Provisional" : "Needs manual review";
                const color = conf >= 80 ? "#00A87E" : conf >= 60 ? "#FF9500" : "#FF6B00";
                return (
                  <>
                    <span className="inline-block w-2 h-2 rounded-full" style={{ background: color }} />
                    <span className="text-sm font-medium" style={{ color }}>{label}</span>
                    <span className="text-xs text-gray-500">·</span>
                    <span className="text-xs text-gray-500">This is a provisional quote. Final offer confirmed after physical inspection at our hub.</span>
                  </>
                );
              })()}
            </div>

            {/* Item summary */}
            <div className="rounded-2xl p-5 bg-white/[0.02] border border-white/10 mb-6">
              <h4 className="text-xs font-semibold text-gray-500 mb-3">ITEM DETAILS</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Category</span>
                  <span className="font-medium text-gray-200">
                    {CATALOG_CATEGORIES.find((c) => c.id === quoteData.category)?.label || quoteData.category}
                  </span>
                </div>
                {quoteData.brand && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Brand</span>
                    <span className="font-medium text-gray-200">{quoteData.brand}</span>
                  </div>
                )}
                {quoteData.model && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Model</span>
                    <span className="font-medium text-gray-200">{quoteData.model}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Condition</span>
                  <span className="font-medium text-gray-200 capitalize">{quoteData.condition}</span>
                </div>
                {quoteData.engine && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Valuation engine</span>
                    <span className="font-mono text-xs" style={{ color: quoteData.engine === "perplexity" ? "#00A87E" : "#FF9500" }}>
                      {quoteData.engine === "perplexity" ? "● LIVE (Perplexity)" : quoteData.engine === "tavily" ? "● FALLBACK (Tavily)" : "○ mock"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Gold scrap value — show for gold items */}
            {quoteData.is_gold && quoteData.gold_scrap_value && (
              <div className="rounded-2xl p-5 mb-6" style={{ background: "rgba(255,107,0,0.04)", border: "1px solid rgba(255,107,0,0.15)" }}>
                <h4 className="text-xs font-semibold mb-3" style={{ color: "#FF6B00" }}>LIVE GOLD PRICING</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Gold scrap value (melt)</span>
                    <span className="font-medium text-gray-200">${quoteData.gold_scrap_value}</span>
                  </div>
                  {quoteData.gold_price_per_gram && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Live price (18k/g)</span>
                      <span className="font-mono text-xs text-gray-400">${quoteData.gold_price_per_gram}/g AUD</span>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 pt-2">Scrap value = live gold price × weight × 0.85 (refining margin). System uses the higher of AI estimate or scrap value.</p>
                </div>
              </div>
            )}

            {/* Comparable sales — show count only, not prices or links */}
            {quoteData.comparable_sales && quoteData.comparable_sales.length > 0 && (
              <div className="rounded-2xl p-5 bg-white/[0.02] border border-white/10 mb-6">
                <h4 className="text-xs font-semibold text-gray-500 mb-3">HOW WE PRICED THIS</h4>
                <p className="text-sm text-gray-400 mb-2">
                  Your quote is based on {quoteData.comparable_sales.length} comparable sales found by our AI across Australian marketplaces.
                </p>
                {quoteData.sources && quoteData.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <p className="text-[10px] text-gray-400 font-mono mb-1">SEARCHED ACROSS</p>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(new Set(
                        quoteData.sources.map((src: string) =>
                          src.replace(/^https?:\/\/(www\.)?/, "").split("/")[0].replace("www.", "")
                        )
                      )).slice(0, 5).map((domain: string, i: number) => (
                        <span key={i} className="text-xs text-gray-500 px-2 py-1 rounded" style={{ background: "rgba(255,255,255,0.03)" }}>
                          {domain}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {quoteData.historical_ref && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <p className="text-[10px] text-gray-400 font-mono mb-1">CROSS-REFERENCED WITH</p>
                    <p className="text-xs text-gray-500">
                      {quoteData.historical_ref.sample_count} historical sales of {quoteData.historical_ref.brand} {quoteData.historical_ref.category}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Value improvement tips — collapsible */}
            {tips.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] mb-6 overflow-hidden">
                <button
                  onClick={() => setTipsOpen((v) => !v)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/[0.03]"
                >
                  <span className="text-sm font-semibold text-white">
                    💡 Get more for your item
                  </span>
                  <span
                    className="text-gray-500 transition-transform"
                    style={{ transform: tipsOpen ? "rotate(180deg)" : "none" }}
                  >
                    ▾
                  </span>
                </button>
                {tipsOpen && (
                  <div className="px-5 pb-5 space-y-2">
                    {tips.map((t, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-sm py-2 border-t border-white/5"
                      >
                        <span className="text-gray-400">{t.label}</span>
                        <span className="font-medium" style={{ color: "#00A87E" }}>
                          {t.boost}
                        </span>
                      </div>
                    ))}
                    <p className="text-xs text-gray-400 pt-2">
                      Mention these when you ship — our hub team re-checks every item before
                      finalising your offer.
                    </p>
                  </div>
                )}
              </div>
            )}

            {quoteData.confidence < 75 && (
              <div
                className="rounded-xl p-4 mb-6 text-sm text-gray-300"
                style={{ background: "rgba(255,149,0,0.08)", border: "1px solid rgba(255,149,0,0.3)" }}
              >
                <span className="font-medium text-white">⚠ Lower confidence quote</span> — Final
                amount confirmed after physical inspection at our hub. If the value is lower than
                quoted, you can accept the adjusted offer or we return your item free of charge.
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <a
                href="/shipping"
                className="w-full rounded-full py-4 text-base font-medium text-white text-center transition-all hover:scale-[1.02]"
                style={{ background: "#FF6B00" }}
              >
                Accept & ship my item →
              </a>
              <button
                onClick={() => {
                  setStep("form");
                  setQuoteData(null);
                  setBgQuote(null);
                }}
                className="w-full rounded-full py-4 text-base font-medium text-gray-200 border-2 border-white/15 transition-all hover:scale-[1.02] hover:border-white/30"
              >
                Get another quote
              </button>
            </div>

            {quoteData.mock ? (
              <p className="text-center text-xs text-gray-400 mt-4">
                Running in demo mode — valuations are simulated
              </p>
            ) : (
              <p className="text-center text-xs text-gray-400 mt-4">
                Live valuation by {quoteData.engine === "perplexity" ? "Perplexity Sonar API" : quoteData.engine === "tavily" ? "Tavily Search API" : "AI engine"} · Prices in AUD · {quoteData.is_gold && "Gold pricing via GoldAPI.io · "}Subject to physical inspection
              </p>
            )}
          </div>
        )}
      </div>

      {/* Shimmer keyframes (Tailwind v4 — defined inline via a style tag) */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

// ─── Value improvement tips (anchor-and-adjust strategy) ───
function buildTips(
  category: string,
  brand: string,
  model: string,
  description: string,
  condition: string
): { label: string; boost: string }[] {
  const tips: { label: string; boost: string }[] = [];
  const text = `${model} ${brand} ${description || ""}`.toLowerCase();

  // Phones with battery health < 85%
  if (category === "phones") {
    const batteryMatch = text.match(/battery\s*(\d{1,3})\s*%/);
    const mentionsBattery = text.includes("battery");
    const low =
      (batteryMatch && parseInt(batteryMatch[1]) < 85) ||
      (mentionsBattery && !text.includes("good battery"));
    if (low || condition === "fair" || condition === "poor") {
      tips.push({ label: "Replace battery (under 85% health)", boost: "+$80–$120" });
    }
  }

  // Universal tips — most customers won't act, which keeps the anchor low.
  tips.push({ label: "Include original charger and box", boost: "+$20–$50" });
  tips.push({ label: "Clean and remove scratches", boost: "+$10–$30" });
  tips.push({ label: "Include original case/accessories", boost: "+$15–$40" });

  return tips;
}
