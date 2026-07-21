"use client";

import { useState } from "react";
import { useApp, QuoteResult } from "@/lib/AppContext";

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
}

const CATEGORIES = [
  { id: "jewellery-gold", label: "Gold & Jewellery", icon: "💍" },
  { id: "watches", label: "Watches", icon: "⌚" },
  { id: "phones", label: "Phones", icon: "📱" },
  { id: "laptops", label: "Laptops", icon: "💻" },
  { id: "tablets", label: "Tablets", icon: "📲" },
  { id: "gaming", label: "Gaming Consoles", icon: "🎮" },
  { id: "tools", label: "Tools & Equipment", icon: "🔧" },
  { id: "cameras", label: "Cameras", icon: "📷" },
  { id: "other", label: "Other", icon: "📦" },
];

const CONDITIONS = [
  { id: "new", label: "New / Sealed", mult: "100%" },
  { id: "excellent", label: "Excellent", mult: "85%" },
  { id: "good", label: "Good", mult: "70%" },
  { id: "fair", label: "Fair", mult: "50%" },
  { id: "poor", label: "Poor / Damaged", mult: "30%" },
];

export default function QuotePage() {
  const { setQuote } = useApp();
  const [step, setStep] = useState<"form" | "loading" | "result">("form");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [quoteData, setQuoteData] = useState<Quote | null>(null);

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

  async function getQuote() {
    setStep("loading");
    try {
      const res = await fetch("/api/valuation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          condition,
          brand,
          model,
          description,
          photos: photos,
        }),
      });
      const data = await res.json();
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="px-6 md:px-12 lg:px-20 flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ background: "#FF6B00" }}>P</div>
            <span className="text-xl font-bold tracking-tight">PawnPass</span>
          </a>
          <a href="/" className="text-sm font-medium text-gray-600 hover:text-black">← Home</a>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {["Quote", "Shipping", "Payment"].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${i === 0 ? "text-white" : "text-gray-400 bg-gray-200"}`} style={i === 0 ? { background: "#FF6B00" } : {}}>
                {i + 1}
              </div>
              <span className={`text-sm font-medium ${i === 0 ? "text-gray-900" : "text-gray-400"}`}>{label}</span>
              {i < 2 && <div className="w-12 h-px bg-gray-200" />}
            </div>
          ))}
        </div>

        {/* FORM STEP */}
        {step === "form" && (
          <div>
            <h1 className="text-3xl font-bold mb-2">Get your instant quote</h1>
            <p className="text-gray-600 mb-8">Tell us about your item. Our AI gives you a loan and buy price in seconds.</p>

            {/* Category */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-3">What are you pawning?</label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`rounded-xl p-3 text-center border-2 transition-all ${category === cat.id ? "border-orange-500 bg-orange-50" : "border-gray-200 bg-white hover:border-gray-300"}`}
                  >
                    <div className="text-2xl mb-1">{cat.icon}</div>
                    <div className="text-xs font-medium">{cat.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Condition */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Condition</label>
              <div className="space-y-2">
                {CONDITIONS.map((cond) => (
                  <button
                    key={cond.id}
                    onClick={() => setCondition(cond.id)}
                    className={`w-full text-left rounded-xl p-4 border-2 transition-all flex items-center justify-between ${condition === cond.id ? "border-orange-500 bg-orange-50" : "border-gray-200 bg-white hover:border-gray-300"}`}
                  >
                    <span className="text-sm font-medium">{cond.label}</span>
                    <span className="text-xs text-gray-400">Value: {cond.mult}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Brand & Model */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Brand</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Apple, Rolex, Sony"
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Model</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. iPhone 15 Pro"
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Any details that affect value — scratches, accessories, original packaging, etc."
                rows={3}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 resize-none"
              />
            </div>

            {/* Photos */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Photos ({photos.length}/4)</label>
              <p className="text-xs text-gray-500 mb-3">Upload up to 4 photos. Good lighting and clear shots get better quotes.</p>
              <div className="grid grid-cols-4 gap-3">
                {photos.map((photo, i) => (
                  <div key={i} className="aspect-square rounded-xl border-2 border-orange-500 bg-orange-50 overflow-hidden relative">
                    <img src={photo} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center"
                    >✕</button>
                  </div>
                ))}
                {photos.length < 4 && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 bg-white hover:border-gray-400 flex items-center justify-center cursor-pointer transition-all">
                    <span className="text-3xl text-gray-300">+</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
                  </label>
                )}
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={getQuote}
              disabled={!canSubmit}
              className="w-full rounded-full py-4 text-base font-medium text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "#FF6B00" }}
            >
              Get my instant quote →
            </button>
          </div>
        )}

        {/* LOADING STEP */}
        {step === "loading" && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin mx-auto mb-6" />
            <h2 className="text-xl font-semibold mb-2">Analysing your item...</h2>
            <p className="text-gray-500 text-sm">Comparing against market data, recent sales, and condition grading</p>
          </div>
        )}

        {/* RESULT STEP */}
        {step === "result" && quoteData && (
          <div>
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#00A87E" }}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold mb-2">Your instant quote</h1>
              <p className="text-sm text-gray-500">Quote valid for 48 hours · Confidence: {quoteData.confidence}%</p>
            </div>

            {/* Quote cards */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {/* Pawn Loan */}
              <div className="rounded-2xl p-6 border-2 border-orange-500 bg-white relative">
                <div className="absolute -top-3 left-4 px-3 py-1 rounded-full text-xs font-medium text-white" style={{ background: "#FF6B00" }}>
                  PAWN LOAN
                </div>
                <div className="text-3xl font-bold mb-1" style={{ color: "#FF6B00" }}>${quoteData.loan_amount}</div>
                <p className="text-xs text-gray-500 mb-3">Borrow against your item</p>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-gray-500">Rate</span><span className="font-medium">{quoteData.interest_rate}/mo</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Est. value</span><span className="font-medium">${quoteData.estimated_value}</span></div>
                  {quoteData.is_gold && <div className="flex justify-between"><span className="text-gray-500">Gold rate</span><span className="font-medium" style={{ color: "#00A87E" }}>25% off ✓</span></div>}
                </div>
              </div>

              {/* Buy Outright */}
              <div className="rounded-2xl p-6 border-2 border-gray-200 bg-white relative">
                <div className="absolute -top-3 left-4 px-3 py-1 rounded-full text-xs font-medium text-white bg-gray-800">
                  SELL NOW
                </div>
                <div className="text-3xl font-bold mb-1 text-gray-900">${quoteData.buy_amount}</div>
                <p className="text-xs text-gray-500 mb-3">We buy your item outright</p>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-gray-500">No loan</span><span className="font-medium">Item is ours</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Payment</span><span className="font-medium">Instant Osko</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">No callback</span><span className="font-medium">Walk away</span></div>
                </div>
              </div>
            </div>

            {/* Item summary */}
            <div className="rounded-2xl p-5 bg-white border border-gray-200 mb-6">
              <h4 className="text-xs font-semibold text-gray-500 mb-3">ITEM DETAILS</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Category</span><span className="font-medium">{CATEGORIES.find(c => c.id === quoteData.category)?.label || quoteData.category}</span></div>
                {quoteData.brand && <div className="flex justify-between"><span className="text-gray-500">Brand</span><span className="font-medium">{quoteData.brand}</span></div>}
                {quoteData.model && <div className="flex justify-between"><span className="text-gray-500">Model</span><span className="font-medium">{quoteData.model}</span></div>}
                <div className="flex justify-between"><span className="text-gray-500">Condition</span><span className="font-medium capitalize">{quoteData.condition}</span></div>
              </div>
            </div>

            {quoteData.confidence < 75 && (
              <div className="rounded-xl p-4 mb-6 text-sm" style={{ background: "#FFF8E1", border: "1px solid #FFE082" }}>
                <span className="font-medium">⚠ Lower confidence quote</span> — Final amount confirmed after physical inspection at our hub. If the value is lower than quoted, you can accept the adjusted offer or we return your item free of charge.
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <a href="/shipping" className="w-full rounded-full py-4 text-base font-medium text-white text-center" style={{ background: "#FF6B00" }}>
                Accept & ship my item →
              </a>
              <button onClick={() => setStep("form")} className="w-full rounded-full py-4 text-base font-medium border-2 border-gray-300">
                Get another quote
              </button>
            </div>

            {quoteData.mock && (
              <p className="text-center text-xs text-gray-400 mt-4">Running in demo mode — valuations are simulated</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
