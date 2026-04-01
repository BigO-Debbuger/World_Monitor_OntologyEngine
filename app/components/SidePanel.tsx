/**
 * SidePanel Component — Intelligence Analysis Display
 *
 * Shows the selected event's AI-generated intelligence report
 * including risk level, impact score, confidence, entities,
 * summary, and cause-effect chain. Also shows a list of all events
 * with category filtering.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import dynamic from "next/dynamic";

// Dynamic import for GraphView (no SSR for canvas-based graph)
const GraphView = dynamic(() => import("./GraphView"), { ssr: false });

// ─── Types ──────────────────────────────────────────────────────

interface EventData {
  id: number;
  title: string;
  description: string;
  country: string;
  latitude: number;
  longitude: number;
  category: string;
}

interface AnalysisResult {
  entities: string[];
  risk_level: "High" | "Medium" | "Low" | "CRITICAL" | "HIGH" | "ELEVATED" | "MONITOR";
  impact_score: number;
  confidence: number;
  chain: { step: string; phase: "immediate" | "secondary" | "long_term" }[] | string[];
  summary: string;
  india_states_impact?: { state: string; impact: string; severity: "high" | "medium" | "low" }[];
}

interface SidePanelProps {
  events: EventData[];
  selectedEvent: EventData | null;
  onSelectEvent: (event: EventData) => void;
}

// ─── Category colors ─────────────────────────────────────────

const categoryColors: Record<string, string> = {
  energy: "#ff6b2c",
  trade: "#00d4ff",
  defense: "#ff3b3b",
  climate: "#00e676",
};

// ─── Confidence Ring SVG Component ──────────────────────────

function ConfidenceRing({ value }: { value: number }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="confidence-ring">
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle
          cx="28" cy="28" r={radius}
          fill="none"
          stroke="var(--bg-tertiary)"
          strokeWidth="4"
        />
        <circle
          cx="28" cy="28" r={radius}
          fill="none"
          stroke="var(--accent-blue)"
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <span className="confidence-value">{value}%</span>
    </div>
  );
}

export default function SidePanel({ events, selectedEvent, onSelectEvent }: SidePanelProps) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"intel" | "events">("intel");
  const [filter, setFilter] = useState<string>("all");

  // Fetch AI analysis when event changes
  const fetchAnalysis = useCallback(async (event: EventData) => {
    setLoading(true);
    setAnalysis(null);

    try {
      const res = await axios.post("/api/analyze", {
        text: `${event.title}. ${event.description}`,
      });
      setAnalysis(res.data);
    } catch (err) {
      console.error("Failed to fetch analysis:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchAnalysis(selectedEvent);
      setActiveTab("intel");
    }
  }, [selectedEvent, fetchAnalysis]);

  // Filtered events list
  const filteredEvents = filter === "all"
    ? events
    : events.filter((e) => e.category === filter);

  return (
    <div className="dashboard-panel">
      {/* Tab Bar */}
      <div className="tab-bar">
        <button
          className={`tab-item ${activeTab === "intel" ? "active" : ""}`}
          onClick={() => setActiveTab("intel")}
        >
          Intelligence
        </button>
        <button
          className={`tab-item ${activeTab === "events" ? "active" : ""}`}
          onClick={() => setActiveTab("events")}
        >
          Events ({events.length})
        </button>
      </div>

      {/* ─── Events Tab ──────────────────────────────────────── */}
      {activeTab === "events" && (
        <>
          {/* Category Filters */}
          <div className="filter-pills">
            {["all", "defense", "trade", "energy", "climate"].map((cat) => (
              <button
                key={cat}
                className={`filter-pill ${filter === cat ? "active" : ""}`}
                onClick={() => setFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="panel-content">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className={`event-card ${selectedEvent?.id === event.id ? "active" : ""}`}
                onClick={() => onSelectEvent(event)}
              >
                <div className="event-title">{event.title}</div>
                <div className="event-meta">
                  <span
                    className="category-dot"
                    style={{ background: categoryColors[event.category] || "#00d4ff" }}
                  />
                  <span>{event.country}</span>
                  <span>·</span>
                  <span style={{ textTransform: "capitalize" }}>{event.category}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ─── Intelligence Tab ────────────────────────────────── */}
      {activeTab === "intel" && (
        <div className="panel-content">
          {!selectedEvent ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🛰️</div>
              <div style={{ fontSize: 13 }}>Select an event from the map</div>
              <div style={{ fontSize: 11, marginTop: 4 }}>or switch to the Events tab</div>
            </div>
          ) : (
            <div className="fade-in">
              {/* Event Header */}
              <div className="intel-section">
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div className="intel-label">Selected Event</div>
                    <h3 style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.4, marginBottom: 4 }}>
                      {selectedEvent.title}
                    </h3>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                      {selectedEvent.country} · <span style={{ textTransform: "capitalize" }}>{selectedEvent.category}</span>
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, marginTop: 10 }}>
                  {selectedEvent.description}
                </p>
              </div>

              {/* Loading State */}
              {loading && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div className="intel-section">
                    <div className="intel-label">Analyzing...</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div className="spinner" />
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        NETRA AI processing intelligence...
                      </span>
                    </div>
                  </div>
                  <div className="skeleton" style={{ height: 80 }} />
                  <div className="skeleton" style={{ height: 60 }} />
                  <div className="skeleton" style={{ height: 120 }} />
                </div>
              )}

              {/* Analysis Results */}
              {analysis && !loading && (
                <div className="slide-in">
                  {/* Risk + Impact + Confidence Row */}
                  <div className="intel-section" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div className="intel-label">Risk Level</div>
                      <span className={`risk-badge risk-${analysis.risk_level.toLowerCase()}`}>
                        {["CRITICAL", "High", "HIGH"].includes(analysis.risk_level) ? "🚨" : 
                         ["ELEVATED", "Medium"].includes(analysis.risk_level) ? "⚠️" : 
                         analysis.risk_level === "MONITOR" ? "📡" : "🟢"}{" "}
                        {analysis.risk_level}
                      </span>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div className="intel-label">India Impact</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: 
                        analysis.impact_score >= 7 ? "var(--risk-high)" :
                        analysis.impact_score >= 4 ? "var(--risk-medium)" : "var(--risk-low)" 
                      }}>
                        {analysis.impact_score}<span style={{ fontSize: 12, color: "var(--text-muted)" }}>/10</span>
                      </div>
                      <div className="impact-bar-container">
                        <div
                          className={`impact-bar ${analysis.impact_score >= 7 ? "high" : analysis.impact_score >= 4 ? "medium" : "low"}`}
                          style={{ width: `${analysis.impact_score * 10}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="intel-label" style={{ textAlign: "center" }}>Confidence</div>
                      <ConfidenceRing value={analysis.confidence} />
                    </div>
                  </div>

                  {/* Entities */}
                  <div className="intel-section">
                    <div className="intel-label">Key Entities</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {analysis.entities.map((entity, i) => (
                        <span
                          key={i}
                          style={{
                            padding: "3px 10px",
                            background: "var(--bg-tertiary)",
                            border: "1px solid var(--border-color)",
                            borderRadius: 4,
                            fontSize: 11,
                            color: "var(--accent-blue)",
                          }}
                        >
                          {entity}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* AI Summary */}
                  <div className="intel-section">
                    <div className="intel-label">Intelligence Summary</div>
                    <p className="intel-value" style={{ fontSize: 12.5 }}>
                      {analysis.summary}
                    </p>
                  </div>

                  {/* Cause-Effect Chain */}
                  <div className="intel-section">
                    <div className="intel-label">Cause-Effect Chain</div>
                    <ul className="chain-list">
                      {analysis.chain.map((item, i) => {
                        const stepText = typeof item === 'string' ? item : item.step;
                        const phase = typeof item === 'string' ? 'immediate' : item.phase;
                        return (
                          <li key={i} className="chain-item">
                            <div className="chain-dot" style={{ 
                              borderColor: phase === 'immediate' ? 'var(--clr-red)' : phase === 'secondary' ? 'var(--clr-orange)' : 'var(--clr-blue)' 
                            }}>{i + 1}</div>
                            <span className="chain-text">{stepText}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* India States Impact Section (New) */}
                  {analysis.india_states_impact && analysis.india_states_impact.length > 0 && (
                    <div className="intel-section">
                      <div className="intel-label" style={{ color: "#ff9933" }}>🇮🇳 India States Impact</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {analysis.india_states_impact.map((s, i) => (
                          <div key={i} style={{ 
                            padding: "6px 10px", 
                            background: "rgba(255,153,51,0.05)", 
                            border: "1px solid rgba(255,153,51,0.15)",
                            borderRadius: 4
                          }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>{s.state}</span>
                              <span style={{ 
                                fontSize: 8, fontWeight: 800, textTransform: "uppercase", 
                                color: s.severity === "high" ? "var(--clr-red)" : s.severity === "medium" ? "var(--clr-yellow)" : "var(--clr-green)"
                              }}>{s.severity}</span>
                            </div>
                            <p style={{ fontSize: 10, color: "var(--text-secondary)", lineHeight: 1.4 }}>{s.impact}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Knowledge Graph */}
                  <div className="intel-section" style={{ borderBottom: 'none' }}>
                    <div className="intel-label">Knowledge Graph</div>
                    <GraphView
                      chain={analysis.chain as any}
                      entities={analysis.entities}
                      eventTitle={selectedEvent.title}
                      indiaStates={analysis.india_states_impact}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
