"use client";

import { useEffect, useState } from "react";
import { useAzureSpeaking } from "@/hooks/useAzureSpeaking";
import { SPEAKING_TASK, PREP_SECONDS, MAX_SPEAK_SECONDS } from "@/data/speakingTask";
import MicVisualizer from "./MicVisualizer";
import SpeakingFeedback from "./SpeakingFeedback";
import { formatTime } from "@/utils/formatTime";
import { useLocale } from "./LocaleProvider";

export default function SpeakingExercise() {
  const { t, locale } = useLocale();
  const sp = useAzureSpeaking({ maxSeconds: MAX_SPEAK_SECONDS });
  const [prepLeft, setPrepLeft] = useState(null); // null = not preparing

  // Preparation countdown
  useEffect(() => {
    if (prepLeft === null || prepLeft <= 0) return;
    const id = setTimeout(() => setPrepLeft((p) => p - 1), 1000);
    return () => clearTimeout(id);
  }, [prepLeft]);

  const startSpeaking = () => {
    setPrepLeft(null);
    sp.start();
  };

  const tryAgain = () => {
    sp.reset();
    setPrepLeft(null);
  };

  if (sp.status === "done" && sp.result) {
    return <SpeakingFeedback result={sp.result} onTryAgain={tryAgain} />;
  }

  const busy = sp.status === "preparing" || sp.status === "recording" || sp.status === "processing";
  const errorText = sp.error
    ? sp.error.kind === "mic"
      ? t("question.micError")
      : sp.error.kind === "service"
      ? t("speaking.serviceError")
      : t("question.genericError")
    : null;

  return (
    <div className="w-full max-w-2xl space-y-5">
      {/* Cue card */}
      <div className="rounded-2xl border border-white/10 bg-void-800/70 p-6 backdrop-blur-sm sm:p-8">
        <span className="inline-flex items-center rounded-full border border-signal-500/30 bg-signal-500/10 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-signal-400">
          {t("speaking.badge")}
        </span>

        <p className="mt-5 font-mono text-xs uppercase tracking-wider text-white/40">
          {t("speaking.taskLabel")}
        </p>
        <h2 className="mt-1 font-display text-2xl font-semibold text-white sm:text-3xl">
          {SPEAKING_TASK.title}
        </h2>
        {locale === "vi" && <p className="mt-1 text-sm text-white/50">{SPEAKING_TASK.titleVi}</p>}

        <p className="mt-5 text-sm font-medium text-white/80">{t("speaking.sayLabel")}</p>
        <ul className="mt-2 space-y-2">
          {SPEAKING_TASK.prompts.map((p, i) => (
            <li key={p.key} className="flex gap-3 text-sm text-white/80">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-signal-500/15 font-mono text-[11px] text-signal-400">
                {i + 1}
              </span>
              <span>
                {p.en}
                {locale === "vi" && <span className="block text-xs text-white/40">{p.vi}</span>}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-6 rounded-xl border border-white/10 bg-void-900/60 p-4">
          <p className="font-mono text-[11px] uppercase tracking-wider text-amber-300/80">
            {t("speaking.usefulTitle")}
          </p>
          <ul className="mt-2 space-y-1 text-sm text-white/70">
            {SPEAKING_TASK.frames.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Controls */}
      <div className="rounded-2xl border border-white/10 bg-void-800/70 p-6 text-center backdrop-blur-sm">
        {sp.status === "idle" || sp.status === "error" ? (
          <>
            {errorText && <p className="mb-4 text-sm text-amber-300">{errorText}</p>}

            {prepLeft !== null ? (
              <div className="mb-4">
                <p className="font-mono text-xs uppercase tracking-wider text-white/40">
                  {t("speaking.prepTitle")}
                </p>
                <p className="mt-1 font-display text-5xl font-bold text-amber-300">
                  {formatTime(prepLeft)}
                </p>
                {prepLeft === 0 && (
                  <p className="mt-2 text-sm text-signal-400">{t("speaking.prepDone")}</p>
                )}
              </div>
            ) : (
              <p className="mb-4 text-sm text-white/60">
                {t("speaking.howTo", { max: formatTime(MAX_SPEAK_SECONDS) })}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={startSpeaking}
                className="focus-ring rounded-full bg-signal-500 px-7 py-2.5 text-sm font-semibold text-void-950 transition hover:bg-signal-400"
              >
                {t("speaking.startNow")}
              </button>
              {prepLeft === null ? (
                <button
                  type="button"
                  onClick={() => setPrepLeft(PREP_SECONDS)}
                  className="focus-ring rounded-full border border-white/15 px-6 py-2.5 text-sm text-white/80 transition hover:border-amber-400/60 hover:text-white"
                >
                  {t("speaking.prepare", { time: formatTime(PREP_SECONDS) })}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setPrepLeft(null)}
                  className="focus-ring rounded-full border border-white/15 px-6 py-2.5 text-sm text-white/70 transition hover:border-white/40 hover:text-white"
                >
                  {t("speaking.cancelPrep")}
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <MicVisualizer listening={sp.status !== "processing"} state="idle" />

            {sp.status === "preparing" && (
              <p className="font-mono text-xs text-signal-400">{t("question.preparing")}</p>
            )}

            {sp.status === "recording" && (
              <>
                <p className="font-display text-4xl font-bold text-white">
                  {formatTime(sp.elapsedMs / 1000)}
                  <span className="ml-2 font-mono text-sm font-normal text-white/40">
                    / {formatTime(MAX_SPEAK_SECONDS)}
                  </span>
                </p>
                <p className="font-mono text-xs text-pulse-400">● {t("speaking.recording")}</p>
                <p className="text-xs text-white/40">
                  {t("speaking.maxHint", { max: formatTime(MAX_SPEAK_SECONDS) })}
                </p>
              </>
            )}

            {sp.status === "processing" && (
              <p className="font-mono text-xs text-signal-400">{t("speaking.analysing")}</p>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3">
              {sp.status === "recording" && (
                <button
                  type="button"
                  onClick={sp.stop}
                  className="focus-ring rounded-full bg-pulse-500 px-7 py-2.5 text-sm font-semibold text-white transition hover:bg-pulse-400"
                >
                  {t("speaking.stopFinish")}
                </button>
              )}
              {sp.status !== "processing" && (
                <button
                  type="button"
                  onClick={sp.cancel}
                  className="focus-ring rounded-full border border-white/15 px-6 py-2.5 text-sm text-white/70 transition hover:border-white/40 hover:text-white"
                >
                  {t("speaking.cancel")}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
