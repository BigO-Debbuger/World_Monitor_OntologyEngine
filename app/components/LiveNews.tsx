"use client";

import { useState, useEffect, useRef } from "react";
import { Radio, Volume2, VolumeX, AlertTriangle, Shield, Zap, Eye, ExternalLink, Play, Tv, Image as ImageIcon } from "lucide-react";

interface NewsBrief {
  id: string;
  source: string;
  headline: string;
  summary: string;
  category: "CRITICAL" | "ALERT" | "MONITOR" | "UPDATE";
  region: string;
  timestamp: string;
  priority: number;
  link?: string;
  imageUrl?: string;
}

interface NewsData {
  feeds: NewsBrief[];
  ticker: string;
  lastUpdate: string;
  status: string;
  sources_active: number;
  isLive?: boolean;
}

const CATEGORY_STYLE: Record<string, { bg: string; text: string; icon: any; border: string }> = {
  CRITICAL: { bg: "rgba(255,42,42,0.15)", text: "#ff2a2a", icon: AlertTriangle, border: "rgba(255,42,42,0.3)" },
  ALERT: { bg: "rgba(255,184,0,0.15)", text: "#ffb800", icon: Shield, border: "rgba(255,184,0,0.3)" },
  MONITOR: { bg: "rgba(0,136,255,0.15)", text: "#0088ff", icon: Eye, border: "rgba(0,136,255,0.3)" },
  UPDATE: { bg: "rgba(0,230,118,0.15)", text: "#00e676", icon: Zap, border: "rgba(0,230,118,0.3)" },
};

const SOURCES = ["ALL INTEL", "CRITICAL", "ALERT", "MONITOR", "UPDATE"];

// Live news video channels — direct YouTube live video URLs
const NEWS_VIDEOS = [
  { name: "WION LIVE", color: "#ff2a2a", url: "https://www.youtube.com/watch?v=GNSuurMtJpA", liveUrl: "https://www.youtube.com/watch?v=GNSuurMtJpA" },
  { name: "NDTV 24x7", color: "#0088ff", url: "https://www.youtube.com/watch?v=7Ui6sej7o9U", liveUrl: "https://www.youtube.com/watch?v=7Ui6sej7o9U" },
  { name: "INDIA TODAY", color: "#ff6b2c", url: "https://www.youtube.com/watch?v=Nq2wYlWFucg", liveUrl: "https://www.youtube.com/watch?v=Nq2wYlWFucg" },
  { name: "DD NEWS", color: "#ffb800", url: "https://www.youtube.com/watch?v=anuHqZ8noqU", liveUrl: "https://www.youtube.com/watch?v=anuHqZ8noqU" },
  { name: "AL JAZEERA", color: "#00e676", url: "https://www.youtube.com/watch?v=gCNeDWCI0vo", liveUrl: "https://www.youtube.com/watch?v=gCNeDWCI0vo" },
  { name: "REPUBLIC TV", color: "#a855f7", url: "https://www.youtube.com/watch?v=zo5ihLRpn4I", liveUrl: "https://www.youtube.com/watch?v=zo5ihLRpn4I" },
];

