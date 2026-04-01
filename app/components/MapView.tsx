"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ─── Constants ──────────────────────────────────────────────────
const DELHI_COORDS: [number, number] = [28.6139, 77.2090];

// India impact descriptions for each category
const INDIA_IMPACT: Record<string, string> = {
  defense: "DIRECT SECURITY IMPACT ON INDIA",
  trade: "AFFECTS INDIA'S TRADE & ECONOMY",
  energy: "IMPACTS INDIA'S ENERGY SECURITY",
  climate: "CLIMATE RISK TO INDIA",
  tech: "INDIA'S TECH SECTOR AFFECTED",
};

// Layer legend configuration — matches LayersPanel exactly
const LAYER_LEGEND: Record<string, { label: string; color: string; iconSvg: string }> = {
  defense: {
    label: "CONFLICT ZONES",
    color: "#ff2a2a",
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  },
  trade: {
    label: "TRADE ROUTES ($)",
    color: "#ffb800",
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  },
  tech: {
    label: "AI DATA CENTERS",
    color: "#0088ff",
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/></svg>`,
  },
  climate: {
    label: "CLIMATE HOTSPOTS",
    color: "#00e676",
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  },
  energy: {
    label: "NUCLEAR SITES",
    color: "#ff6b2c",
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  },
};

// SVG icons for each layer category (rendered inside markers)
const CATEGORY_ICONS: Record<string, { svg: string; color: string; cls: string }> = {
  defense: {
    cls: "conflict",
    color: "#ff2a2a",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  },
  trade: {
    cls: "economic",
    color: "#ffb800",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  },
  energy: {
    cls: "energy",
    color: "#ff6b2c",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  },
  climate: {
    cls: "climate",
    color: "#00e676",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  },
  tech: {
    cls: "tech",
    color: "#0088ff",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>`,
  },
};

// ─── Types ──────────────────────────────────────────────────────
interface EventData {
  id: number;
  title: string;
  country: string;
  latitude: number;
  longitude: number;
  category: string;
}

interface MapViewProps {
  events: EventData[];
  selectedEvent: EventData | null;
  onSelectEvent: (event: EventData) => void;
  layers: string[];
}

