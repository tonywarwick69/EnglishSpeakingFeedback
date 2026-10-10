"use client";

import { QUESTIONS } from "@/data/questions";
import { useLocale } from "./LocaleProvider";

export default function ResultScreen({
  username,
  answers,
  onPlayAgain,
  onChangePlayer,
  onViewScoreboard,
  saving,
  saveError,
}) {
  const { t } = useLocale();
  const total = QUESTIONS.length;
  const correct = answers.filter((a) => a.correct).length;
  const score = Math.round((correct / total) * 100);

  const tier =
    score >= 80
      ? { label: t("result.tierExcellent"), color: "text-signal-400" }
      : score >= 50
      ? { label: t("result.tierGood"), color: "text-amber-300" }
      : { label: t("result.tierPractice"), color: "text-pulse-400" };

  return (
    <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-void-800/70 p-6 sm:p-8 backdrop-blur-sm">
      <p className="text-center font-mono text-xs uppercase tracking-widest text-white/40">
        {t("result.header", { name: username })}
      </p>

      <div className="mt-4 flex flex-col items-center">
        <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-4 border-signal-400/30">
          <div className="text-center">
            <p className="font-display text-4xl font-bold text-white">{score}</p>
            <p className="font-mono text-[11px] text-white/40">{t("result.points")}</p>
          </div>
        </div>
        <p className={`mt-4 font-display text-xl font-semibold ${tier.color}`}>{tier.label}</p>
        <p className="mt-1 text-sm text-white/60">
          {t("result.correctCount", { correct, total })}
        </p>
      </div>

      <div className="mt-8 space-y-2 max-h-72 overflow-y-auto scrollbar-thin pr-1">
        {QUESTIONS.map((q, i) => {
          const a = answers[i];
          return (
            <div
              key={q.id}
              className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
                a?.correct
                  ? "border-signal-500/25 bg-signal-500/5"
                  : "border-pulse-500/25 bg-pulse-500/5"
              }`}
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-white">
                  {i + 1}. {q.target}
                </p>
                <p className="truncate font-mono text-xs text-white/40">
                  {t("result.youSaid", { text: a?.spoken || t("result.noHear") })}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-1 font-mono text-[11px] ${
                  a?.correct
                    ? "bg-signal-500/15 text-signal-400"
                    : "bg-pulse-500/15 text-pulse-400"
                }`}
              >
                {a?.correct ? t("result.ok") : t("result.wrong")}
              </span>
            </div>
          );
        })}
      </div>

      {saveError && <p className="mt-4 text-center text-sm text-pulse-400">{saveError}</p>}

      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onPlayAgain}
          disabled={saving}
          className="focus-ring rounded-full bg-signal-500 px-6 py-2.5 text-sm font-semibold text-void-950 transition hover:bg-signal-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? t("result.saving") : t("result.playAgain")}
        </button>
        <button
          type="button"
          onClick={onViewScoreboard}
          className="focus-ring rounded-full border border-white/15 px-6 py-2.5 text-sm text-white/80 transition hover:border-white/40 hover:text-white"
        >
          {t("result.viewScoreboard")}
        </button>
        <button
          type="button"
          onClick={onChangePlayer}
          className="focus-ring rounded-full px-4 py-2.5 text-sm text-white/40 transition hover:text-white/70"
        >
          {t("result.changePlayer")}
        </button>
      </div>

      <p className="mt-4 text-center font-mono text-[11px] text-white/30">{t("result.saveHint")}</p>
    </div>
  );
}
