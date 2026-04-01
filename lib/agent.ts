/**
 * NETRA AI — Agent Controller
 *
 * This module acts as a simulated Agentic system. It breaks down complex 
 * geopolitical queries into sub-tasks: entity extraction, causal reasoning, 
 * risk classification, and impact scoring, before synthesizing a final briefing.
 */

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.GROK_API_KEY || "sk-placeholder-key",
  baseURL: "https://api.xai.com/v1",
  maxRetries: 0,
  timeout: 4000,
});

export interface AgentIntelligenceTask {
  entities: string[];
  risk_level: "CRITICAL" | "HIGH" | "ELEVATED" | "MONITOR";
  impact_score: number;
  confidence: number;
  chain: { step: string; phase: "immediate" | "secondary" | "long_term" }[];
  summary: string;
  strategic_posture: { domain: string; status: string; threat_vector: number }[];
  india_states_impact: { state: string; impact: string; severity: "high" | "medium" | "low" }[];
}

export interface ScenarioAgentResult {
  chain: string[];
  impact: string;
  risk_level: "CRITICAL" | "HIGH" | "ELEVATED";
  affected_sectors: string[];
  india_impact: string;
}

// ─── India State Impact Mapping ──────────────────────────────────────────────

interface StateImpactRule {
  keywords: string[];
  states: { state: string; impact: string; severity: "high" | "medium" | "low" }[];
}

const STATE_IMPACT_RULES: StateImpactRule[] = [
  {
    keywords: ["oil", "gas", "energy", "opec", "petroleum", "fuel", "crude"],
    states: [
      { state: "Gujarat", impact: "Refinery ops & oil imports via Jamnagar affected", severity: "high" },
      { state: "Rajasthan", impact: "Barmer oil fields production costs shift", severity: "medium" },
      { state: "Maharashtra", impact: "Mumbai fuel prices & industrial costs surge", severity: "high" },
      { state: "Assam", impact: "NE oil production and ONGC ops impacted", severity: "medium" },
    ],
  },
  {
    keywords: ["china", "lac", "border", "ladakh", "tibet", "arunachal"],
    states: [
      { state: "Ladakh", impact: "Direct LAC frontline — troop deployments active", severity: "high" },
      { state: "Arunachal Pradesh", impact: "Eastern sector border alert raised", severity: "high" },
      { state: "Sikkim", impact: "Nathula corridor & Doklam sector on watch", severity: "medium" },
      { state: "Delhi", impact: "NSA & Defence Ministry crisis protocols activated", severity: "high" },
    ],
  },
  {
    keywords: ["pakistan", "kashmir", "terror", "militant", "cross-border"],
    states: [
      { state: "Jammu & Kashmir", impact: "Security forces on high alert, LoC active", severity: "high" },
      { state: "Punjab", impact: "Border security & Wagah trade corridor impacted", severity: "high" },
      { state: "Delhi", impact: "MEA diplomatic response & NSC meetings", severity: "medium" },
      { state: "Rajasthan", impact: "Western border patrol intensified", severity: "medium" },
    ],
  },
  {
    keywords: ["trade", "export", "import", "tariff", "fta", "sanctions", "supply chain"],
    states: [
      { state: "Maharashtra", impact: "JNPT port & Mumbai financial hub disrupted", severity: "high" },
      { state: "Tamil Nadu", impact: "Chennai auto & electronics manufacturing hit", severity: "medium" },
      { state: "Karnataka", impact: "Bengaluru IT exports & tech supply chain", severity: "medium" },
      { state: "Gujarat", impact: "Mundra port & textile exports affected", severity: "medium" },
    ],
  },
  {
    keywords: ["semiconductor", "chip", "tech", "ai", "data center", "cyber"],
    states: [
      { state: "Karnataka", impact: "Bengaluru tech hub — chip design & AI ops", severity: "high" },
      { state: "Telangana", impact: "Hyderabad semiconductor fabs & IT corridor", severity: "high" },
      { state: "Tamil Nadu", impact: "Foxconn/TSMC Chennai assembly lines", severity: "medium" },
      { state: "Delhi", impact: "Govt digital infrastructure policy response", severity: "medium" },
    ],
  },
  {
    keywords: ["climate", "flood", "cyclone", "monsoon", "ice", "warming", "sea level"],
    states: [
      { state: "Kerala", impact: "Coastal flooding risk & fisheries disrupted", severity: "high" },
      { state: "Odisha", impact: "Cyclone-prone coast — disaster prep activated", severity: "high" },
      { state: "West Bengal", impact: "Sundarbans & Kolkata flood vulnerability", severity: "medium" },
      { state: "Uttarakhand", impact: "Glacial melt & hydropower capacity at risk", severity: "medium" },
    ],
  },
  {
    keywords: ["nuclear", "uranium", "fusion", "reactor", "atomic"],
    states: [
      { state: "Maharashtra", impact: "Tarapur nuclear plant — fuel supply chain", severity: "high" },
      { state: "Tamil Nadu", impact: "Kudankulam reactor operations monitored", severity: "high" },
      { state: "Rajasthan", impact: "Rawatbhata nuclear complex on alert", severity: "medium" },
      { state: "Delhi", impact: "DAE & PM-level nuclear security review", severity: "high" },
    ],
  },
  {
    keywords: ["military", "defense", "missile", "navy", "army", "air force", "weapon", "deploy"],
    states: [
      { state: "Delhi", impact: "MoD & tri-services HQ strategic planning", severity: "high" },
      { state: "Andhra Pradesh", impact: "Eastern Naval Command ops tempo raised", severity: "medium" },
      { state: "Rajasthan", impact: "Pokhran range & Army Southern Command", severity: "medium" },
      { state: "Uttar Pradesh", impact: "Agra air base & defence corridor active", severity: "medium" },
    ],
  },
  {
    keywords: ["wheat", "food", "agriculture", "grain", "rice", "farmer"],
    states: [
      { state: "Punjab", impact: "Wheat belt production & procurement hit", severity: "high" },
      { state: "Haryana", impact: "Agricultural supply chain to Delhi NCR", severity: "high" },
      { state: "Uttar Pradesh", impact: "Rice & wheat production capacity", severity: "medium" },
      { state: "Madhya Pradesh", impact: "Soybean & wheat exports affected", severity: "medium" },
    ],
  },
  {
    keywords: ["shipping", "maritime", "sea", "port", "strait", "red sea", "suez"],
    states: [
      { state: "Gujarat", impact: "Mundra & Kandla ports — shipping rerouted", severity: "high" },
      { state: "Maharashtra", impact: "JNPT Mumbai container traffic disrupted", severity: "high" },
      { state: "Kerala", impact: "Kochi port & Vallarpadam terminal affected", severity: "medium" },
      { state: "Tamil Nadu", impact: "Tuticorin & Chennai port delays", severity: "medium" },
    ],
  },
];