export default function LiveNews() {
  const [newsData, setNewsData] = useState<NewsData | null>(null);
  const [activeSource, setActiveSource] = useState(0);
  const [selectedFeed, setSelectedFeed] = useState<number>(0);
  const [muted, setMuted] = useState(true);
  const [showVideo, setShowVideo] = useState(false);
  const [feedError, setFeedError] = useState(false);
  const tickerRef = useRef<HTMLDivElement>(null);

  // Fetch news from API every 30 seconds
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch("/api/news");
        const data = await res.json();
        setNewsData(data);
        setFeedError(false);
      } catch (e) {
        console.error("News fetch error:", e);
        setFeedError(true);
      }
    };

    fetchNews();
    const interval = setInterval(fetchNews, 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto-cycle through feeds every 6 seconds
  useEffect(() => {
    if (!newsData?.feeds?.length || showVideo) return;
    const interval = setInterval(() => {
      setSelectedFeed(prev => (prev + 1) % newsData.feeds.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [newsData, showVideo]);

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return "LIVE";
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return "JUST NOW";
      if (diffMins < 60) return `${diffMins}m AGO`;
      if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h AGO`;
      return d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }) + " UTC";
    } catch {
      return "LIVE";
    }
  };

  // Filter feeds based on active source
  const filteredFeeds = newsData?.feeds?.filter(feed => {
    if (activeSource === 0) return true;
    return feed.category === SOURCES[activeSource];
  }) || [];

  const currentFeed = filteredFeeds[selectedFeed % Math.max(filteredFeeds.length, 1)];
  const catStyle = currentFeed ? CATEGORY_STYLE[currentFeed.category] || CATEGORY_STYLE.MONITOR : CATEGORY_STYLE.MONITOR;
  const CatIcon = catStyle.icon;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: "1px solid var(--border-dim)", minWidth: 280 }}>
      {/* Header */}
      <div className="ph-header">
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Radio size={11} color="var(--clr-red)" style={{ animation: "live-pulse 1.5s infinite" }} />
          LIVE INTELLIGENCE
          {newsData?.isLive && (
            <span style={{
              fontSize: 7, background: "var(--clr-green)", color: "#000", padding: "1px 4px",
              borderRadius: 2, fontWeight: 900, letterSpacing: 1,
            }}>LIVE</span>
          )}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 9 }}>
          <span style={{ color: "var(--clr-green)", display: "flex", alignItems: "center", gap: 4, fontWeight: 700 }}>
            <span className="live-dot" style={{ width: 6, height: 6 }} /> {newsData?.sources_active || 0} SOURCES
          </span>
          {/* Toggle video/text mode */}
          <div 
            onClick={() => setShowVideo(!showVideo)} 
            style={{ 
              cursor: "pointer", 
              color: showVideo ? "var(--clr-red)" : "var(--text-dim)",
              display: "flex", alignItems: "center", gap: 3,
              padding: "1px 4px",
              borderRadius: 2,
              border: showVideo ? "1px solid var(--clr-red)" : "1px solid transparent",
              fontSize: 8,
              fontWeight: 700,
            }}
            title="Toggle Live Video Feeds"
          >
            <Tv size={11} /> {showVideo ? "LIVE TV" : "TV"}
          </div>
          <div onClick={() => setMuted(!muted)} style={{ cursor: "pointer", color: "var(--text-dim)" }}>
            {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#080808", minHeight: 0 }}>
        {/* Source Tabs */}
        <div style={{ display: "flex", overflowX: "auto", borderBottom: "1px solid var(--border-dim)", fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
          {SOURCES.map((s, i) => (
            <div
              key={i}
              style={{
                padding: "5px 10px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
                background: i === activeSource ? "var(--clr-red)" : "transparent",
                color: i === activeSource ? "#fff" : "var(--text-dim)",
                transition: "all 0.2s",
                borderRight: "1px solid var(--border-dim)",
              }}
              onClick={() => { setActiveSource(i); setSelectedFeed(0); }}
            >
              {s}
            </div>
          ))}
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, position: "relative" }}>
          
          {showVideo ? (
            /* ─── LIVE VIDEO FEEDS — Click to open in new tab ─── */
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
              {/* Video channel grid */}
              <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1, background: "#000", padding: 0 }}>
                {NEWS_VIDEOS.map((v, i) => (
                  <div
                    key={i}
                    onClick={() => window.open(v.liveUrl, '_blank')}
                    style={{
                      background: "linear-gradient(135deg, #0a0a0a 0%, #111 100%)",
                      border: "1px solid #1a1a1a",
                      cursor: "pointer",
                      display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center",
                      gap: 6, padding: "8px 6px",
                      position: "relative", overflow: "hidden",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = `linear-gradient(135deg, ${v.color}15, #111)`; e.currentTarget.style.borderColor = `${v.color}40`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "linear-gradient(135deg, #0a0a0a 0%, #111 100%)"; e.currentTarget.style.borderColor = "#1a1a1a"; }}
                  >
                    {/* Play icon */}
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: `${v.color}20`, border: `1.5px solid ${v.color}60`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Play size={12} color={v.color} fill={`${v.color}80`} />
                    </div>
                    
                    {/* Channel name */}
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: v.color, boxShadow: `0 0 4px ${v.color}`, animation: "live-pulse 1.5s infinite" }} />
                      <span style={{ fontSize: 8, fontFamily: "monospace", color: "#fff", letterSpacing: 1.5, fontWeight: 700 }}>{v.name}</span>
                    </div>

                    {/* LIVE tag */}
                    <span style={{
                      fontSize: 6, fontFamily: "monospace", color: "#fff", fontWeight: 900,
                      background: v.color, padding: "1px 4px", borderRadius: 2,
                      letterSpacing: 1, opacity: 0.9,
                    }}>
                      ● WATCH LIVE
                    </span>
                    
                    {/* Scanlines */}
                    <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)", pointerEvents: "none", opacity: 0.5 }} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* ─── TEXT-BASED NEWS FEEDS ─── */
            <>
              {currentFeed ? (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
                  {/* Animated background gradient */}
                  <div style={{
                    position: "absolute", inset: 0, opacity: 0.15, pointerEvents: "none",
                    background: `radial-gradient(ellipse at 20% 50%, ${catStyle.text}30 0%, transparent 70%)`,
                  }} />
                  
                  {/* Scrollable feed list */}
                  <div style={{ flex: 1, overflowY: "auto", padding: 0 }}>
                    {filteredFeeds.map((feed, i) => {
                      const fStyle = CATEGORY_STYLE[feed.category] || CATEGORY_STYLE.MONITOR;
                      const FIcon = fStyle.icon;
                      const isActive = i === (selectedFeed % Math.max(filteredFeeds.length, 1));
                      
                      return (
                        <div
                          key={feed.id}
                          onClick={() => setSelectedFeed(i)}
                          style={{
                            padding: "10px 12px",
                            borderBottom: "1px solid var(--border-dim)",
                            cursor: "pointer",
                            position: "relative",
                            overflow: "hidden",
                            background: isActive ? `linear-gradient(90deg, ${fStyle.bg}, transparent)` : "transparent",
                            transition: "all 0.3s ease",
                          }}
                        >
                          {/* Active indicator bar */}
                          {isActive && (
                            <div style={{ 
                              position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
                              background: fStyle.text, boxShadow: `0 0 8px ${fStyle.text}`,
                            }} />
                          )}
                          
                          {/* Source + Category + Time row */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <FIcon size={10} color={fStyle.text} />
                              <span style={{
                                fontSize: 7, fontFamily: "monospace", letterSpacing: 1.5,
                                background: fStyle.bg, color: fStyle.text,
                                padding: "1px 5px", borderRadius: 2, border: `1px solid ${fStyle.border}`,
                                fontWeight: 700,
                              }}>
                                {feed.category}
                              </span>
                              <span style={{ fontSize: 7, color: "var(--text-dim)", fontFamily: "monospace", letterSpacing: 0.8 }}>
                                {feed.source}
                              </span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 7, color: "var(--clr-green)", fontFamily: "monospace" }}>
                                {formatTime(feed.timestamp)}
                              </span>
                              {feed.link && (
                                <a 
                                  href={feed.link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  style={{ color: "var(--text-dim)", display: "flex" }}
                                >
                                  <ExternalLink size={9} />
                                </a>
                              )}
                            </div>
                          </div>
                          
                          {/* Headline */}
                          <div style={{
                            fontSize: isActive ? 12 : 10,
                            fontWeight: 700,
                            color: isActive ? "#fff" : "var(--text-secondary)",
                            lineHeight: 1.3,
                            letterSpacing: 0.2,
                            marginBottom: isActive ? 4 : 0,
                            transition: "all 0.3s ease",
                          }}>
                            {feed.headline}
                          </div>
                          
                          {/* Summary - only show for active feed */}
                          {isActive && feed.summary && (
                            <div style={{
                              fontSize: 10, color: "var(--text-dim)", lineHeight: 1.5,
                              marginTop: 2,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}>
                              {feed.summary}
                            </div>
                          )}
                          
                          {/* Region tag */}
                          <div style={{ 
                            fontSize: 7, fontFamily: "monospace", letterSpacing: 1.2,
                            color: "var(--text-dim)", marginTop: 3, textTransform: "uppercase",
                          }}>
                            {feed.region}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Scanline effect */}
                  <div style={{
                    position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.03,
                    background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 4px)",
                  }} />
                </div>
              ) : (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
                  <div className="spinner" />
                  <span style={{ fontSize: 9, fontFamily: "monospace", color: "var(--text-dim)", letterSpacing: 2 }}>
                    {feedError ? "RECONNECTING TO INTEL FEED..." : "CONNECTING TO LIVE SOURCES..."}
                  </span>
                </div>
              )}
            </>
          )}

          {/* Breaking News Ticker */}
          <div style={{
            borderTop: "2px solid var(--clr-red)",
            background: "rgba(255,42,42,0.08)",
            display: "flex", alignItems: "center",
            flexShrink: 0,
            overflow: "hidden",
          }}>
            <div style={{
              background: "var(--clr-red)", color: "#fff",
              fontSize: 9, fontWeight: 900, padding: "4px 8px",
              whiteSpace: "nowrap", flexShrink: 0,
              letterSpacing: 1,
              display: "flex", alignItems: "center", gap: 4,
            }}>
              ⚡ FLASH
            </div>
            <div
              ref={tickerRef}
              style={{
                fontSize: 10, fontWeight: 600, color: "#fff",
                padding: "4px 12px",
                whiteSpace: "nowrap",
                animation: "ticker-scroll 30s linear infinite",
                fontFamily: "monospace",
              }}
            >
              {newsData?.ticker || "ESTABLISHING SECURE CONNECTION TO NETRA INTELLIGENCE NETWORK..."}
            </div>
          </div>
        </div>
      </div>

      {/* Ticker animation */}
      <style>{`
        @keyframes ticker-scroll {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}
