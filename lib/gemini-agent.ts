/**
 * NETRA AI — Gemini-Powered Live Intelligence Agent
 *
 * Uses Google's Gemini API (free tier) for REAL AI-generated analysis.
 * Every event selection triggers a fresh LLM call → dynamic, unique insights.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AgentIntelligenceTask, ScenarioAgentResult } from "./agent";

// ─── Gemini Client ──────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

function getGeminiModel() {
  if (!GEMINI_API_KEY) throw new Error("No GEMINI_API_KEY set");
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
}

// ─── Retry Helper for Rate Limits ───────────────────────────────────
// Gemini free tier has strict RPM limits (429 errors). Retry with backoff.
// Kept short to ensure max 10 second delay for fallback.
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 0): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Add a 4 second strict timeout to the API call itself
      return await Promise.race([
        fn(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Request Timeout")), 4000))
      ]);
    } catch (err: any) {
      const msg = err?.message || "";
      const is429 = msg.includes("429") || msg.includes("Resource has been exhausted") || msg.includes("rate") || msg.includes("quota");
      if (is429 && attempt < maxRetries) {
        const delay = 1000; // Fixed 1s delay
        console.log(`[NETRA-GEMINI] Rate limited, retrying in ${delay / 1000}s (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Max retries exceeded");
}

// ─── Analysis Prompt ────────────────────────────────────────────────

const ANALYSIS_PROMPT = (eventText: string) => `
You are NETRA AI, India's most advanced geopolitical intelligence analysis engine. 
You analyze global events with laser focus on India's strategic, economic, defense, and diplomatic interests.

TASK: Analyze the following geopolitical event and produce a structured intelligence briefing.

EVENT:
"${eventText}"

You MUST respond with ONLY a valid JSON object (no markdown, no backticks, no explanation) with this exact structure:

{
  "entities": ["list of 3-6 key entities involved: countries, organizations, leaders"],
  "risk_level": "CRITICAL" or "HIGH" or "ELEVATED" or "MONITOR",
  "impact_score": <number 1-10, where 10 = catastrophic impact on India>,
  "confidence": <number 75-95>,
  "chain": [
    {"step": "Describe the immediate trigger event and its direct effects", "phase": "immediate"},
    {"step": "Describe the secondary cascading effect on regional stability", "phase": "immediate"},
    {"step": "Describe how this cascades into India's economic/trade/security sphere", "phase": "secondary"},
    {"step": "Describe India's long-term strategic recalibration needed", "phase": "long_term"}
  ],
  "summary": "A 3-4 sentence intelligence brief written in professional military/intelligence style, focusing on India's perspective. Mention specific numbers, percentages, or data points where applicable.",
  "strategic_posture": [
    {"domain": "SEA", "status": "brief status phrase", "threat_vector": <1-5>},
    {"domain": "AIR", "status": "brief status phrase", "threat_vector": <1-5>},
    {"domain": "LAND", "status": "brief status phrase", "threat_vector": <1-5>},
    {"domain": "CYBER", "status": "brief status phrase", "threat_vector": <1-5>},
    {"domain": "SPACE", "status": "brief status phrase", "threat_vector": <1-5>}
  ],
  "india_states_impact": [
    {"state": "Indian State Name", "impact": "specific impact description for this state", "severity": "high" or "medium" or "low"},
    ... (provide 4-6 Indian states most affected, with SPECIFIC details mentioning cities, ports, bases, or economic zones)
  ]
}

IMPORTANT RULES:
- Be SPECIFIC. Mention real Indian cities, bases, ports, corridors, trade zones.
- For india_states_impact, think about which Indian states are ACTUALLY geographically or economically connected to this event.
- Always include Delhi as one of the states (it's the command center).
- The summary should read like a real intelligence briefing — concise, data-driven.
- Vary your risk levels appropriately — not everything is CRITICAL. 
- Return ONLY the JSON. No other text.
`;

// ─── Scenario Prompt ────────────────────────────────────────────────

const SCENARIO_PROMPT = (query: string, eventContext?: { title: string; category: string; country: string; description?: string }) => `
You are NETRA AI's geopolitical scenario simulation engine. You model what-if scenarios and predict cascading consequences with India-centric focus.

${eventContext ? `CURRENT EVENT CONTEXT:
Title: ${eventContext.title}
Category: ${eventContext.category}
Country: ${eventContext.country}
${eventContext.description ? `Description: ${eventContext.description}` : ""}
` : ""}

WHAT-IF SCENARIO TO SIMULATE:
"${query}"

You MUST respond with ONLY a valid JSON object (no markdown, no backticks, no explanation):

{
  "chain": [
    "Step 1: Describe the scenario trigger and immediate effect",
    "Step 2: Regional cascade — what happens in the first 48 hours",
    "Step 3: Economic fallout — market reactions, trade disruptions",
    "Step 4: Military/strategic response from major powers",
    "Step 5: India's specific response and long-term positioning"
  ],
  "impact": "A detailed paragraph (4-5 sentences) explaining how this scenario specifically affects India's economy, defense, diplomacy, and domestic politics. Include specific numbers or estimates.",
  "risk_level": "CRITICAL" or "HIGH" or "ELEVATED",
  "affected_sectors": ["list of 4-5 sectors most impacted"],
  "india_impact": "A detailed sentence describing state-by-state impact in India. Mention specific states, cities, and strategic assets."
}

Return ONLY the JSON. No other text.
`;

// ─── Core Analysis Function ─────────────────────────────────────────

export async function analyzeWithGemini(eventText: string): Promise<AgentIntelligenceTask> {
  const model = getGeminiModel();

  const result = await withRetry(() => model.generateContent(ANALYSIS_PROMPT(eventText)));
  const responseText = result.response.text();

  // Clean up response — strip markdown code fences if present
  let cleaned = responseText.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  cleaned = cleaned.trim();

  const parsed = JSON.parse(cleaned) as AgentIntelligenceTask;

  // Validate and fix the structure
  if (!parsed.entities || !Array.isArray(parsed.entities)) parsed.entities = ["India"];
  if (!parsed.chain || !Array.isArray(parsed.chain)) parsed.chain = [];
  if (!parsed.strategic_posture || !Array.isArray(parsed.strategic_posture)) {
    parsed.strategic_posture = [
      { domain: "SEA", status: "Monitoring", threat_vector: 2 },
      { domain: "AIR", status: "Standard", threat_vector: 1 },
      { domain: "LAND", status: "Normal", threat_vector: 1 },
      { domain: "CYBER", status: "Active Watch", threat_vector: 2 },
      { domain: "SPACE", status: "Passive", threat_vector: 1 },
    ];
  }
  if (!parsed.india_states_impact || !Array.isArray(parsed.india_states_impact)) {
    parsed.india_states_impact = [
      { state: "Delhi", impact: "MEA monitoring & strategic assessment", severity: "medium" },
    ];
  }
  if (!parsed.risk_level) parsed.risk_level = "ELEVATED";
  if (!parsed.impact_score) parsed.impact_score = 5;
  if (!parsed.confidence) parsed.confidence = 85;
  if (!parsed.summary) parsed.summary = "Analysis in progress.";

  return parsed;
}

// ─── Scenario Simulation Function ───────────────────────────────────

export async function simulateWithGemini(
  query: string,
  eventContext?: { title: string; category: string; country: string; description?: string }
): Promise<ScenarioAgentResult> {
  const model = getGeminiModel();

  const result = await withRetry(() => model.generateContent(SCENARIO_PROMPT(query, eventContext)));
  const responseText = result.response.text();

  // Clean up response
  let cleaned = responseText.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  cleaned = cleaned.trim();

  const parsed = JSON.parse(cleaned) as ScenarioAgentResult;

  // Validate
  if (!parsed.chain || !Array.isArray(parsed.chain)) parsed.chain = [`Scenario: ${query}`];
  if (!parsed.impact) parsed.impact = "Impact assessment pending.";
  if (!parsed.risk_level) parsed.risk_level = "HIGH";
  if (!parsed.affected_sectors) parsed.affected_sectors = ["General"];
  if (!parsed.india_impact) parsed.india_impact = "Cross-domain impact on Indian strategic interests.";

  return parsed;
}
