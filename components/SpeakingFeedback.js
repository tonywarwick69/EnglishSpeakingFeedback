"use client";

import { useMemo } from "react";
import { SPEAKING_TASK } from "@/data/speakingTask";
import { analyseTask, CHECK_KEYS } from "@/utils/taskCoverage";
import { useLocale } from "./LocaleProvider";
import { formatTime } from "@/utils/formatTime";

const scoreColor = (v) =>
  v >= 80 ? "text-signal-400" : v >= 60 ? "text-amber-300" : "text-pulse-400";

function wordClass(w) {
  if (w.errorType === "Mispronunciation" || w.accuracy < 60) return "text-pulse-400";
  if (w.accuracy < 80) return "text-amber-300";
  return "text-signal-400";
}

function ScoreCard({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-void-900/60 px-3 py-3 text-center">
      <p className={`font-display text-3xl font-bold ${scoreColor(value)}`}>{Math.round(value)}</p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-white/40">{label}</p>
    </div>
  );
}

export default function SpeakingFeedback({ result, onTryAgain }) {
  const { t } = useLocale();

  const analysis = useMemo(
    () => analyseTask(result.noSpeech ? "" : result.transcript),
    [result]
  );

  if (result.noSpeech) {
    return (
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-void-800/70 p-8 text-center backdrop-blur-sm">
        <p className="text-sm text-white/70">{t("question.noSpeech")}</p>
        <button
          type="button"
          onClick={onTryAgain}
          className="focus-ring mt-6 rounded-full bg-signal-500 px-7 py-2.5 text-sm font-semibold text-void-950 transition hover:bg-signal-400"
        >
          {t("speaking.tryAgain")}
        </button>
      </div>
    );
  }

  const seconds = Math.round((result.durationMs || 0) / 1000);
  const wpm = seconds >= 5 ? Math.round((result.wordCount / seconds) * 60) : null;
  const coveragePct = Math.round((analysis.covered / analysis.total) * 100);
  const missing = CHECK_KEYS.filter((k) => !analysis.checks[k]);

  let tip = t("speaking.tipGreat");
  if (result.wordCount < 25) tip = t("speaking.tipShort");
  else if (missing.length > 0) {
    tip = t("speaking.tipMissing", {
      items: missing.map((k) => t(`speaking.missing.${k}`)).join(", "),
    });
  }

  return (
    <div className="w-full max-w-2xl space-y-5 rounded-2xl border border-white/10 bg-void-800/70 p-6 backdrop-blur-sm sm:p-8">
      <div className="text-center">
        <h2 className="font-display text-2xl font-semibold text-white">
          {t("speaking.feedbackTitle")}
        </h2>
        <p className="mt-1 text-sm text-white/50">{SPEAKING_TASK.title}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ScoreCard label={t("speaking.scoreOverall")} value={result.pronScore} />
        {typeof result.accuracy === "number" && (
          <ScoreCard label={t("speaking.scoreAccuracy")} value={result.accuracy} />
        )}
        {typeof result.fluency === "number" && (
          <ScoreCard label={t("speaking.scoreFluency")} value={result.fluency} />
        )}
        {typeof result.prosody === "number" && (
          <ScoreCard label={t("speaking.scoreIntonation")} value={result.prosody} />
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-2 font-mono text-[11px] text-white/60">
        <span className="rounded-full border border-white/10 bg-void-900/60 px-3 py-1">
          {t("speaking.statTime")} <span className="text-white">{formatTime(seconds)}</span>
        </span>
        <span className="rounded-full border border-white/10 bg-void-900/60 px-3 py-1">
          {t("speaking.statWords")} <span className="text-white">{result.wordCount}</span>
        </span>
        {wpm !== null && (
          <span className="rounded-full border border-white/10 bg-void-900/60 px-3 py-1">
            {t("speaking.statWpm")} <span className="text-white">{wpm}</span>
          </span>
        )}
      </div>

      {/* Task checklist */}
      <div className="rounded-xl border border-white/10 bg-void-900/60 p-4">
        <div className="flex items-baseline justify-between">
          <p className="font-mono text-[11px] uppercase tracking-wider text-white/50">
            {t("speaking.checklistTitle")}
          </p>
          <p className={`font-display text-lg font-semibold ${scoreColor(coveragePct)}`}>
            {analysis.covered}/{analysis.total}
          </p>
        </div>
        <ul className="mt-3 space-y-1.5 text-sm">
          {CHECK_KEYS.map((k) => (
            <li
              key={k}
              className={analysis.checks[k] ? "text-signal-400" : "text-white/40"}
            >
              {analysis.checks[k] ? "✓" : "○"} {t(`speaking.check.${k}`)}
            </li>
          ))}
        </ul>

        <p className="mt-4 font-mono text-[11px] uppercase tracking-wider text-white/50">
          {t("speaking.framesTitle")}
        </p>
        <ul className="mt-2 space-y-1 text-xs">
          {SPEAKING_TASK.frames.map((f, i) => (
            <li key={f} className={analysis.frames[i] ? "text-signal-400" : "text-white/30"}>
              {analysis.frames[i] ? "✓" : "○"} {f}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] text-white/30">{t("speaking.checkNote")}</p>
      </div>

      {/* Transcript, colour-coded by word accuracy */}
      <div className="rounded-xl border border-white/10 bg-void-900/60 p-4">
        <p className="font-mono text-[11px] uppercase tracking-wider text-white/50">
          {t("speaking.transcriptTitle")}
        </p>
        {result.words.length > 0 ? (
          <p className="mt-2 flex flex-wrap gap-x-1.5 gap-y-1 text-base leading-relaxed">
            {result.words.map((w, i) => (
              <span key={`${w.word}-${i}`} className={wordClass(w)} title={`${Math.round(w.accuracy)}`}>
                {w.word}
              </span>
            ))}
          </p>
        ) : (
          <p className="mt-2 text-base text-white/80">{result.transcript}</p>
        )}
        <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] text-white/40">
          <span className="text-signal-400">● {t("question.wordGood")}</span>
          <span className="text-amber-300">● {t("question.wordFair")}</span>
          <span className="text-pulse-400">● {t("question.wordBad")}</span>
        </p>
      </div>

      <p className="text-center text-sm text-white/70">{tip}</p>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onTryAgain}
          className="focus-ring rounded-full bg-signal-500 px-7 py-2.5 text-sm font-semibold text-void-950 transition hover:bg-signal-400"
        >
          {t("speaking.tryAgain")}
        </button>
      </div>
    </div>
  );
}
