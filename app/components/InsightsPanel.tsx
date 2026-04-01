"use client";

import { Crosshair, Shield, Radio, Globe, Flag, TrendingUp } from "lucide-react";
import type { AgentIntelligenceTask } from "@/lib/agent";

interface InsightsPanelProps {
  analysis: AgentIntelligenceTask | null;
  loading?: boolean;
}

export default function InsightsPanel({ analysis, loading }: InsightsPanelProps) {

  if (loading || !analysis) {
    return (
      <div className="panel flex flex-col pointer-events-auto shadow-xl flex-1 rounded overflow-y-auto">
        <div className="ph-header">
          <span className="ph-title"><span className="live-dot" style={{ backgroundColor: "var(--clr-purple)" }} /> AI INSIGHTS</span>
          <span className="text-[var(--clr-purple)] text-[9px] tracking-widest font-bold">PROCESSING</span>
        </div>
        <div className="flex-1 p-4 flex items-center justify-center flex-col gap-3">
          <div className="spinner" />
          <span className="text-[10px] text-[var(--text-dim)] font-mono animate-pulse">Establishing neuro-link...</span>
        </div>
      </div>
    );
  }

  // Determine threat style
  const isCrit = analysis.risk_level === "CRITICAL";
  const isHigh = analysis.risk_level === "HIGH";
  const bgBadge = isCrit ? "bg-[var(--clr-red)]/20" : isHigh ? "bg-[var(--clr-orange)]/20" : "bg-[var(--clr-yellow)]/20";
  const borderBadge = isCrit ? "border-[var(--clr-red)]/40" : isHigh ? "border-[var(--clr-orange)]/40" : "border-[var(--clr-yellow)]/40";
  const textBadge = isCrit ? "text-[var(--clr-red)]" : isHigh ? "text-[var(--clr-orange)]" : "text-[var(--clr-yellow)]";
  const riskColor = isCrit ? "var(--clr-red)" : isHigh ? "var(--clr-orange)" : "var(--clr-yellow)";

  return (
    <div className="panel flex flex-col pointer-events-auto border-l border-[var(--border-dim)] shadow-2xl flex-1 rounded" style={{ minHeight: 0, overflow: 'hidden' }}>

      {/* Scrollable inner wrapper */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>

      {/* HEADER SECTION */}
      <div className="ph-header bg-[#111]" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
        <span className="ph-title"><span className="live-dot" /> AI INSIGHTS</span>
        <span className="bg-[var(--clr-green)] text-black px-1.5 py-[2px] rounded text-[8px] font-bold">LIVE</span>
      </div>

      {/* 🇮🇳 INDIA IMPACT BANNER */}
      <div style={{
        padding: "8px 16px",
        background: `linear-gradient(90deg, rgba(255,153,51,0.12) 0%, rgba(19,136,8,0.12) 100%)`,
        borderBottom: "1px solid var(--border-dim)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 22, height: 14, borderRadius: 2, overflow: "hidden",
            display: "flex", flexDirection: "column",
          }}>
            <div style={{ flex: 1, background: "#FF9933" }} />
            <div style={{ flex: 1, background: "#fff" }} />
            <div style={{ flex: 1, background: "#138808" }} />
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", letterSpacing: 1 }}>
            INDIA IMPACT ASSESSMENT
          </span>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <TrendingUp size={12} color={riskColor} />
          <span style={{
            fontSize: 9, fontWeight: 900, color: riskColor,
            letterSpacing: 1.5,
          }}>
            {analysis.risk_level}
          </span>
          <span style={{
            fontSize: 20, fontWeight: 900, color: riskColor,
            fontFamily: "monospace", lineHeight: 1,
          }}>
            {analysis.impact_score}
          </span>
          <span style={{ fontSize: 9, color: "var(--text-dim)" }}>/10</span>
        </div>
      </div>

      {/* WORLD BRIEF */}
      <div className="p-4 border-b border-[var(--border-dim)]">
        <div className="flex items-center gap-2 mb-2 text-[10px] font-bold text-white uppercase tracking-widest">
          <Globe size={12} color="var(--clr-blue)" /> NETRA BRIEF
        </div>
        <div style={{
          background: "#111", padding: "10px 12px", borderRadius: 6,
          border: "1px solid #282828", position: "relative",
          fontSize: 11, lineHeight: 1.6, color: "#ddd",
        }}>
          {analysis.summary}
          {/* Subtle gradient accent */}
          <div style={{
            position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
            background: `linear-gradient(180deg, ${riskColor}, transparent)`,
            borderRadius: "6px 0 0 6px",
          }} />
        </div>
      </div>

      {/* CAUSAL REASONING CHAIN */}
      <div className="p-4 border-b border-[var(--border-dim)]" style={{ background: "rgba(0,0,0,0.3)" }}>
        <div className="flex items-center gap-2 mb-3 text-[10px] font-bold text-white uppercase tracking-widest">
          <Radio size={12} color="var(--clr-yellow)" /> CAUSAL CHAIN
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, position: "relative", paddingLeft: 16 }}>
          {/* Vertical timeline line */}
          <div style={{
            position: "absolute", left: 11, top: 0, bottom: 0, width: 1,
            background: "linear-gradient(180deg, transparent, var(--border-dim), transparent)",
          }} />
          {analysis.chain.map((link, idx) => (
            <div key={idx} style={{ position: "relative", display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{
                width: 24, height: 24, borderRadius: "50%",
                border: "1px solid var(--border-dim)", background: "#080808",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 700, color: "var(--clr-yellow)",
                flexShrink: 0, zIndex: 1,
              }}>
                {idx + 1}
              </div>
              <div style={{
                flex: 1, padding: "6px 10px", borderRadius: 4,
                background: "#0a0a0a", border: "1px solid var(--border-dim)",
              }}>
                <div style={{
                  fontWeight: 700, fontSize: 8, textTransform: "uppercase",
                  letterSpacing: "1.5px", marginBottom: 3,
                  color: link.phase === "immediate" ? "var(--clr-red)" : link.phase === "secondary" ? "var(--clr-yellow)" : "var(--clr-blue)",
                }}>
                  {link.phase.replace("_", " ")}
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.8)", lineHeight: 1.4 }}>{link.step}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🗺️ INDIAN STATES IMPACT */}
      {analysis.india_states_impact && analysis.india_states_impact.length > 0 && (
        <div className="p-4 border-b border-[var(--border-dim)]" style={{ background: "rgba(255,153,51,0.04)" }}>
          <div className="flex items-center gap-2 mb-3 text-[10px] font-bold text-white uppercase tracking-widest" style={{ justifyContent: "space-between" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Flag size={12} color="#ff9933" /> INDIAN STATES IMPACT CORRIDOR
            </span>
            <span style={{ fontSize: 7, color: "rgba(255,153,51,0.5)", fontWeight: 400, letterSpacing: "1px" }}>↕ SCROLL</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 340, overflowY: "auto", paddingRight: 4 }}>
            {analysis.india_states_impact.map((s, i) => {
              const sevColor = s.severity === "high" ? "var(--clr-red)" : s.severity === "medium" ? "var(--clr-yellow)" : "var(--clr-green)";
              const sevBg = s.severity === "high" ? "rgba(255,42,42,0.08)" : s.severity === "medium" ? "rgba(255,184,0,0.08)" : "rgba(0,230,118,0.08)";
              const sevBorder = s.severity === "high" ? "rgba(255,42,42,0.25)" : s.severity === "medium" ? "rgba(255,184,0,0.25)" : "rgba(0,230,118,0.25)";
              const isDelhiRelated = s.state === "Delhi" || s.impact.toLowerCase().includes("delhi");
              return (
                <div key={i} style={{
                  padding: "8px 10px", borderRadius: 5,
                  background: isDelhiRelated ? "rgba(255,153,51,0.1)" : sevBg,
                  border: `1px solid ${isDelhiRelated ? "rgba(255,153,51,0.35)" : sevBorder}`,
                  display: "flex", alignItems: "center", gap: 10,
                  position: "relative", overflow: "hidden",
                  flexShrink: 0,
                }}>
                  {/* Pulsing indicator for Delhi-related impacts */}
                  {isDelhiRelated && (
                    <div style={{
                      position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
                      background: "#ff9933",
                      boxShadow: "0 0 6px #ff9933",
                    }} />
                  )}
                  {/* Severity dot */}
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: sevColor,
                    boxShadow: `0 0 6px ${sevColor}`,
                    flexShrink: 0,
                  }} />
                  {/* State name */}
                  <div style={{ minWidth: 80, flexShrink: 0 }}>
                    <div style={{
                      fontSize: 10, fontWeight: 700, color: "#fff",
                      fontFamily: "monospace", letterSpacing: "0.5px",
                    }}>
                      {s.state}
                    </div>
                    <div style={{
                      fontSize: 7, fontWeight: 700, textTransform: "uppercase",
                      letterSpacing: "1.5px", color: sevColor, marginTop: 1,
                    }}>
                      {s.severity}
                    </div>
                  </div>
                  {/* Impact description */}
                  <div style={{
                    fontSize: 9, color: "rgba(255,255,255,0.7)",
                    lineHeight: 1.4, flex: 1,
                  }}>
                    {s.impact}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Delhi connection summary */}
          {analysis.india_states_impact.some(s => s.state === "Delhi" || s.impact.toLowerCase().includes("delhi")) && (
            <div style={{
              marginTop: 8, padding: "6px 10px", borderRadius: 4,
              background: "rgba(255,153,51,0.06)",
              border: "1px solid rgba(255,153,51,0.15)",
              fontSize: 8, color: "rgba(255,153,51,0.8)",
              fontFamily: "monospace", letterSpacing: "1px",
              textTransform: "uppercase",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <span style={{ fontSize: 10 }}>🏛️</span>
              DELHI NCR COMMAND CENTER ACTIVE — CENTRAL RESPONSE COORDINATED
            </div>
          )}
        </div>
      )}

      {/* AI STRATEGIC POSTURE */}
      <div className="p-4 flex-1">
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 12, fontSize: 10, fontWeight: 700, color: "#fff",
          textTransform: "uppercase", letterSpacing: "1.5px",
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Crosshair size={12} color="var(--clr-blue)" /> AI STRATEGIC POSTURE
          </span>
          <span style={{
            background: "#fff", color: "#000", padding: "1px 6px",
            borderRadius: 10, fontSize: 8, fontWeight: 800,
          }}>1 NEW</span>
        </div>

        <div style={{
          padding: 12, borderRadius: 6,
          border: `1px solid ${riskColor}30`,
          background: `${riskColor}08`,
          position: "relative", overflow: "hidden",
        }}>
          {/* Threat scanner animation line */}
          <div style={{
            position: "absolute", top: 0, left: 0, width: "100%", height: 1,
            background: riskColor,
            boxShadow: `0 0 8px ${riskColor}`,
            animation: "scan 3s ease-in-out infinite",
          }} />

          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 10, paddingBottom: 8,
            borderBottom: "1px solid var(--border-dim)",
          }}>
            <span style={{ fontSize: 12, fontFamily: "monospace", color: "#fff", letterSpacing: "2px" }}>THEATER CALIBRATION</span>
            <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: "2px", color: riskColor }}>{analysis.risk_level}</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {analysis.strategic_posture.map((p, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                fontSize: 10, fontFamily: "monospace",
              }}>
                <span style={{ color: "var(--text-dim)", width: 50, flexShrink: 0 }}>{p.domain}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#fff" }}>
                  <Shield size={10} color={p.threat_vector > 2 ? "var(--clr-red)" : "var(--clr-green)"} /> {p.status}
                </span>
                <div style={{ display: "flex", gap: 2 }}>
                  {[...Array(5)].map((_, j) => (
                    <div key={j} style={{
                      width: 4, height: 12,
                      background: j < p.threat_vector
                        ? (p.threat_vector > 2 ? "var(--clr-red)" : "var(--clr-yellow)")
                        : "#333",
                      borderRadius: 1,
                    }} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 14, display: "flex", justifyContent: "space-between",
            fontSize: 9, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "2px",
          }}>
            <span>→ Active State</span>
            <span>→ NETRA Watch</span>
          </div>
        </div>
      </div>

      </div>{/* end scrollable inner wrapper */}
    </div>
  );
}
