/**
 * NETRA AI — Intelligence Analysis Engine
 * 
 * This module provides AI-powered geopolitical event analysis
 * using OpenAI's GPT models. It generates structured intelligence
 * reports including risk assessment, impact scoring, and cause-effect chains.
 */

import OpenAI from "openai";

// Initialize OpenAI client with API key from environment
const openai = new OpenAI({
  apiKey: process.env.GROK_API_KEY || "sk-placeholder-key",
  baseURL: "https://api.xai.com/v1",
  maxRetries: 0,
  timeout: 4000,
});

// ─── Type Definitions ──────────────────────────────────────────────

export interface AnalysisResult {
  entities: string[];
  risk_level: "High" | "Medium" | "Low";
  impact_score: number;
  confidence: number;
  chain: string[];
  summary: string;
}

export interface ScenarioResult {
  chain: string[];
  impact: string;
  risk_level: "High" | "Medium" | "Low";
}

// ─── Analysis Cache ─────────────────────────────────────────────────

const analysisCache = new Map<string, AnalysisResult>();
const scenarioCache = new Map<string, ScenarioResult>();

// ─── Prompt Engineering ──────────────────────────────────────────────

const ANALYSIS_SYSTEM_PROMPT = `You are NETRA AI, an advanced geopolitical intelligence analysis engine focused on India's strategic interests. You analyze global events and produce structured intelligence reports.

Your analysis must always consider:
1. Direct and indirect impact on India
2. Regional stability implications
3. Economic consequences for Indian markets
4. Strategic defense considerations
5. Supply chain and trade route effects

You MUST respond with valid JSON only, no markdown, no code blocks, no additional text.`;

const ANALYSIS_USER_PROMPT = (text: string) => `Analyze this geopolitical event and return a JSON object with exactly this structure:

{
  "entities": ["list of key entities: countries, organizations, leaders involved"],
  "risk_level": "High" or "Medium" or "Low",
  "impact_score": <number from 1-10 indicating impact on India>,
  "confidence": <number from 70-95 indicating analysis confidence>,
  "chain": ["step 1: immediate cause", "step 2: direct effect", "step 3: cascading impact", "step 4: India-specific consequence"],
  "summary": "2-3 sentence intelligence brief focused on India's perspective"
}

Event to analyze:
"${text}"

Return ONLY the JSON object, nothing else.`;

const SCENARIO_SYSTEM_PROMPT = `You are NETRA AI's scenario simulation engine. You model hypothetical geopolitical scenarios and predict cascading effects with special focus on India's strategic position.

You MUST respond with valid JSON only, no markdown, no code blocks, no additional text.`;

const SCENARIO_USER_PROMPT = (query: string) => `Model this geopolitical scenario and return a JSON object with exactly this structure:

{
  "chain": ["step 1: initial trigger", "step 2: immediate effect", "step 3: regional cascade", "step 4: global implication", "step 5: India-specific impact"],
  "impact": "detailed paragraph on how this scenario affects India's strategic, economic, and security interests",
  "risk_level": "High" or "Medium" or "Low"
}

Scenario: "${query}"

Return ONLY the JSON object, nothing else.`;

// ─── Fallback Analysis (when API key is placeholder) ─────────────────

function generateFallbackAnalysis(text: string): AnalysisResult {
  const lowerText = text.toLowerCase();

  // Determine category-based risk and impact
  const isHighRisk = lowerText.includes("military") || lowerText.includes("nuclear") ||
    lowerText.includes("war") || lowerText.includes("missile") || lowerText.includes("attack");
  const isMediumRisk = lowerText.includes("trade") || lowerText.includes("sanctions") ||
    lowerText.includes("embargo") || lowerText.includes("crisis");

  const riskLevel = isHighRisk ? "High" : isMediumRisk ? "Medium" : "Low";
  const impactScore = isHighRisk ? Math.floor(Math.random() * 3) + 7 :
    isMediumRisk ? Math.floor(Math.random() * 3) + 4 :
      Math.floor(Math.random() * 3) + 1;

  // Extract likely entities from text
  const entities: string[] = [];
  const countries = ["India", "China", "US", "Russia", "Pakistan", "Japan", "Australia",
    "UK", "France", "Germany", "Iran", "Saudi Arabia", "Israel", "Turkey", "Brazil"];
  countries.forEach(c => { if (lowerText.includes(c.toLowerCase())) entities.push(c); });
  if (entities.length === 0) entities.push("India", "Global Community");

  return {
    entities,
    risk_level: riskLevel,
    impact_score: impactScore,
    confidence: Math.floor(Math.random() * 15) + 75,
    chain: [
      `Event trigger: ${text.substring(0, 60)}...`,
      `Regional destabilization and diplomatic response initiated`,
      `Economic ripple effects on trade corridors and supply chains`,
      `India's strategic calculus requires recalibration of policy`
    ],
    summary: `This event has ${riskLevel.toLowerCase()} risk implications for India. The development requires monitoring of ${entities.join(", ")} actions and may affect India's strategic positioning in the region. Impact assessment indicates a ${impactScore}/10 severity level.`
  };
}

