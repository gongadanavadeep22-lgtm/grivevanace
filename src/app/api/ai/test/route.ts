import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const GEMINI_MODEL = "gemini-2.0-flash";

/** Test endpoint to verify Gemini API connectivity */
export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "GEMINI_API_KEY not set in .env.local" },
      { status: 503 }
    );
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: "Reply with exactly: OK",
    });

    const text = response.text?.trim();
    return NextResponse.json({
      ok: true,
      model: GEMINI_MODEL,
      response: text || "(empty)",
      message: "Gemini API connected successfully",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Gemini test error:", err);
    return NextResponse.json(
      { ok: false, error: message, model: GEMINI_MODEL },
      { status: 502 }
    );
  }
}