function getIndiaStatesImpact(text: string): { state: string; impact: string; severity: "high" | "medium" | "low" }[] {
  const lowerText = text.toLowerCase();
  const matchedStates: { state: string; impact: string; severity: "high" | "medium" | "low" }[] = [];
  const seenStates = new Set<string>();

  for (const rule of STATE_IMPACT_RULES) {
    if (rule.keywords.some(kw => lowerText.includes(kw))) {
      for (const s of rule.states) {
        if (!seenStates.has(s.state)) {
          seenStates.add(s.state);
          matchedStates.push(s);
        }
      }
    }
  }

  // Default if no specific match
  if (matchedStates.length === 0) {
    matchedStates.push(
      { state: "Delhi", impact: "MEA monitoring & strategic assessment", severity: "medium" },
      { state: "Maharashtra", impact: "Financial markets & trade flows affected", severity: "low" },
      { state: "Karnataka", impact: "Tech sector supply chain monitoring", severity: "low" },
    );
  }

  return matchedStates.slice(0, 5); // Max 5 states
}

// ─── Deterministic AI Agent Fallback ─────────────────────────────────────────

function deterministicAgent(text: string): AgentIntelligenceTask {
  const lowerText = text.toLowerCase();

  const isCritical = lowerText.includes("war") || lowerText.includes("nuclear") || lowerText.includes("strike") || lowerText.includes("standoff");
  const isHigh = lowerText.includes("military") || lowerText.includes("collapse") || lowerText.includes("cut") || lowerText.includes("crisis") || lowerText.includes("deploy");
  const isElev = lowerText.includes("trade") || lowerText.includes("sanctions") || lowerText.includes("embargo") || lowerText.includes("tariff") || lowerText.includes("export");

  const risk_level = isCritical ? "CRITICAL" : isHigh ? "HIGH" : isElev ? "ELEVATED" : "MONITOR";
  const impact_score = isCritical ? Math.floor(Math.random() * 2) + 9 : isHigh ? Math.floor(Math.random() * 2) + 7 : isElev ? Math.floor(Math.random() * 3) + 4 : Math.floor(Math.random() * 3) + 1;

  const entities: string[] = [];
  const knownEntities = ["India", "China", "US", "Russia", "Pakistan", "Japan", "Australia", "UK", "France", "Germany", "Iran", "Saudi Arabia", "Israel", "Turkey", "NATO", "EU", "Bangladesh", "Myanmar", "Sri Lanka", "Maldives", "Nepal"];
  knownEntities.forEach(c => { if (lowerText.includes(c.toLowerCase())) entities.push(c); });
  if (entities.length === 0) entities.push("Global Markets", "U.N.");
  // Always include India
  if (!entities.includes("India")) entities.push("India");

  // Generate event-specific chain based on content
  const chains: { step: string; phase: "immediate" | "secondary" | "long_term" }[] = [];

  // Phase 1: Immediate trigger
  chains.push({ step: `Trigger event: ${text.substring(0, 60)}...`, phase: "immediate" });

  // Phase 2: Immediate response — context-specific
  if (lowerText.includes("gas") || lowerText.includes("oil") || lowerText.includes("energy")) {
    chains.push({ step: `Energy markets destabilize; India's crude import bill projected to rise 12-18%`, phase: "immediate" });
  } else if (lowerText.includes("military") || lowerText.includes("defense") || lowerText.includes("deploy")) {
    chains.push({ step: `Indian Armed Forces raise readiness posture; NSA convenes emergency review`, phase: "immediate" });
  } else if (lowerText.includes("trade") || lowerText.includes("export") || lowerText.includes("tariff")) {
    chains.push({ step: `Indian Commerce Ministry activates trade corridor contingencies`, phase: "immediate" });
  } else if (lowerText.includes("climate") || lowerText.includes("flood") || lowerText.includes("ice")) {
    chains.push({ step: `IMD issues advisory; NDMA activates disaster monitoring protocols`, phase: "immediate" });
  } else {
    chains.push({ step: `Diplomatic channels activated; MEA assesses bilateral impact`, phase: "immediate" });
  }

  // Phase 3: Secondary cascading
  if (lowerText.includes("china") || lowerText.includes("pakistan")) {
    chains.push({ step: `Border reinforcements along LAC/LoC; defence corridor procurement accelerated`, phase: "secondary" });
  } else if (lowerText.includes("semiconductor") || lowerText.includes("chip") || lowerText.includes("tech")) {
    chains.push({ step: `India Semiconductor Mission fast-tracks domestic fab investments`, phase: "secondary" });
  } else if (lowerText.includes("shipping") || lowerText.includes("sea") || lowerText.includes("strait")) {
    chains.push({ step: `Indian Navy deploys additional assets; shipping lanes rerouted via alternative corridors`, phase: "secondary" });
  } else {
    chains.push({ step: `Supply chain cascading effects impact Indian manufacturing & trade zones`, phase: "secondary" });
  }

  // Phase 4: Long term India impact
  chains.push({ step: `India recalibrates strategic posture; policy framework updated for [${entities.slice(0, 3).join(", ")}] axis`, phase: "long_term" });

  // Strategic posture — varies by event type
  const strategic_posture = [];
  if (lowerText.includes("navy") || lowerText.includes("sea") || lowerText.includes("ship") || lowerText.includes("maritime")) {
    strategic_posture.push({ domain: "SEA", status: "Fleet Deployed", threat_vector: 4 });
  } else {
    strategic_posture.push({ domain: "SEA", status: isElev ? "Rerouting" : "Normal Patrol", threat_vector: isHigh ? 3 : 1 });
  }
  strategic_posture.push({ domain: "AIR", status: isCritical ? "Combat Alert" : isHigh ? "Elevated CAP" : "Standard Monitor", threat_vector: isCritical ? 4 : isHigh ? 3 : 1 });
  strategic_posture.push({ domain: "LAND", status: lowerText.includes("border") || lowerText.includes("pakistan") || lowerText.includes("china") ? "Forward Deployed" : "Normal Posture", threat_vector: (lowerText.includes("border") || lowerText.includes("china")) ? 4 : 2 });
  strategic_posture.push({ domain: "CYBER", status: lowerText.includes("cyber") || lowerText.includes("tech") ? "Active Defense" : "Elevated Watch", threat_vector: Math.floor(Math.random() * 3) + 2 });
  strategic_posture.push({ domain: "SPACE", status: lowerText.includes("satellite") || lowerText.includes("space") ? "ISR Active" : "Passive Monitor", threat_vector: 1 });

  return {
    entities,
    risk_level,
    impact_score,
    confidence: Math.floor(Math.random() * 10) + 85,
    chain: chains,
    summary: `NETRA AGENT BRIEF: The event presents a ${risk_level} threat vector. Kinetic or economic escalation involves [${entities.join(", ")}]. India impact score: ${impact_score}/10. Immediate disruption to normative baselines detected. Indian states in the affected corridor have been flagged for monitoring.`,
    strategic_posture,
    india_states_impact: getIndiaStatesImpact(text),
  };
}

