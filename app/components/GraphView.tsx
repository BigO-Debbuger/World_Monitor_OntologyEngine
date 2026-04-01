/**
 * GraphView Component — Dynamic India-Centric Knowledge Graph
 *
 * Renders a force-directed graph from AI cause-effect chain.
 * Now includes Indian state nodes showing local impact.
 * Changes fully based on selected event.
 */

"use client";

import { useMemo, useRef, useCallback, useEffect, useState } from "react";
import * as d3 from "d3-force";

// ─── Types ──────────────────────────────────────────────────────

interface IndiaStateImpact {
  state: string;
  impact: string;
  severity: "high" | "medium" | "low";
}

interface GraphViewProps {
  chain: ({ step: string; phase: string } | string)[];
  entities: string[];
  eventTitle: string;
  indiaStates?: IndiaStateImpact[];
}

interface GraphNode {
  id: string;
  name: string;
  type: "event" | "step" | "entity" | "india" | "state";
  val: number;
  severity?: "high" | "medium" | "low";
}

interface GraphLink {
  source: string;
  target: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export default function GraphView({ chain, entities, eventTitle, indiaStates }: GraphViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 340, height: 230 });
  const [ForceGraph, setForceGraph] = useState<any>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const fgRef = useRef<any>(null);

  // Dynamically import react-force-graph-2d (client-only)
  useEffect(() => {
    import("react-force-graph-2d").then((mod) => {
      setForceGraph(() => mod.default);
    });
  }, []);

  // Measure container dimensions
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width || 340,
          height: Math.max(entry.contentRect.height, 220),
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Build graph data — includes India + state nodes
  const graphData: GraphData = useMemo(() => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    // Central event node
    const eventId = "event-root";
    nodes.push({
      id: eventId,
      name: eventTitle.length > 18 ? eventTitle.substring(0, 18) + "..." : eventTitle,
      type: "event",
      val: 10,
    });

    // Add chain steps as connected nodes
    chain.forEach((item, i) => {
      const stepId = `step-${i}`;
      const stepText = typeof item === 'string' ? item : item.step;
      const label = stepText.length > 20 ? stepText.substring(0, 20) + "..." : stepText;

      nodes.push({
        id: stepId,
        name: label,
        type: "step",
        val: 5,
      });

      if (i === 0) {
        links.push({ source: eventId, target: stepId });
      } else {
        links.push({ source: `step-${i - 1}`, target: stepId });
      }
    });

    // Add entity nodes branching from the root
    entities.slice(0, 5).forEach((entity, i) => {
      const entityId = `entity-${i}`;
      nodes.push({
        id: entityId,
        name: entity,
        type: "entity",
        val: 4,
      });
      links.push({ source: eventId, target: entityId });
    });

    // INDIA hub node — central hub that connects to state nodes
    const indiaId = "india-hub";
    nodes.push({
      id: indiaId,
      name: "🇮🇳 INDIA",
      type: "india",
      val: 8,
    });
    // Connect last chain step to India (shows the cascading impact)
    if (chain.length > 0) {
      links.push({ source: `step-${chain.length - 1}`, target: indiaId });
    } else {
      links.push({ source: eventId, target: indiaId });
    }

    // Add Indian state nodes
    if (indiaStates && indiaStates.length > 0) {
      indiaStates.forEach((s, i) => {
        const stateId = `state-${i}`;
        nodes.push({
          id: stateId,
          name: s.state,
          type: "state",
          val: s.severity === "high" ? 5 : 3,
          severity: s.severity,
        });
        links.push({ source: indiaId, target: stateId });
      });
    }

    return { nodes, links };
  }, [chain, entities, eventTitle, indiaStates]);

  // Node color based on type
  const nodeColor = useCallback((node: any) => {
    switch (node.type) {
      case "event": return "#00d4ff";
      case "step": return "#ff6b2c";
      case "entity": return "#8b5cf6";
      case "india": return "#00e676";
      case "state":
        return node.severity === "high" ? "#ff2a2a" : node.severity === "medium" ? "#ffb800" : "#00e676";
      default: return "#5f6680";
    }
  }, []);

  // Node canvas render — with hover highlight
  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.name;
    const fontSize = Math.max(10 / globalScale, 3);
    const isHovered = hoveredNode === node.id;

    let baseRadius;
    if (node.type === "event") baseRadius = 7;
    else if (node.type === "india") baseRadius = 6;
    else if (node.type === "step") baseRadius = 4.5;
    else if (node.type === "state") baseRadius = node.severity === "high" ? 4 : 3;
    else baseRadius = 3.5;

    const radius = isHovered ? baseRadius * 1.5 : baseRadius;

    // Glow effect
    ctx.shadowColor = nodeColor(node);
    ctx.shadowBlur = isHovered ? 18 : 8;

    // Draw node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = nodeColor(node);
    ctx.fill();

    // India node gets a special ring
    if (node.type === "india") {
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.5 / globalScale;
      ctx.stroke();
    }

    // Hover ring
    if (isHovered) {
      ctx.strokeStyle = nodeColor(node);
      ctx.lineWidth = 1.5 / globalScale;
      ctx.stroke();
    }

    ctx.shadowBlur = 0;

    // Label
    const labelSize = isHovered ? fontSize * 1.3 : fontSize;
    ctx.font = `${isHovered || node.type === "india" ? 'bold ' : ''}${labelSize}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = isHovered ? "#fff" : (node.type === "india" ? "#00e676" : "#e8eaed");
    ctx.fillText(label, node.x, node.y + radius + 2);
  }, [nodeColor, hoveredNode]);

  // Link color — green for India connections
  const linkColor = useCallback((link: any) => {
    const targetId = typeof link.target === 'string' ? link.target : link.target?.id;
    const sourceId = typeof link.source === 'string' ? link.source : link.source?.id;
    if (targetId?.startsWith("state-") || sourceId === "india-hub" || targetId === "india-hub") {
      return "rgba(0, 230, 118, 0.3)";
    }
    return "rgba(0, 212, 255, 0.2)";
  }, []);

  // Configure forces for better spacing and auto zoom-to-fit
  useEffect(() => {
    if (!fgRef.current || !ForceGraph) return;
    // Increase repulsion so nodes don't overlap
    fgRef.current.d3Force('charge')?.strength(-120).distanceMax(300);
    // Increase link distance for better spacing
    fgRef.current.d3Force('link')?.distance(50);
    // Add collision detection to prevent node overlap
    fgRef.current.d3Force('collide', d3.forceCollide().radius(25).strength(0.8));
    // Reheat simulation with new forces
    fgRef.current.d3ReheatSimulation();
    // Auto zoom-to-fit after simulation settles
    const timer = setTimeout(() => {
      if (fgRef.current) {
        fgRef.current.zoomToFit(400, 20);
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [ForceGraph, graphData]);

  if (!ForceGraph) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full" style={{ cursor: "grab" }}>
      <ForceGraph
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        nodeCanvasObject={paintNode}
        nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
          ctx.beginPath();
          ctx.arc(node.x, node.y, 12, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        }}
        onNodeHover={(node: any) => setHoveredNode(node ? node.id : null)}
        onNodeClick={(node: any) => {
          if (fgRef.current) {
            fgRef.current.centerAt(node.x, node.y, 400);
            fgRef.current.zoom(3, 400);
          }
        }}
        linkColor={linkColor}
        linkWidth={(link: any) => {
          const targetId = typeof link.target === 'string' ? link.target : link.target?.id;
          return targetId?.startsWith("state-") ? 1 : 1.5;
        }}
        linkDirectionalParticles={1}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleColor={(link: any) => {
          const targetId = typeof link.target === 'string' ? link.target : link.target?.id;
          return targetId?.startsWith("state-") ? "#00e676" : "#00d4ff";
        }}
        backgroundColor="transparent"
        d3AlphaDecay={0.12}
        d3VelocityDecay={0.55}
        cooldownTicks={100}
        cooldownTime={4000}
        warmupTicks={50}
        enableZoomInteraction={true}
        enablePanInteraction={true}
        enableNodeDrag={true}
        onEngineStop={() => { }}
      />
    </div>
  );
}
