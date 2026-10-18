"use client";

import { useEffect, useState } from "react";
import { useSpeechRecognition, speak } from "@/hooks/useSpeechRecognition";
import { useAzurePronunciation } from "@/hooks/useAzurePronunciation";
import { PASS_THRESHOLDS } from "@/data/questions";
import { pronunciationScore } from "@/utils/textMatch";
import MicVisualizer from "./MicVisualizer";
import { useLocale } from "./LocaleProvider";

const levelBadge = {
  signal: "bg-signal-500/15 text-signal-400 border-signal-500/40",
  amber: "bg-amber-400/15 text-amber-300 border-amber-400/40",
  pulse: "bg-pulse-500/15 text-pulse-400 border-pulse-500/40",
};

export default function QuestionCard({ question, index, total, onAnswered }) {
  const { t, locale } = useLocale();

  // Primary engine: Azure pronunciation assessment.
  // Fallback engine: browser Web Speech API + string similarity.
  const azure = useAzurePronunciation();
  const browser = useSpeechRecognition({ lang: "en-US" });

  const [result, setResult] = useState(null); // { engine, correct, spoken, score?, details? }
  const [attempt, setAttempt] = useState(0);

  const active = azure.isActive || browser.listening;
  const useBasic = azure.unavailable; // Azure failed recently -> use Web Speech
  const unsupported = useBasic && !browser.isSupported;

  // ---- Azure result -> grade ------------------------------------------------
  useEffect(() => {
    if (azure.status === "done" && azure.result && !result) {
      const r = azure.result;
      const threshold = PASS_THRESHOLDS[question.level.key] ?? 65;
      setResult({
        engine: "azure",
        correct: !r.noSpeech && r.pronScore >= threshold,
        spoken: r.spoken,
        score: r.pronScore,
        details: r,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [azure.status, azure.result]);

  // ---- Web Speech fallback -> grade ----------------------------------------
  useEffect(() => {
    if (!browser.listening && browser.transcript && !result) {
      const ratio = pronunciationScore(browser.transcript, question.target);
      setResult({
        engine: "browser",
        correct: ratio >= question.matchThreshold,
        spoken: browser.transcript,
        score: null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [browser.listening, browser.transcript]);

  useEffect(() => {
    if (!browser.listening && browser.error && !result) {
      setResult({ engine: "browser", correct: false, spoken: "", score: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [browser.listening, browser.error]);

  const handleMicClick = () => {
    if (active) {
      azure.stop();
      browser.stop();
      return;
    }
    setResult(null);
    azure.reset();
    browser.reset();
    setAttempt((a) => a + 1);
    if (useBasic) browser.start();
    else azure.start(question.target);
  };

  const handleNext = () => {
    onAnswered({
      questionId: question.id,
      target: question.target,
      spoken: result?.spoken || "",
      correct: !!result?.correct,
      score: result?.score ?? null,
    });
  };

  // Message shown when Azure itself failed (before any grading happened)
  let notice = null;
  if (azure.status === "error" && !result) {
    notice =
      azure.error?.kind === "mic"
        ? t("question.micError")
        : azure.error?.kind === "service"
        ? t("question.basicMode")
        : t("question.genericError");
  }

  const badgeClass = levelBadge[question.level.color];
  const micState = result ? (result.correct ? "correct" : "incorrect") : "idle";
  const instructionKey = question.instructionKey || question.type;

  const statusText =
    azure.status === "preparing"
      ? t("question.preparing")
      : azure.status === "listening"
      ? t("question.listening")
      : azure.status === "processing"
      ? t("question.analysing")
      : browser.listening
      ? t("question.listening")
      : null;

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-void-800/70 p-6 sm:p-8 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-wider ${badgeClass}`}
        >
          {t(`levels.${question.level.key}.label`)} · {t(`levels.${question.level.key}.sub`)}
        </span>
        <span className="font-mono text-xs text-white/40">
          {t("question.counter", {
            current: index + 1,
            total,
            type: t(`question.type.${question.type}`),
          })}
        </span>
      </div>

      <p className="mt-5 text-center text-sm text-white/60">
        {t(`question.instruction.${instructionKey}`)}
      </p>

      <div className="mt-3 text-center">
        <h2 className="break-words font-display text-3xl font-semibold text-white sm:text-4xl">
          {question.target}
        </h2>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm">
          {question.ipa && <span className="font-mono text-signal-400">{question.ipa}</span>}
          {locale === "vi" && <span className="text-white/50">{question.vi}</span>}
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center gap-4">
        {unsupported ? (
          <div className="rounded-xl border border-pulse-500/40 bg-pulse-500/10 px-4 py-3 text-center text-sm text-pulse-400">
            {t("question.unsupported")}
          </div>
        ) : (
          <>
            <MicVisualizer listening={active} state={micState} />

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => speak(question.target)}
                className="focus-ring flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:border-signal-400/60 hover:text-white"
              >
                <SpeakerIcon />
                {t("question.listen")}
              </button>

              <button
                type="button"
                onClick={handleMicClick}
                className={`focus-ring rounded-full px-5 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-pulse-500 text-white hover:bg-pulse-400"
                    : "bg-signal-500 text-void-950 hover:bg-signal-400"
                }`}
              >
                {active
                  ? t("question.stop")
                  : attempt > 0 && result
                  ? t("question.again")
                  : t("question.start")}
              </button>
            </div>

            <div className="min-h-[3.5rem] w-full text-center">
              {statusText && (
                <p className="font-mono text-xs text-signal-400">{statusText}</p>
              )}

              {notice && !active && (
                <p className="mx-auto mt-2 max-w-md text-sm text-amber-300">{notice}</p>
              )}

              {result && !active && (
                <div className="animate-float-up mt-2 space-y-2">
                  <p
                    className={`text-sm font-semibold ${
                      result.correct ? "text-signal-400" : "text-pulse-400"
                    }`}
                  >
                    {result.correct ? t("question.correct") : t("question.incorrect")}
                  </p>

                  {result.engine === "azure" && result.details?.noSpeech ? (
                    <p className="text-xs text-white/50">{t("question.noSpeech")}</p>
                  ) : (
                    <>
                      {result.engine === "azure" && (
                        <AzureFeedback details={result.details} t={t} />
                      )}
                      <p className="font-mono text-xs text-white/40">
                        {t("question.heard", {
                          text: result.spoken || t("question.heardNone"),
                        })}
                      </p>
                    </>
                  )}
                </div>
              )}

              {useBasic && (
                <p className="mt-3 inline-flex rounded-full border border-amber-400/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-amber-300/80">
                  {t("question.basicBadge")}
                </p>
              )}
            </div>
          </>
        )}
      </div>

      <div className="mt-6 flex justify-center gap-3">
        {result && !active && (
          <>
            {!result.correct && (
              <button
                type="button"
                onClick={handleMicClick}
                className="focus-ring rounded-full border border-white/15 px-5 py-2 text-sm text-white/70 transition hover:border-white/40 hover:text-white"
              >
                {t("question.retry")}
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              className="focus-ring rounded-full bg-white px-6 py-2 text-sm font-semibold text-void-950 transition hover:bg-white/90"
            >
              {index + 1 === total ? t("question.seeResults") : t("question.next")}
            </button>
          </>
        )}
        {!result && unsupported && (
          <button
            type="button"
            onClick={() =>
              onAnswered({
                questionId: question.id,
                target: question.target,
                spoken: "",
                correct: false,
                score: null,
              })
            }
            className="focus-ring rounded-full border border-white/15 px-5 py-2 text-sm text-white/70 transition hover:border-white/40 hover:text-white"
          >
            {t("question.skip")}
          </button>
        )}
      </div>
    </div>
  );
}

// ---- Azure detailed feedback ------------------------------------------------

function wordClass(w) {
  if (w.errorType === "Omission") return "text-pulse-400 line-through opacity-70";
  if (w.errorType === "Insertion") return "text-white/40 italic";
  if (w.errorType === "Mispronunciation" || w.accuracy < 60) return "text-pulse-400";
  if (w.accuracy < 80) return "text-amber-300";
  return "text-signal-400";
}

function AzureFeedback({ details, t }) {
  if (!details) return null;

  const metrics = [
    ["accuracy", details.accuracy],
    ["fluency", details.fluency],
    ["completeness", details.completeness],
    ["prosody", details.prosody],
  ].filter(([, value]) => typeof value === "number");

  return (
    <div className="mx-auto w-full max-w-md space-y-3">
      <div className="flex items-baseline justify-center gap-2">
        <span className="font-display text-3xl font-bold text-white">
          {Math.round(details.pronScore)}
        </span>
        <span className="font-mono text-[11px] uppercase tracking-wider text-white/40">
          / 100 · {t("question.score")}
        </span>
      </div>

      {metrics.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {metrics.map(([key, value]) => (
            <span
              key={key}
              className="rounded-full border border-white/10 bg-void-900/60 px-2.5 py-1 font-mono text-[11px] text-white/60"
            >
              {t(`question.metric.${key}`)}{" "}
              <span className="text-white">{Math.round(value)}</span>
            </span>
          ))}
        </div>
      )}

      {details.words?.length > 0 && (
        <>
          <p className="flex flex-wrap justify-center gap-x-2 gap-y-1 font-display text-lg">
            {details.words.map((w, i) => (
              <span
                key={`${w.word}-${i}`}
                className={wordClass(w)}
                title={
                  w.errorType === "Omission"
                    ? t("question.wordMissing")
                    : w.errorType === "Insertion"
                    ? t("question.wordExtra")
                    : `${Math.round(w.accuracy)}`
                }
              >
                {w.word}
              </span>
            ))}
          </p>
          <p className="flex flex-wrap justify-center gap-x-3 gap-y-1 font-mono text-[10px] text-white/40">
            <span className="text-signal-400">● {t("question.wordGood")}</span>
            <span className="text-amber-300">● {t("question.wordFair")}</span>
            <span className="text-pulse-400">● {t("question.wordBad")}</span>
          </p>
        </>
      )}
    </div>
  );
}

function SpeakerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M4 9v6h4l5 4V5L8 9H4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M16.5 8.5a5 5 0 010 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