// ─── Agent Prompts ────────────────────────────────────────────────────────────

const AGENT_SYSTEM_PROMPT = `You are the NETRA AI Strategic Agent. You operate as a multi-step analytical engine modeling the world for India's defense sector.
Process:
1. Extract Entities.
2. Devise a 3-phase Causal Chain (immediate, secondary, long_term).
3. Classify Risk (CRITICAL, HIGH, ELEVATED, MONITOR).
4. Predict India Impact (1-10 scale).
5. Generate Strategic Posture array [{domain, status, threat_vector(1-5)}].
Output STRICT JSON. Nothing else.`;

export class IntelligenceAgent {

  async analyzeEvent(text: string): Promise<AgentIntelligenceTask> {
    const apiKey = process.env.GROK_API_KEY;
    if (!apiKey || apiKey === "sk-placeholder-key" || apiKey.startsWith("sk-placeholder")) {
      return new Promise(resolve => setTimeout(() => resolve(deterministicAgent(text)), 800)); // Simulate thinking latency
    }

    try {
      const resp = await openai.chat.completions.create({
        model: "grok-2-latest",
        messages: [
          { role: "system", content: AGENT_SYSTEM_PROMPT },
          { role: "user", content: `Event: ${text}\nGenerate the JSON output.` }
        ],
        temperature: 0.2,
      });

      return JSON.parse(resp.choices[0]?.message?.content || "{}");
    } catch (e) {
      console.error("Agent failed:", e);
      return deterministicAgent(text);
    }
  }

