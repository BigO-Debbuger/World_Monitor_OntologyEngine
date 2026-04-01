"use client";

import { Tv, Radio, Volume2, VolumeX } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";

// 24/7 live stream video IDs — direct embeds
const LIVE_CHANNELS = [
  { name: "WION LIVE", videoId: "rfDa1CzwsuE", color: "var(--clr-red)" },
  { name: "NDTV 24x7", videoId: "7Ui6sej7o9U", color: "var(--clr-blue)" },
  { name: "INDIA TODAY", videoId: "sYZtOFzM78M", color: "var(--clr-orange)" },
  { name: "DD NEWS", videoId: "anuHqZ8noqU", color: "var(--clr-yellow)" },
  { name: "AL JAZEERA", videoId: "gCNeDWCI0vo", color: "var(--clr-green)" },
  { name: "REPUBLIC TV", videoId: "pWPTzoPCAxo", color: "var(--clr-purple)" },
];

export default function VisualFeed() {
  const [timestamps, setTimestamps] = useState<string[]>([]);
  // -1 = all muted, 0-5 = that channel index is unmuted
  const [unmutedChannel, setUnmutedChannel] = useState<number>(-1);
  const iframeRefs = useRef<(HTMLIFrameElement | null)[]>([]);

  useEffect(() => {
    const updateTs = () => {
      const now = new Date();
      const ts = LIVE_CHANNELS.map(() =>
        now.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " UTC"
      );
      setTimestamps(ts);
    };
    updateTs();
    const interval = setInterval(updateTs, 1000);
    return () => clearInterval(interval);
  }, []);

  // All iframes load muted — we control sound via postMessage
  // Note: origin param removed to prevent server/client hydration mismatch
  const buildEmbedUrl = (videoId: string) => {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`;
  };

  // Send mute/unmute commands to YouTube iframes via postMessage
  const sendCommand = useCallback((iframe: HTMLIFrameElement | null, func: string) => {
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage(
      JSON.stringify({ event: "command", func, args: "" }),
      "*"
    );
  }, []);

  const handleToggleMute = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation();

    if (unmutedChannel === index) {
      // Mute this channel
      sendCommand(iframeRefs.current[index], "mute");
      setUnmutedChannel(-1);
    } else {
      // Mute the previously unmuted channel
      if (unmutedChannel >= 0) {
        sendCommand(iframeRefs.current[unmutedChannel], "mute");
      }
      // Unmute the clicked channel
      sendCommand(iframeRefs.current[index], "unMute");
      setUnmutedChannel(index);
    }
  }, [unmutedChannel, sendCommand]);

  const handleMuteAll = useCallback(() => {
    if (unmutedChannel >= 0) {
      sendCommand(iframeRefs.current[unmutedChannel], "mute");
    }
    setUnmutedChannel(-1);
  }, [unmutedChannel, sendCommand]);

  return (
    <div style={{ flex: 2, display: "flex", flexDirection: "column", minWidth: 320 }}>
      <div className="ph-header">
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Tv size={11} color="var(--clr-red)" />
          LIVE NEWS CHANNELS
          <span style={{
            fontSize: 7, background: "var(--clr-red)", color: "#fff", padding: "1px 4px",
            borderRadius: 2, fontWeight: 900, letterSpacing: 1,
            animation: "live-pulse 1.5s infinite",
          }}>LIVE</span>
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            onClick={handleMuteAll}
            style={{
              cursor: "pointer",
              display: "flex", alignItems: "center", gap: 4,
              padding: "2px 6px", borderRadius: 3,
              border: `1px solid ${unmutedChannel === -1 ? 'var(--border-dim)' : 'var(--clr-green)'}`,
              background: unmutedChannel === -1 ? 'transparent' : 'rgba(0,230,118,0.1)',
              fontSize: 8, fontWeight: 700, fontFamily: "monospace",
              color: unmutedChannel === -1 ? "var(--text-dim)" : "var(--clr-green)",
              letterSpacing: 1,
              transition: "all 0.2s",
            }}
          >
            {unmutedChannel === -1 ? <VolumeX size={11} /> : <Volume2 size={11} />}
            {unmutedChannel === -1 ? "MUTED" : `♪ ${LIVE_CHANNELS[unmutedChannel]?.name}`}
          </div>
        </div>
      </div>

      {/* 3x2 Grid — all channels always loaded, mute/unmute via postMessage */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gridTemplateRows: "repeat(2, 1fr)",
        flex: 1, gap: 1, background: "#000", minHeight: 0,
      }}>
        {LIVE_CHANNELS.map((channel, i) => {
          const isUnmuted = unmutedChannel === i;
          return (
            <div
              key={i}
              style={{
                position: "relative", background: "#000", overflow: "hidden",
                border: isUnmuted ? `2px solid ${channel.color}` : "1px solid #1a1a1a",
                boxShadow: isUnmuted ? `0 0 12px ${channel.color}40` : "none",
                transition: "all 0.3s",
              }}
            >
              {/* YouTube embed — always muted on load, controlled via JS API */}
              <iframe
                ref={(el) => { iframeRefs.current[i] = el; }}
                src={buildEmbedUrl(channel.videoId)}
                style={{ width: "100%", height: "100%", border: "none", position: "absolute", inset: 0 }}
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={channel.name}
                loading={i < 3 ? "eager" : "lazy"}
              />

              {/* Channel name label */}
              <div style={{
                position: "absolute", top: 3, left: 6,
                display: "flex", alignItems: "center", gap: 5, zIndex: 10, pointerEvents: "none",
              }}>
                <Radio size={7} color={channel.color} style={{ animation: "live-pulse 1.5s infinite" }} />
                <span style={{
                  fontSize: 7, fontFamily: "monospace", color: "#fff", letterSpacing: 1.2,
                  background: "rgba(0,0,0,0.75)", padding: "1px 5px", borderRadius: 2,
                  fontWeight: 700,
                }}>{channel.name}</span>
              </div>

              {/* ── MUTE / UNMUTE BUTTON — visible icon like YouTube ── */}
              <div
                onClick={(e) => handleToggleMute(i, e)}
                style={{
                  position: "absolute",
                  bottom: 6, right: 36, zIndex: 20,
                  width: 26, height: 26, borderRadius: "50%",
                  background: isUnmuted ? "rgba(0,230,118,0.9)" : "rgba(0,0,0,0.75)",
                  border: isUnmuted ? "2px solid #00e676" : "2px solid rgba(255,255,255,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: isUnmuted ? "0 0 10px rgba(0,230,118,0.5)" : "0 2px 6px rgba(0,0,0,0.5)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                {isUnmuted
                  ? <Volume2 size={12} color="#000" strokeWidth={2.5} />
                  : <VolumeX size={12} color="#fff" strokeWidth={2} />
                }
              </div>

              {/* LIVE badge */}
              <span style={{
                position: "absolute", bottom: 3, left: 6,
                fontSize: 6, fontFamily: "monospace", color: "#fff", fontWeight: 900,
                background: "var(--clr-red)", padding: "1px 3px", borderRadius: 2,
                zIndex: 10, letterSpacing: 1, pointerEvents: "none",
              }}>
                ● LIVE
              </span>

              {/* Timecode */}
              <span style={{
                position: "absolute", bottom: 3, right: 6,
                fontSize: 7, fontFamily: "monospace", color: "var(--clr-green)", fontWeight: 700,
                background: "rgba(0,0,0,0.75)", padding: "1px 3px", borderRadius: 2,
                zIndex: 10, pointerEvents: "none",
              }}>
                {timestamps[i] || "00:00:00 UTC"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
