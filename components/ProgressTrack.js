"use client";

import { QUESTIONS } from "@/data/questions";

const colorMap = {
  signal: { bg: "bg-signal-400", text: "text-signal-400", border: "border-signal-400" },
  amber: { bg: "bg-amber-400", text: "text-amber-400", border: "border-amber-400" },
  pulse: { bg: "bg-pulse-500", text: "text-pulse-500", border: "border-pulse-500" },
};

export default function ProgressTrack({ currentIndex, answers }) {
  return (
    <div className="w-full">
      <div className="flex gap-1.5">
        {QUESTIONS.map((q, i) => {
          const c = colorMap[q.level.color];
          const answered = answers[i];
          const isCurrent = i === currentIndex;
          let fill = "bg-void-700";
          if (answered) {
            fill = answered.correct ? "bg-signal-400" : "bg-pulse-500";
          } else if (isCurrent) {
            fill = c.bg;
          }
          return (
            <div
              key={q.id}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${fill} ${
                isCurrent && !answered ? "animate-pulse" : ""
              }`}
            />
          );
        })}
      </div>
      <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-wider text-white/40">
        <span className={colorMap.signal.text}>Nhận biết</span>
        <span className={colorMap.amber.text}>Thông hiểu</span>
        <span className={colorMap.pulse.text}>Vận dụng cao</span>
      </div>
    </div>
  );
}