  async runScenarioEngine(query: string, eventContext?: { title: string; category: string; country: string; description?: string }): Promise<ScenarioAgentResult> {
    // Combine query with event context for richer keyword matching
    const contextText = eventContext
      ? `${query} ${eventContext.title} ${eventContext.description || ""} ${eventContext.country} ${eventContext.category}`
      : query;
    const lowerQ = contextText.toLowerCase();

    const isCritical = lowerQ.includes("war") || lowerQ.includes("nuclear") || lowerQ.includes("invasion") || lowerQ.includes("standoff");
    const isOil = lowerQ.includes("oil") || lowerQ.includes("gas") || lowerQ.includes("energy") || lowerQ.includes("fuel") || lowerQ.includes("petroleum");
    const isChina = lowerQ.includes("china") || lowerQ.includes("taiwan") || lowerQ.includes("lac") || lowerQ.includes("arunachal");
    const isPak = lowerQ.includes("pakistan") || lowerQ.includes("india-pak") || lowerQ.includes("kashmir") || lowerQ.includes("loc");
    const isTrade = lowerQ.includes("trade") || lowerQ.includes("tariff") || lowerQ.includes("export") || lowerQ.includes("import") || lowerQ.includes("sanctions") || lowerQ.includes("fta");
    const isClimate = lowerQ.includes("climate") || lowerQ.includes("cyclone") || lowerQ.includes("flood") || lowerQ.includes("monsoon") || lowerQ.includes("ice") || lowerQ.includes("sea level");
    const isTech = lowerQ.includes("semiconductor") || lowerQ.includes("chip") || lowerQ.includes("tech") || lowerQ.includes("ai") || lowerQ.includes("cyber");
    const isMaritime = lowerQ.includes("shipping") || lowerQ.includes("sea") || lowerQ.includes("strait") || lowerQ.includes("red sea") || lowerQ.includes("suez") || lowerQ.includes("navy");
    const isFood = lowerQ.includes("wheat") || lowerQ.includes("food") || lowerQ.includes("grain") || lowerQ.includes("rice") || lowerQ.includes("agriculture");

    const countryLabel = eventContext?.country || "Global";
    const eventRef = eventContext ? `[${eventContext.title.substring(0, 40)}]` : "";

    let chain: string[];
    let impact: string;
    let affected_sectors: string[];
    let india_impact: string;

    if (isChina) {
      chain = [
        `Scenario trigger: ${query}`,
        `PLA mobilizes forces; US activates Pacific deterrence — global markets crash 8%`,
        `India's LAC front heats up; additional 2 Mountain Divisions deployed to Arunachal`,
        `Semiconductor supply from TSMC halts — India fast-tracks domestic fab programs`,
        `Indian Navy activates Eastern Fleet in Andaman & Nicobar for IOR dominance`,
      ];
      impact = `Catastrophic disruption to Indo-Pacific stability. India faces two-front pressure. GDP impact: -1.8% estimated. ${eventRef}`;
      affected_sectors = ["Defense", "Semiconductors", "Maritime Trade", "Technology"];
      india_impact = "Direct security threat — Ladakh & Arunachal on HIGH ALERT. Delhi MoD activates war room. Sikkim Nathula corridor sealed. Karnataka tech exports disrupted.";
    } else if (isPak) {
      chain = [
        `Scenario trigger: ${query}`,
        `LoC ceasefire violations escalate; artillery exchanges along Poonch-Rajouri`,
        `IAF activates Western Air Command; Rafale squadrons on standby at Ambala`,
        `Diplomatic isolation of Pakistan via FATF & UN channels initiated by India`,
        `India's western border states enter heightened security — Punjab, Rajasthan on alert`,
      ];
      impact = `Regional destabilization with nuclear escalation risk. India activates full-spectrum deterrence. ${eventRef}`;
      affected_sectors = ["Defense", "Agriculture", "Border Trade", "Tourism"];
      india_impact = "Direct military threat — J&K, Punjab, Rajasthan under security lockdown. Delhi NSA emergency session. Haryana cantonment areas on standby.";
    } else if (isOil) {
      chain = [
        `Scenario trigger: ${query}`,
        `Brent crude surges past $140/bbl; India's import bill spikes $35B annually`,
        `RBI intervenes to stabilize INR; strategic petroleum reserves activated`,
        `India accelerates solar & nuclear energy transition — PM chairs energy security review`,
        `Downstream effect: inflation rises 2.5%; fuel subsidy burden forces fiscal recalibration`,
      ];
      impact = `Severe economic stress. India's current account deficit widens to 4.2% of GDP. ${eventRef}`;
      affected_sectors = ["Energy", "Transport", "Manufacturing", "Agriculture"];
      india_impact = "Gujarat Jamnagar refinery ops disrupted. Maharashtra fuel prices surge. Delhi transportation costs spike 18%. Rajasthan Barmer production costs escalate. Assam ONGC ops impacted.";
    } else if (isTrade) {
      chain = [
        `Scenario trigger: ${query}`,
        `${countryLabel} trade policy disrupts bilateral corridors; WTO dispute incoming`,
        `Indian Commerce Ministry activates trade contingency protocols`,
        `Key export sectors face 15-30% tariff exposure; MSME sector most vulnerable`,
        `India pivots to alternative trade corridors — Look East + Africa strategy accelerated`,
      ];
      impact = `Significant trade disruption along ${countryLabel}-India corridor. Estimated $8-12B annual trade impact. ${eventRef}`;
      affected_sectors = ["Trade", "Manufacturing", "IT Services", "Textiles"];
      india_impact = "Maharashtra JNPT port traffic disrupted. Karnataka IT exports face uncertainty. Tamil Nadu auto manufacturing hit. Gujarat Mundra port trade rerouted. Delhi Commerce Ministry crisis meeting.";
    } else if (isClimate) {
      chain = [
        `Scenario trigger: ${query}`,
        `Extreme weather events intensify across South Asian monsoon belt`,
        `IMD issues nationwide advisory; NDMA activates multi-state disaster protocols`,
        `Agricultural output projected to fall 12-18% — food security measures activated`,
        `India pushes emergency climate resolution at UN; $5B disaster relief fund mobilized`,
      ];
      impact = `Multi-dimensional climate impact on India's food security and coastal infrastructure. ${eventRef}`;
      affected_sectors = ["Agriculture", "Infrastructure", "Energy", "Healthcare"];
      india_impact = "Kerala & Odisha coastal flooding risk critical. West Bengal Sundarbans threatened. Uttarakhand glacial melt accelerates. Delhi air quality crisis compounds. Punjab agricultural belt under stress.";
    } else if (isTech) {
      chain = [
        `Scenario trigger: ${query}`,
        `Global chip supply faces 6-month disruption; tech sector valuations crash 15%`,
        `India Semiconductor Mission fast-tracks ₹76,000Cr domestic fab investments`,
        `Bengaluru & Hyderabad IT corridors pivot to design-led chip development`,
        `India-US iCET partnership accelerated for critical technology transfers`,
      ];
      impact = `Strategic tech dependency exposed. India's $230B IT sector faces supply-side constraints. ${eventRef}`;
      affected_sectors = ["Technology", "Defense Electronics", "Automotive", "Telecom"];
      india_impact = "Karnataka Bengaluru tech hub disrupted. Telangana Hyderabad fabs delayed. Tamil Nadu electronics assembly impacted. Delhi Digital India program recalibrated.";
    } else if (isMaritime) {
      chain = [
        `Scenario trigger: ${query}`,
        `Maritime shipping lanes disrupted; insurance premiums surge 300% for affected routes`,
        `Indian Navy deploys INS Vikrant carrier group; Eastern & Western fleet on alert`,
        `India's port cargo delays mount — 15-20 day rerouting via Cape of Good Hope`,
        `PM chairs Cabinet Committee on Security; India asserts SLOC protection doctrine`,
      ];
      impact = `Critical disruption to India's maritime trade arteries. 85% of oil imports transit affected corridors. ${eventRef}`;
      affected_sectors = ["Maritime Trade", "Energy", "Defense", "Manufacturing"];
      india_impact = "Gujarat Mundra & Kandla ports — shipping rerouted. Maharashtra JNPT container delays. Kerala Kochi port affected. Tamil Nadu Tuticorin delays. Delhi activates maritime security protocol.";
    } else if (isFood) {
      chain = [
        `Scenario trigger: ${query}`,
        `Global grain markets destabilize; wheat futures surge 40% in 48 hours`,
        `India's Food Ministry activates buffer stock distribution protocols`,
        `Export ban on key food commodities enacted; MSP revised upward`,
        `India leverages position as major agricultural producer for diplomatic gains`,
      ];
      impact = `Food security implications for India's 1.4B population. Strategic grain reserves provide 90-day buffer. ${eventRef}`;
      affected_sectors = ["Agriculture", "Food Processing", "Retail", "Rural Economy"];
      india_impact = "Punjab & Haryana wheat belt production critical. UP rice capacity strained. MP soybean exports halted. Delhi PDS system scaled up. Rajasthan drought corridor monitoring activated.";
    } else {
      chain = [
        `Scenario trigger: ${query}`,
        `Global diplomatic realignment; India assesses ${countryLabel} bilateral impact vectors`,
        `Trade corridors face disruption; Indian Commerce Ministry activates contingencies`,
        `Strategic sectors flagged for review; defence procurement timeline accelerated`,
      ];
      impact = `Strategic realignment required across trade and defence corridors for India. ${eventRef}`;
      affected_sectors = ["Energy", "Defense", "Maritime Trade", "Technology"];
      india_impact = `Multi-domain impact on Indian strategic interests. Delhi MEA & NSA coordinating unified response. Maharashtra financial markets on watch.`;
    }

    return new Promise(resolve => setTimeout(() => resolve({
      chain,
      impact,
      risk_level: isCritical ? "CRITICAL" : (isChina || isPak || isMaritime) ? "CRITICAL" : "HIGH",
      affected_sectors,
      india_impact,
    }), 1200));
  }
}

export const agentController = new IntelligenceAgent();
