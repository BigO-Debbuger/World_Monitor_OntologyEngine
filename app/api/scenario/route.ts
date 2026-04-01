import { NextRequest, NextResponse } from "next/server";
import { simulateWithGemini } from "@/lib/gemini-agent";
import { agentController } from "@/lib/agent";

export async function POST(request: NextRequest) {
  try {
    const { query, eventContext } = await request.json();
    if (!query) return NextResponse.json({ error: "No query" }, { status: 400 });

    // Try Gemini first (live AI), fall back to deterministic agent
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && geminiKey.length > 10) {
      try {
        const scenario = await simulateWithGemini(query, eventContext);
        return NextResponse.json(scenario);
      } catch (err) {
        console.error("Gemini scenario failed, falling back:", err);
      }
    }

    // Fallback to deterministic agent
    const scenario = await agentController.runScenarioEngine(query, eventContext);
    return NextResponse.json(scenario);
  } catch (err) {
    console.error("Scenario route error:", err);
    return NextResponse.json({ error: "Agent failure" }, { status: 500 });
  }
}
