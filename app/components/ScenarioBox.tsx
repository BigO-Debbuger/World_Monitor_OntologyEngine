/**
 * ScenarioBox Component — Dynamic What-if Scenario Simulation
 *
 * Auto-generates context-aware scenario presets based on the selected event.
 * Sends the query to the /api/scenario endpoint and displays
 * the predicted chain of events, impact on India, and risk level.
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import axios from "axios";

// ─── Types ──────────────────────────────────────────────────────

interface ScenarioResult {
  chain: string[];
  impact: string;
  risk_level: "High" | "Medium" | "Low" | "CRITICAL" | "HIGH" | "ELEVATED";
  affected_sectors?: string[];
  india_impact?: string;
}

interface ScenarioBoxProps {
  selectedEvent?: { title: string; category: string; country: string; description?: string } | null;
}

// Dynamic scenario presets based on event keywords
function generatePresets(event: { title: string; category: string; country: string; description?: string } | null): string[] {
  if (!event) return ["Oil prices > $150?", "China invades Taiwan?", "India-Pak escalation?"];

  const title = event.title.toLowerCase();
  const desc = (event.description || "").toLowerCase();
  const combined = `${title} ${desc}`;
  const country = event.country;
  const presets: string[] = [];

  // Category-based presets with Indian state context
  if (event.category === "defense") {
    presets.push(`${country} escalates military action?`);
    if (combined.includes("china") || combined.includes("lac") || combined.includes("arunachal")) {
      presets.push("China deploys troops at Arunachal?");
      presets.push("India-China naval clash in IOR?");
      presets.push("Delhi activates NSA war room?");
    } else if (combined.includes("pakistan") || combined.includes("kashmir")) {
      presets.push("Pakistan nuclear posturing?");
      presets.push("LoC ceasefire collapses?");
      presets.push("Punjab border lockdown?");
    } else if (combined.includes("missile") || combined.includes("hypersonic") || combined.includes("nuclear")) {
      presets.push("Nuclear arms race in Indo-Pacific?");
      presets.push("India accelerates BrahMos-II?");
      presets.push("Delhi emergency defense review?");
    } else if (combined.includes("navy") || combined.includes("carrier") || combined.includes("maritime") || combined.includes("sea")) {
      presets.push("Indian Navy dominates IOR?");
      presets.push("Gujarat ports face naval blockade?");
      presets.push("Andaman naval base activated?");
    } else {
      presets.push("India deploys peacekeepers?");
      presets.push(`Arms embargo on ${country}?`);
      presets.push("Delhi MoD crisis response?");
    }
  } else if (event.category === "energy") {
    presets.push("Oil surges to $200/barrel?");
    presets.push("India energy crisis deepens?");
    presets.push(`${country} halts all exports?`);
    if (combined.includes("nuclear") || combined.includes("fusion") || combined.includes("uranium")) {
      presets.push("India leads global fusion race?");
    }
  } else if (event.category === "trade") {
    presets.push(`${country} sanctions on India?`);
    presets.push("Global supply chain collapse?");
    presets.push("Rupee crashes to 100/$?");
    if (combined.includes("semiconductor") || combined.includes("chip") || combined.includes("rare earth")) {
      presets.push("Karnataka tech sector crisis?");
    }
    if (combined.includes("textile") || combined.includes("garment")) {
      presets.push("Tamil Nadu textile exports surge?");
    }
  } else if (event.category === "climate") {
    presets.push("Category 5 cyclone hits India?");
    presets.push("Monsoon failure 2 years?");
    presets.push("Sea level rise accelerates 3x?");
    if (combined.includes("ice") || combined.includes("arctic") || combined.includes("greenland")) {
      presets.push("Uttarakhand glacial lake burst?");
    }
  } else if (event.category === "tech") {
    presets.push("Global chip shortage worsens?");
    presets.push("AI arms race escalates?");
    presets.push("India's digital infra targeted?");
  }

  return presets.slice(0, 3);
}

export default function ScenarioBox({ selectedEvent }: ScenarioBoxProps) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic presets based on selected event
  const presets = useMemo(() => generatePresets(selectedEvent || null), [selectedEvent]);

  // Reset results when event changes
  useEffect(() => {
    setResult(null);
    setQuery("");
    setError(null);
  }, [selectedEvent]);

  // Handle scenario submission
  const handleSubmit = async () => {
    if (!query.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await axios.post("/api/scenario", {
        query: query.trim(),
        eventContext: selectedEvent ? {
          title: selectedEvent.title,
          category: selectedEvent.category,
          country: selectedEvent.country,
          description: selectedEvent.description,
        } : undefined,
      });
      setResult(res.data);
    } catch (err) {
      console.error("Scenario failed:", err);
      setError("Scenario simulation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="scenario-container">
      {/* Context indicator — shows which event the simulation is based on */}
      {selectedEvent && (
        <div style={{
          fontSize: 8, fontFamily: "monospace", color: "var(--text-dim)",
          marginBottom: 6, letterSpacing: 1, display: "flex", alignItems: "center", gap: 4,
        }}>
          <span style={{ color: "var(--clr-orange)" }}>▶</span>
          CONTEXT: {selectedEvent.title.substring(0, 35).toUpperCase()}...
        </div>
      )}

      {/* Input Row */}
      <div className="scenario-input-wrapper">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--clr-orange)] whitespace-nowrap">
          ⚡
        </div>
        <input
          type="text"
          className="scenario-input"
          placeholder="Type a what-if scenario..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          suppressHydrationWarning
        />
        <button
          className="scenario-btn"
          onClick={handleSubmit}
          disabled={loading || !query.trim()}
          suppressHydrationWarning
        >
          {loading ? (
            <span className="flex items-center gap-1">
              <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
              ...
            </span>
          ) : (
            "GO"
          )}
        </button>
      </div>

      {/* Dynamic Quick Presets */}
      {!result && !loading && (
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {presets.map((preset, i) => (
            <button
              key={`${selectedEvent?.title || 'def'}-${i}`}
              onClick={() => setQuery(preset)}
              className="px-2 py-0.5 bg-[var(--bg-card)] border border-[var(--border-dim)] rounded text-[9px] text-[var(--text-dim)] cursor-pointer hover:border-[var(--clr-orange)] hover:text-white transition-all"
              suppressHydrationWarning
            >
              {preset}
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-2 p-2 bg-[var(--clr-red)]/10 border border-[var(--clr-red)]/30 rounded text-[10px] text-[var(--clr-red)]">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="scenario-results fade-in">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--clr-orange)]">
              Simulation Result
            </div>
            <span className={`risk-badge risk-${result.risk_level.toLowerCase()}`}>
              {["CRITICAL", "High", "HIGH"].includes(result.risk_level) ? "🚨" :
                ["ELEVATED", "Medium"].includes(result.risk_level) ? "⚠️" : "🟢"}{" "}
              {result.risk_level}
            </span>
          </div>

          {/* Chain */}
          <div className="mb-2">
            <ul className="chain-list">
              {result.chain.map((step, i) => (
                <li key={i} className="chain-item">
                  <div className="chain-dot" style={{ width: 16, height: 16, fontSize: 8 }}>
                    {i + 1}
                  </div>
                  <span className="chain-text text-[9px]">{step}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* India Impact */}
          {result.india_impact && (
            <div style={{
              marginBottom: 6, padding: "6px 8px", borderRadius: 4,
              background: "rgba(255,153,51,0.08)", border: "1px solid rgba(255,153,51,0.2)",
            }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: "#ff9933", letterSpacing: 1.5, marginBottom: 3 }}>
                🇮🇳 INDIA IMPACT
              </div>
              <p className="text-[9px] leading-relaxed text-[var(--text-secondary)]">
                {result.india_impact}
              </p>
            </div>
          )}

          {/* Affected Sectors */}
          {result.affected_sectors && (
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
              {result.affected_sectors.map((s, i) => (
                <span key={i} style={{
                  fontSize: 7, padding: "1px 5px", borderRadius: 2,
                  background: "rgba(0,136,255,0.1)", border: "1px solid rgba(0,136,255,0.2)",
                  color: "var(--clr-blue)", fontWeight: 700, letterSpacing: 0.5,
                }}>{s}</span>
              ))}
            </div>
          )}

          {/* Impact */}
          <div>
            <div className="intel-label">Strategic Impact</div>
            <p className="text-[10px] leading-relaxed text-[var(--text-secondary)]">
              {result.impact}
            </p>
          </div>

          {/* Dismiss */}
          <button
            onClick={() => { setResult(null); setQuery(""); }}
            className="mt-2 px-3 py-1 bg-transparent border border-[var(--border-dim)] rounded text-[9px] text-[var(--text-dim)] cursor-pointer hover:border-white hover:text-white transition-all"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