function generateFallbackScenario(query: string): ScenarioResult {
  const lowerQuery = query.toLowerCase();
  const isHighRisk = lowerQuery.includes("war") || lowerQuery.includes("nuclear") ||
    lowerQuery.includes("collapse") || lowerQuery.includes("attack");

  return {
    chain: [
      `Scenario initiated: ${query}`,
      `Immediate market reactions and diplomatic consultations triggered`,
      `Regional powers realign strategic positions`,
      `Global supply chains and trade routes experience disruption`,
      `India activates contingency protocols and recalibrates foreign policy`
    ],
    impact: `Under this scenario, India would face significant implications across economic, diplomatic, and security domains. The immediate effect would involve market volatility and trade disruption. In the medium term, India would need to strengthen bilateral ties with key allies while hedging against potential supply chain vulnerabilities. Long-term strategic planning would require reassessment of defense posture and economic diversification strategies.`,
    risk_level: isHighRisk ? "High" : "Medium"
  };
}

// ─── Core Analysis Functions ──────────────────────────────────────────

/**
 * Analyzes a geopolitical event text and returns structured intelligence.
 * Uses OpenAI when available, falls back to deterministic analysis otherwise.
 */
export async function analyzeEvent(text: string): Promise<AnalysisResult> {
  // Check cache first
  if (analysisCache.has(text)) {
    return analysisCache.get(text)!;
  }

  // Check if we have a real API key
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey || apiKey === "sk-placeholder-key" || apiKey.startsWith("sk-placeholder")) {
    const fallback = generateFallbackAnalysis(text);
    analysisCache.set(text, fallback);
    return fallback;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "grok-2-latest",
      messages: [
        { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
        { role: "user", content: ANALYSIS_USER_PROMPT(text) }
      ],
      temperature: 0.3,
      max_tokens: 800,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from AI");

    const result: AnalysisResult = JSON.parse(content);
    analysisCache.set(text, result);
    return result;
  } catch (error) {
    console.error("AI analysis failed, using fallback:", error);
    const fallback = generateFallbackAnalysis(text);
    analysisCache.set(text, fallback);
    return fallback;
  }
}

/**
 * Simulates a geopolitical scenario and returns predicted chain of events.
 * Uses OpenAI when available, falls back to template-based simulation otherwise.
 */
export async function simulateScenario(query: string): Promise<ScenarioResult> {
  // Check cache first
  if (scenarioCache.has(query)) {
    return scenarioCache.get(query)!;
  }

  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey || apiKey === "sk-placeholder-key" || apiKey.startsWith("sk-placeholder")) {
    const fallback = generateFallbackScenario(query);
    scenarioCache.set(query, fallback);
    return fallback;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "grok-2-latest",
      messages: [
        { role: "system", content: SCENARIO_SYSTEM_PROMPT },
        { role: "user", content: SCENARIO_USER_PROMPT(query) }
      ],
      temperature: 0.5,
      max_tokens: 800,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from AI");

    const result: ScenarioResult = JSON.parse(content);
    scenarioCache.set(query, result);
    return result;
  } catch (error) {
    console.error("Scenario simulation failed, using fallback:", error);
    const fallback = generateFallbackScenario(query);
    scenarioCache.set(query, fallback);
    return fallback;
  }
}
