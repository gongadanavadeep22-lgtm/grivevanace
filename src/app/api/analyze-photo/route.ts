import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, createPartFromBase64, createPartFromText, createUserContent } from "@google/genai";

const GEMINI_MODEL = "gemini-2.0-flash";

/** Extract base64 and mime from data URL (e.g. data:image/jpeg;base64,...) */
function parseDataUrl(dataUrl: string): { data: string; mimeType: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid image data URL");
  return { data: match[2], mimeType: match[1] || "image/jpeg" };
}

/** Try local Ollama vision model (no API key, no quota) */
async function analyzeWithOllama(
  base64Data: string,
  baseUrl: string,
  latitude?: number,
  longitude?: number
): Promise<{ description: string; suggestedLocation: string } | null> {
  const model = process.env.OLLAMA_VISION_MODEL?.trim() || "llava";

  const locationContext =
    latitude != null && longitude != null
      ? ` The photo was taken at coordinates: ${latitude}, ${longitude}.`
      : "";

  const prompt = `You are helping a citizen file a civic grievance (complaint) in India. Analyze this photo and write a clear, concise grievance description in 1-3 sentences. Focus on: what is wrong (e.g. pothole, water leak, garbage), where it appears to be, and what action is needed. Write in simple English.${locationContext}

Reply with ONLY valid JSON in this exact format, no other text:
{"description":"your grievance text here","suggestedLocation":"area/landmark if visible, or empty string"}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt, images: [base64Data] }],
        stream: false,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const json = await res.json();
    const text = json.message?.content?.trim();
    if (!text) return null;

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
    const description = String(parsed.description || "").trim();
    const suggestedLocation = String(parsed.suggestedLocation || "").trim();

    if (!description) return null;

    return { description, suggestedLocation };
  } catch {
    return null;
  }
}

/** Fallback to Gemini when Ollama unavailable */
async function analyzeWithGemini(
  base64Data: string,
  mimeType: string,
  latitude?: number,
  longitude?: number
): Promise<{ description: string; suggestedLocation: string }> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error("AI analysis not configured. Add GEMINI_API_KEY or run Ollama locally.");

  const locationContext =
    latitude != null && longitude != null
      ? ` The photo was taken at coordinates: ${latitude}, ${longitude}. Include a brief location description if you can infer the area (e.g. street, landmark) from the image.`
      : "";

  const prompt = `You are helping a citizen file a civic grievance (complaint) in India. Analyze this photo and write a clear, concise grievance description in 1-3 sentences. Focus on: what is wrong (e.g. pothole, water leak, garbage), where it appears to be, and what action is needed. Write in simple English.${locationContext}

Reply with ONLY valid JSON in this exact format, no other text:
{"description":"your grievance text here","suggestedLocation":"area/landmark if visible, or empty string"}`;

  const ai = new GoogleGenAI({ apiKey });
  const imagePart = createPartFromBase64(base64Data, mimeType);
  const textPart = createPartFromText(prompt);
  const content = createUserContent([imagePart, textPart]);

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [content],
  });

  const text = response.text?.trim();
  if (!text) throw new Error("AI could not analyze the image");

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
  const description = String(parsed.description || "").trim();
  const suggestedLocation = String(parsed.suggestedLocation || "").trim();

  if (!description) throw new Error("Could not generate description from image");

  return { description, suggestedLocation };
}

export async function POST(req: NextRequest) {
  try {
    let body: { photoUrl?: string; latitude?: number; longitude?: number };
    try {
      body = await req.json();
    } catch (parseErr) {
      console.error("Analyze photo: invalid JSON or body too large", parseErr);
      return NextResponse.json(
        { error: "Image too large. Please use a smaller photo." },
        { status: 413 }
      );
    }
    const { photoUrl, latitude, longitude } = body as {
      photoUrl: string;
      latitude?: number;
      longitude?: number;
    };

    if (!photoUrl?.trim()) {
      return NextResponse.json({ error: "Photo is required" }, { status: 400 });
    }

    const { data, mimeType } = parseDataUrl(photoUrl);

    const ollamaUrl = process.env.VERCEL ? "" : (process.env.OLLAMA_BASE_URL?.trim() || "http://localhost:11434");

    const ollamaResult = ollamaUrl ? await analyzeWithOllama(data, ollamaUrl, latitude, longitude) : null;
    if (ollamaResult) {
      return NextResponse.json({
        description: ollamaResult.description,
        suggestedLocation: ollamaResult.suggestedLocation,
        coordinates: latitude != null && longitude != null ? { latitude, longitude } : undefined,
        source: "local",
      });
    }

    if (!process.env.GEMINI_API_KEY?.trim()) {
      return NextResponse.json(
        {
          error:
            "AI analysis unavailable. Run Ollama locally with a vision model (e.g. ollama run llava) or add GEMINI_API_KEY to .env.local.",
        },
        { status: 503 }
      );
    }

    const result = await analyzeWithGemini(data, mimeType, latitude, longitude);
    return NextResponse.json({
      description: result.description,
      suggestedLocation: result.suggestedLocation,
      coordinates: latitude != null && longitude != null ? { latitude, longitude } : undefined,
      source: "gemini",
    });
  } catch (e) {
    console.error("Analyze photo error:", e);
    const msg = e instanceof Error ? e.message : String(e);
    const isQuota = msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED");
    const friendlyError = isQuota
      ? "AI analysis is temporarily unavailable (daily limit reached). Please describe your issue below and submit — your photo will still be attached."
      : msg.length > 120
        ? "AI analysis failed. Please describe your issue below and submit — your photo will still be attached."
        : msg;
    return NextResponse.json(
      { error: friendlyError },
      { status: isQuota ? 429 : 500 }
    );
  }
}