// ─── Build marker HTML with category icon ───────────────────────
function buildMarkerHtml(event: EventData, isSelected: boolean): string {
  const catIcon = CATEGORY_ICONS[event.category] || CATEGORY_ICONS.trade;
  const size = isSelected ? 36 : 24;
  const iconSize = isSelected ? 16 : 11;
  const glowSize = isSelected ? 20 : 10;

  return `
    <div class="map-marker-wrap" style="
      width: ${size}px; height: ${size}px;
      position: relative;
      display: flex; align-items: center; justify-content: center;
    ">
      ${isSelected ? `<div class="pulse-ring" style="
        border-color: ${catIcon.color};
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
        width: ${size * 3}px; height: ${size * 3}px;
        border-radius: 50%; border: 1.5px solid ${catIcon.color};
        animation: radar-pulse 3s cubic-bezier(0.2, 0, 0, 1) infinite;
        pointer-events: none;
      "></div>` : ''}
      <div style="
        width: ${size}px; height: ${size}px;
        border-radius: 50%;
        background: rgba(0,0,0,0.7);
        border: 1.5px solid ${catIcon.color};
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 0 ${glowSize}px ${catIcon.color}40, inset 0 0 ${glowSize/2}px ${catIcon.color}20;
        cursor: crosshair;
        transition: all 0.3s ease;
      ">
        <div style="
          width: ${iconSize}px; height: ${iconSize}px;
          color: ${catIcon.color};
          display: flex; align-items: center; justify-content: center;
        ">${catIcon.svg}</div>
      </div>
      ${isSelected ? `<div style="
        position: absolute; bottom: -18px; left: 50%; transform: translateX(-50%);
        white-space: nowrap; font-size: 8px; font-family: monospace;
        color: #fff; background: rgba(0,0,0,0.8); padding: 1px 5px;
        border-radius: 2px; border: 1px solid ${catIcon.color}40;
        letter-spacing: 0.5px; pointer-events: none;
      ">${event.country.toUpperCase()}</div>` : ''}
    </div>
  `;
}

// ─── Build Legend Control HTML ──────────────────────────────────
function buildLegendHtml(activeLayers: string[]): string {
  let legendItems = '';
  
  for (const [layerId, config] of Object.entries(LAYER_LEGEND)) {
    const isActive = activeLayers.includes(layerId);
    const opacity = isActive ? '1' : '0.3';
    
    legendItems += `
      <div style="
        display: flex; align-items: center; gap: 8px; 
        padding: 4px 0; opacity: ${opacity};
        transition: opacity 0.3s ease;
      ">
        <div style="
          width: 20px; height: 20px; border-radius: 50%;
          background: rgba(0,0,0,0.6);
          border: 1.5px solid ${config.color};
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 6px ${config.color}30;
          flex-shrink: 0;
          color: ${config.color};
        ">${config.iconSvg}</div>
        <span style="
          font-size: 9px; font-family: 'Inter', monospace; letter-spacing: 1px;
          color: ${isActive ? '#fff' : '#555'};
          font-weight: ${isActive ? '600' : '400'};
        ">${config.label}</span>
      </div>
    `;
  }
  
  return `
    <div style="
      background: rgba(10, 10, 10, 0.88);
      backdrop-filter: blur(12px);
      border: 1px solid #222;
      border-radius: 6px;
      padding: 10px 14px;
      min-width: 170px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.5);
    ">
      <div style="
        font-size: 8px; font-weight: 700; letter-spacing: 2px;
        color: #777; text-transform: uppercase; 
        margin-bottom: 8px; padding-bottom: 6px;
        border-bottom: 1px solid #222;
        display: flex; align-items: center; gap: 6px;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#777" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/></svg>
        MAP LEGEND
      </div>
      ${legendItems}
      <div style="
        display: flex; align-items: center; gap: 8;
        padding: 4px 0; opacity: 1;
      ">
        <div style="
          width: 20px; height: 20px; border-radius: 50%;
          background: rgba(0,0,0,0.6);
          border: 1.5px solid #ffb800;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 6px rgba(255,184,0,0.3);
          flex-shrink: 0;
          color: #ffb800; font-size: 11px; font-weight: 900;
          font-family: monospace;
        ">$</div>
        <span style="
          font-size: 9px; font-family: 'Inter', monospace; letter-spacing: 1px;
          color: #fff; font-weight: 600;
        ">TRADE CORRIDORS</span>
      </div>
      <div style="
        margin-top: 8px; padding-top: 6px;
        border-top: 1px solid #222;
        display: flex; align-items: center; gap: 6px;
      ">
        <div style="
          width: 10px; height: 10px; border-radius: 50%;
          background: #00e676; border: 2px solid #fff;
          box-shadow: 0 0 8px #00e676;
          flex-shrink: 0;
        "></div>
        <span style="font-size: 8px; font-family: monospace; color: #00e676; letter-spacing: 1px; font-weight: 700;">
          INDIA (HQ)
        </span>
      </div>
    </div>
  `;
}

export default function MapView({ events, selectedEvent, onSelectEvent, layers }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.FeatureGroup | null>(null);
  const linesLayerRef = useRef<L.FeatureGroup | null>(null);
  const legendControlRef = useRef<L.Control | null>(null);

  // Initialize Map — FIXED view centered on India + surrounding regions
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [25, 55],  // Center between India and the Middle East for best world view
      zoom: 3,
      minZoom: 2,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: false,
      // Keep map interactive for zoom but don't auto-fly
      dragging: true,
      scrollWheelZoom: true,
    });

    // ── CartoDB Dark Matter — dark style with bold white labels like the reference ──
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      subdomains: "abcd",
      maxZoom: 19,
      attribution: '&copy; CartoDB',
    }).addTo(map);

    L.control.zoom({ position: "topright" }).addTo(map);

    // INDIA marker — always visible with special green glow + label
    const indiaIcon = L.divIcon({
      className: "leaflet-custom-div",
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <div style="
            width: 16px; height: 16px; border-radius: 50%;
            background: #00e676; border: 2.5px solid #fff;
            box-shadow: 0 0 20px #00e676, 0 0 40px #00e67640;
            animation: radar-pulse 2.5s ease infinite;
          "></div>
          <div style="
            position: absolute; top: -16px; left: 50%; transform: translateX(-50%);
            font-size: 10px; font-weight: 900; font-family: 'Inter', sans-serif;
            color: #00e676; letter-spacing: 2px; white-space: nowrap;
            text-shadow: 0 0 8px rgba(0,230,118,0.5);
            pointer-events: none;
          ">INDIA</div>
        </div>
      `,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    L.marker(DELHI_COORDS, { icon: indiaIcon, interactive: false }).addTo(map);

    markersLayerRef.current = L.featureGroup().addTo(map);
    linesLayerRef.current = L.featureGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Add/Update Legend Control based on active layers
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove old legend if exists
    if (legendControlRef.current) {
      mapRef.current.removeControl(legendControlRef.current);
      legendControlRef.current = null;
    }

    // Create new legend control
    const LegendControl = L.Control.extend({
      options: { position: 'bottomleft' as L.ControlPosition },
      onAdd: function() {
        const div = L.DomUtil.create('div', 'leaflet-legend-control');
        div.innerHTML = buildLegendHtml(layers);
        // Prevent map interactions when hovering over legend
        L.DomEvent.disableClickPropagation(div);
        L.DomEvent.disableScrollPropagation(div);
        return div;
      },
    });

    legendControlRef.current = new LegendControl();
    legendControlRef.current.addTo(mapRef.current);
  }, [layers]);

  // Sync Markers and Lines — ALL events draw connection lines to India
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current || !linesLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    linesLayerRef.current.clearLayers();

    const visibleEvents = events.filter(e => layers.includes(e.category));

    visibleEvents.forEach((event) => {
      const isSelected = selectedEvent?.id === event.id;
      const catIcon = CATEGORY_ICONS[event.category] || CATEGORY_ICONS.trade;
      const markerSize = isSelected ? 36 : 24;
      const indiaImpact = INDIA_IMPACT[event.category] || "INDIA MONITOR";

      const icon = L.divIcon({
        className: "leaflet-custom-div",
        html: buildMarkerHtml(event, isSelected),
        iconSize: [markerSize, markerSize],
        iconAnchor: [markerSize / 2, markerSize / 2],
      });

      const latlng: [number, number] = [event.latitude, event.longitude];
      const marker = L.marker(latlng, { icon }).addTo(markersLayerRef.current!);
      
      // Popup with India impact info
      marker.bindPopup(`
        <div style="
          background: #111; color: #fff; padding: 10px 14px; border-radius: 6px;
          font-family: Inter, sans-serif; min-width: 200px; border: 1px solid ${catIcon.color}40;
        ">
          <div style="font-size: 12px; font-weight: 700; margin-bottom: 6px; color: ${catIcon.color};">
            ${event.title}
          </div>
          <div style="font-size: 10px; color: #999; margin-bottom: 8px;">
            📍 ${event.country}
          </div>
          <div style="
            font-size: 9px; padding: 4px 8px; border-radius: 3px;
            background: ${catIcon.color}15; border: 1px solid ${catIcon.color}30;
            color: ${catIcon.color}; font-weight: 700; letter-spacing: 1px;
            display: flex; align-items: center; gap: 4px;
          ">
            🇮🇳 ${indiaImpact}
          </div>
        </div>
      `, {
        className: 'netra-popup',
        closeButton: false,
        maxWidth: 280,
      });

      marker.on("click", () => onSelectEvent(event));

      // Draw connection line to Delhi for ALL visible events — shows India-centric view
      const opacity = isSelected ? 0.6 : 0.12;
      const color = isSelected ? '#a855f7' : catIcon.color;
      
      // Create a curved path via midpoint for visual appeal (deterministic offset)
      const offset = ((event.id * 7) % 10 - 5) * 0.8; // deterministic pseudo-random offset
      const mid: [number, number] = [
        (event.latitude + DELHI_COORDS[0]) / 2 + offset,
        (event.longitude + DELHI_COORDS[1]) / 2,
      ];

      L.polyline([latlng, mid, DELHI_COORDS], {
        color: color,
        weight: isSelected ? 2.5 : 0.8,
        opacity: opacity,
        dashArray: isSelected ? '6,4' : '3,8',
        lineCap: 'round',
        smoothFactor: 3,
      }).addTo(linesLayerRef.current!);
    });

  }, [events, selectedEvent, layers, onSelectEvent]);

  // NO fly-to animation — map stays fixed/static as user requested

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", background: "#050505" }}>
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
