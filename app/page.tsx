"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import eventsData from "@/data/events.json";

// Import new modular panels
import LayersPanel from "./components/LayersPanel";
import LiveNews from "./components/LiveNews";
import VisualFeed from "./components/VisualFeed";
import InsightsPanel from "./components/InsightsPanel";
import ScenarioBox from "./components/ScenarioBox";

// Dynamic imports for rendering logic
const MapView = dynamic(() => import("./components/MapView"), { ssr: false });
const GraphView = dynamic(() => import("./components/GraphView"), { ssr: false });

import { Globe, Maximize } from "lucide-react";
import type { AgentIntelligenceTask } from "@/lib/agent";
import axios from "axios";

export default function CommandDashboard() {
  const events: any[] = eventsData;

  // Global State
  const [layers, setLayers] = useState<string[]>(["defense", "trade", "energy", "climate", "tech"]);
  const [selectedEvent, setSelectedEvent] = useState<any>(events[0]);
  const [analysis, setAnalysis] = useState<AgentIntelligenceTask | null>(null);
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState("");

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setTime(d.toUTCString().toUpperCase());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch AI Agent Data
  const fetchAnalysis = useCallback(async (event: any) => {
    setLoading(true);
    setAnalysis(null);
    try {
      const res = await axios.post("/api/analyze", { text: `${event.title}. ${event.description}` });
      setAnalysis(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // On mount and on event selection update analysis
  useEffect(() => {
    if (selectedEvent) {
      fetchAnalysis(selectedEvent);
    }
  }, [selectedEvent, fetchAnalysis]);

  const toggleLayer = (layer: string) => {
    setLayers(prev => prev.includes(layer) ? prev.filter(l => l !== layer) : [...prev, layer]);
  };

  return (
    <div className="cmd-layout bg-black">

      {/* ─── MAP LAYER (Background) ─── */}
      <div className="cmd-map-area">
        <MapView
          events={events}
          selectedEvent={selectedEvent}
          onSelectEvent={setSelectedEvent}
          layers={layers}
        />
      </div>

      {/* ─── TOP STATUS BAR ─── */}
      <header className="cmd-topbar">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 border border-[var(--clr-green)] px-2 py-0.5 rounded text-[10px] font-bold tracking-widest bg-[var(--clr-green)]/10 text-[var(--clr-green)]">
            <Globe size={12} /> NETRA AI
          </div>
          <div className="flex gap-2 text-[10px] font-mono text-[var(--text-dim)] uppercase">
            <span>v2.5.25</span>
            <span className="flex items-center gap-1"><span className="live-dot" /> LIVE</span>
            <span>India Strategic Intel</span>
          </div>
        </div>

        <div className="absolute left-[50%] -translate-x-[50%] text-[10px] font-mono font-bold tracking-[0.2em] text-[var(--text-dim)]">
          {time || "SYS_INIT_SEQUENCE"}
        </div>

        <div className="flex items-center gap-4 text-[10px] font-mono uppercase">
          <Maximize
            size={16}
            className="cursor-pointer hover:text-white text-[var(--text-dim)]"
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
              } else {
                document.exitFullscreen().catch(() => {});
              }
            }}
          />
        </div>
      </header>

      {/* ─── OVERLAY PANELS ─── */}
      <div className="cmd-panels-overlay">

        {/* Left Column: Layers & Scenario Engine */}
        <div style={{ gridColumn: 1, gridRow: 1, margin: "16px 0 16px 16px" }} className="flex flex-col gap-4 pointer-events-none">
          <LayersPanel layers={layers} toggleLayer={toggleLayer} />

          <div className="panel flex flex-col max-h-[220px] pointer-events-auto rounded overflow-hidden">
            <div className="ph-header bg-[#111]"><span>SIMULATION ENGINE</span></div>
            <div className="flex-1 overflow-y-auto">
              <ScenarioBox selectedEvent={selectedEvent} />
            </div>
          </div>
        </div>

        {/* Right Column: AI Insights & Graph (spans both rows) */}
        <div style={{ gridColumn: 3, gridRow: "1 / 3", margin: "16px 16px 16px 0", minHeight: 0 }} className="flex flex-col gap-4 pointer-events-none">
          <InsightsPanel analysis={analysis} loading={loading} />

          {/* Knowledge Graph Container */}
          <div className="panel pointer-events-auto shadow-2xl relative overflow-hidden rounded" style={{ height: 230 }}>
            <div className="ph-header bg-[#111]">
              <span className="ph-title"><span className="live-dot" style={{ backgroundColor: "var(--clr-blue)" }} /> KNOWLEDGE GRAPH</span>
            </div>
            <div className="flex-1 flex justify-center items-center" style={{ height: 190 }}>
              {analysis && !loading ? (
                <GraphView
                  chain={analysis.chain.map(c => c.step)}
                  entities={analysis.entities}
                  eventTitle={selectedEvent?.title}
                  indiaStates={analysis.india_states_impact}
                />
              ) : (
                <div className="flex flex-col items-center gap-2 opacity-50">
                  <Globe size={24} className="animate-spin text-[var(--clr-blue)]" />
                  <span className="text-[9px] font-mono tracking-widest text-[#999]">COMPILING GRAPH...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom: News & Visual Feeds (spans columns 1 and 2) */}
        <div
          className="panel shadow-2xl pointer-events-auto overflow-hidden rounded"
          style={{ gridColumn: "1 / 3", gridRow: 2, margin: "0 16px 16px 16px", flexDirection: "row" }}
        >
          <LiveNews />
          <VisualFeed />
        </div>

      </div>

    </div>
  );
}
