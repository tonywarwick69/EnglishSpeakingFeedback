"use client";

import { useCallback, useEffect, useState } from "react";

export default function Scoreboard({ refreshKey }) {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [errorMsg, setErrorMsg] = useState("");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/scores", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Lỗi tải dữ liệu");
      setItems(data.items || []);
      setStatus("ready");
    } catch (err) {
      setErrorMsg(err.message || "Không thể tải bảng xếp hạng.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  return (
    <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-void-800/70 p-6 backdrop-blur-sm sm:p-8">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-white">
            Bảng xếp hạng
          </h2>
          <p className="font-mono text-[11px] text-white/40">SCOREBOARD · LIVE DATA</p>
        </div>
        <button
          type="button"
          onClick={load}
          className="focus-ring rounded-full border border-white/15 px-4 py-2 text-xs text-white/70 transition hover:border-signal-400/50 hover:text-white"
        >
          Làm mới
        </button>
      </div>

      {status === "loading" && (
        <div className="py-10 text-center font-mono text-sm text-white/40">
          Đang tải dữ liệu...
        </div>
      )}

      {status === "error" && (
        <div className="rounded-xl border border-pulse-500/30 bg-pulse-500/10 px-4 py-4 text-center text-sm text-pulse-300">
          {errorMsg}
        </div>
      )}

      {status === "ready" && items.length === 0 && (
        <div className="py-10 text-center text-sm text-white/40">
          Chưa có dữ liệu. Hãy là người đầu tiên hoàn thành bài luyện nói!
        </div>
      )}

      {status === "ready" && items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left font-mono text-[11px] uppercase tracking-wider text-white/40">
                <th className="py-2 pr-3 font-medium">No</th>
                <th className="py-2 pr-3 font-medium">Username</th>
                <th className="py-2 pr-3 font-medium">Score</th>
                <th className="py-2 pr-3 font-medium">Correct answer</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-white/5 text-white/80 transition hover:bg-white/[0.03]"
                >
                  <td className="py-2.5 pr-3 font-mono text-white/40">{row.no}</td>
                  <td className="py-2.5 pr-3 font-medium text-white">{row.username}</td>
                  <td className="py-2.5 pr-3">
                    <span
                      className={`rounded-full px-2 py-0.5 font-mono text-xs ${
                        row.score >= 80
                          ? "bg-signal-500/15 text-signal-400"
                          : row.score >= 50
                          ? "bg-amber-400/15 text-amber-300"
                          : "bg-pulse-500/15 text-pulse-400"
                      }`}
                    >
                      {row.score}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 font-mono text-white/60">
                    {row.correctAnswer}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
