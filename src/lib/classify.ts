/**
 * Grievance classification: Gemini AI when API key is set, keyword-based fallback otherwise.
 */
import { GoogleGenAI } from "@google/genai";

const GEMINI_MODEL = "gemini-2.0-flash";

const KEYWORDS: Record<string, string[]> = {
  water: ["water", "tap", "supply", "pipeline", "leak", "no water", "drinking", "borewell"],
  roads: ["road", "pothole", "street", "asphalt", "repair", "damage", "accident"],
  sanitation: ["garbage", "sanitation", "waste", "bin", "clean", "drain", "sewage"],
};

const CATEGORIES: Record<string, string[]> = {
  water: ["supply", "quality", "leak", "other"],
  roads: ["pothole", "repair", "light", "other"],
  sanitation: ["garbage", "drain", "cleaning", "other"],
  general: ["other"],
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function scoreDepartment(text: string): { department: string; score: number }[] {
  const tokens = tokenize(text);
  const scores: Record<string, number> = { water: 0, roads: 0, sanitation: 0, general: 0 };

  for (const [dept, words] of Object.entries(KEYWORDS)) {
    for (const w of words) {
      if (tokens.some((t) => t.includes(w) || w.includes(t))) scores[dept]++;
    }
  }

  const max = Math.max(...Object.values(scores), 1);
  if (max === 0) return [{ department: "general", score: 1 }];

  return (Object.entries(scores) as [string, number][])
    .filter(([, s]) => s > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([department, score]) => ({ department, score: score / max }));
}

function pickCategory(department: string, text: string): string {
  const cats = CATEGORIES[department] ?? CATEGORIES.general;
  const tokens = tokenize(text);
  for (const c of cats) {
    if (c === "other") continue;
    if (tokens.some((t) => t.includes(c))) return c;
  }
  return cats[0] ?? "other";
}

function suggestUrgency(text: string): "low" | "normal" | "high" {
  const lower = text.toLowerCase();
  if (/\b(emergency|urgent|immediately|no water|whole area|everyone)\b/.test(lower)) return "high";
  if (/\b(when possible|minor|small)\b/.test(lower)) return "low";
  return "normal";
}

export interface ClassificationResult {
  department: string;
  category: string;
  urgency: "low" | "normal" | "high";
  confidence: number;
}

/** Keyword-based classification (sync, always works) */
export function classifyGrievance(description: string): ClassificationResult {
  const [top] = scoreDepartment(description);
  const department = top?.department ?? "general";
  const category = pickCategory(department, description);
  const urgency = suggestUrgency(description);
  return {
    department,
    category,
    urgency,
    confidence: top?.score ?? 0.5,
  };
}

/** Gemini AI classification when GEMINI_API_KEY is set */
export async function classifyGrievanceWithGemini(description: string): Promise<ClassificationResult | null> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Classify this citizen grievance into department, category, and urgency. Reply with ONLY valid JSON in this exact format, no other text:
{"department":"water|roads|sanitation|general","category":"string","urgency":"low|normal|high","confidence":0.0-1.0}

Grievance: "${description.slice(0, 500)}"`,
    });

    const text = response.text?.trim();
    if (!text) return null;

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
    const dept = String(parsed.department || "general").toLowerCase();
    const validDepts = ["water", "roads", "sanitation", "general"];
    const department = validDepts.includes(dept) ? dept : "general";
    const urgency = ["low", "normal", "high"].includes(parsed.urgency) ? parsed.urgency : "normal";

    return {
      department,
      category: String(parsed.category || pickCategory(department, description)),
      urgency,
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.8)),
    };
  } catch (err) {
    console.warn("Gemini classification failed, using keyword fallback:", err);
    return null;
  }
}

/** Best-effort: try Gemini first, fallback to keyword */
export async function classifyGrievanceAsync(description: string): Promise<ClassificationResult> {
  const geminiResult = await classifyGrievanceWithGemini(description);
  return geminiResult ?? classifyGrievance(description);
}
