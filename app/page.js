"use client";

import { useEffect, useState } from "react";
import Tabs from "@/components/Tabs";
import Dashboard from "@/components/Dashboard";
import Scoreboard from "@/components/Scoreboard";

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [scoreboardRefreshKey, setScoreboardRefreshKey] = useState(0);

  useEffect(() => {
    document.title = "Speaking Lab · Unit 1 My New School";
  }, []);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-void-950">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-signal-500/10 blur-[120px]" />

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-8 flex w-full flex-col items-center gap-6 text-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-signal-400/80">
              Global Success · Grade 6
            </p>
            <h1 className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">
              Speaking Lab — My New School
            </h1>
          </div>
          <Tabs active={activeTab} onChange={setActiveTab} />
        </header>

        <section className="flex w-full flex-1 flex-col items-center">
          {activeTab === "dashboard" ? (
            <Dashboard
              onScoreSaved={() => setScoreboardRefreshKey((k) => k + 1)}
              onGoToScoreboard={() => setActiveTab("scoreboard")}
            />
          ) : (
            <Scoreboard refreshKey={scoreboardRefreshKey} />
          )}
        </section>

        <footer className="mt-12 text-center font-mono text-[11px] text-white/25">
          Tiếng Anh 6 — Global Success · Unit 1: My New School · Speaking practice
        </footer>
      </div>
    </main>
  );
}
