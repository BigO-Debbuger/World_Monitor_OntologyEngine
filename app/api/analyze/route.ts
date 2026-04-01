import { NextRequest, NextResponse } from "next/server";
import { analyzeWithGemini } from "@/lib/gemini-agent";
import { agentController } from "@/lib/agent";

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    if (!text) return NextResponse.json({ error: "No text" }, { status: 400 });

    // Try Gemini first (live AI), fall back to deterministic agent
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && geminiKey.length > 10) {
      try {
        const analysis = await analyzeWithGemini(text);
        return NextResponse.json(analysis);
      } catch (err) {
        console.error("Gemini analysis failed, falling back:", err);
      }
    }

    // Fallback to deterministic agent
    const analysis = await agentController.analyzeEvent(text);
    return NextResponse.json(analysis);
  } catch (err) {
    console.error("Analysis route error:", err);
    return NextResponse.json({ error: "Agent failure" }, { status: 500 });
  }
}
