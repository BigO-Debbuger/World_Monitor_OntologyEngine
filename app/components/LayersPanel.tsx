import { Check, X, ShieldAlert, Cpu, Globe, Zap, Coins } from "lucide-react";

interface LayersPanelProps {
  layers: string[];
  toggleLayer: (layer: string) => void;
}

export default function LayersPanel({ layers, toggleLayer }: LayersPanelProps) {
  const layerConfigs = [
    { id: "defense", label: "CONFLICT ZONES", icon: <ShieldAlert size={14} color="var(--cat-conflict)" /> },
    { id: "trade", label: "ECONOMIC / PIPELINES", icon: <Coins size={14} color="var(--cat-economic)" /> },
    { id: "tech", label: "AI DATA CENTERS", icon: <Cpu size={14} color="var(--cat-tech)" /> },
    { id: "climate", label: "CLIMATE HOTSPOTS", icon: <Globe size={14} color="var(--cat-climate)" /> },
    { id: "energy", label: "NUCLEAR SITES", icon: <Zap size={14} color="var(--cat-energy)" /> },
  ];

  return (
    <div className="panel pointer-events-auto rounded">
      <div className="ph-header">
        <span className="ph-title">LAYERS <span>(?)</span></span>
      </div>
      <div className="ph-content flex flex-col gap-3">
        {layerConfigs.map((cfg) => {
          const isActive = layers.includes(cfg.id);
          return (
            <div 
              key={cfg.id} 
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => toggleLayer(cfg.id)}
            >
              <div 
                className="w-5 h-5 flex items-center justify-center rounded border transition-colors"
                style={{
                  backgroundColor: isActive ? "var(--clr-green)" : "transparent",
                  borderColor: isActive ? "var(--clr-green)" : "var(--border-dim)"
                }}
              >
                {isActive ? <Check size={12} color="#000" strokeWidth={3} /> : <X size={12} color="var(--text-dim)" />}
              </div>
              {cfg.icon}
              <span 
                className="text-[11px] font-mono tracking-wider transition-colors"
                style={{ color: isActive ? "#fff" : "var(--text-dim)" }}
              >
                {cfg.label}
              </span>
            </div>
          );
        })}

        <div className="mt-auto pt-4 border-t border-[var(--border-dim)] flex items-center justify-between text-[9px] text-[var(--text-dim)] uppercase tracking-widest">
          <span>{`© NETRA Intelligence`}</span>
          <span className="text-[var(--clr-blue)]">SECURE</span>
        </div>
      </div>
    </div>
  );
}
