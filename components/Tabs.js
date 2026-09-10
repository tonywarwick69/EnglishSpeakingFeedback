"use client";

export default function Tabs({ active, onChange }) {
  const tabs = [
    { key: "dashboard", label: "Dashboard", sub: "Luyện nói" },
    { key: "scoreboard", label: "Scoreboard", sub: "Bảng xếp hạng" },
  ];

  return (
    <div className="inline-flex rounded-full border border-white/10 bg-void-800/60 p-1">
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`focus-ring rounded-full px-4 py-2 text-sm font-medium transition sm:px-5 ${
              isActive
                ? "bg-signal-500 text-void-950"
                : "text-white/60 hover:text-white"
            }`}
          >
            {tab.label}
            <span
              className={`ml-1.5 hidden font-mono text-[10px] sm:inline ${
                isActive ? "text-void-950/60" : "text-white/30"
              }`}
            >
              {tab.sub}
            </span>
          </button>
        );
      })}
    </div>
  );
}
