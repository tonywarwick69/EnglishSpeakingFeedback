"use client";

import { useEffect, useState } from "react";
import { useSpeechRecognition, speak } from "@/hooks/useSpeechRecognition";
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
  const { isSupported, listening, transcript, error, start, stop, reset } =
    useSpeechRecognition({ lang: "en-US" });

  const [result, setResult] = useState(null); // { correct, spoken, ratio }
  const [attempt, setAttempt] = useState(0);

  // Reset local state whenever the question changes
  useEffect(() => {
    setResult(null);
    setAttempt(0);
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  // When recognition finishes and we have an ungraded transcript, grade it.
  useEffect(() => {
    if (!listening && transcript && !result) {
      const ratio = pronunciationScore(transcript, question.target);
      const correct = ratio >= question.matchThreshold;
      setResult({ correct, spoken: transcript, ratio });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listening, transcript]);

  // Recognition ended with an error / no speech detected
  useEffect(() => {
    if (!listening && error && !result) {
      setResult({ correct: false, spoken: "", ratio: 0, err: error });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listening, error]);

  const handleMicClick = () => {
    if (listening) {
      stop();
      return;
    }
    setResult(null);
    reset();
    setAttempt((a) => a + 1);
    start();
  };

  const handleNext = () => {
    onAnswered({
      questionId: question.id,
      target: question.target,
      spoken: result?.spoken || "",
      correct: !!result?.correct,
    });
  };

  const badgeClass = levelBadge[question.level.color];
  const micState = result ? (result.correct ? "correct" : "incorrect") : "idle";
  const instructionKey = question.instructionKey || question.type;

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
          {question.ipa && (
            <span className="font-mono text-signal-400">{question.ipa}</span>
          )}
          {locale === "vi" && <span className="text-white/50">{question.vi}</span>}
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center gap-4">
        {!isSupported ? (
          <div className="rounded-xl border border-pulse-500/40 bg-pulse-500/10 px-4 py-3 text-center text-sm text-pulse-400">
            {t("question.unsupported")}
          </div>
        ) : (
          <>
            <MicVisualizer listening={listening} state={micState} />

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
                  listening
                    ? "bg-pulse-500 text-white hover:bg-pulse-400"
                    : "bg-signal-500 text-void-950 hover:bg-signal-400"
                }`}
              >
                {listening
                  ? t("question.stop")
                  : attempt > 0 && result
                  ? t("question.again")
                  : t("question.start")}
              </button>
            </div>

            <div className="min-h-[3.5rem] w-full text-center">
              {listening && (
                <p className="font-mono text-xs text-signal-400">{t("question.listening")}</p>
              )}

              {result && (
                <div className="animate-float-up mt-2 space-y-1">
                  <p
                    className={`text-sm font-semibold ${
                      result.correct ? "text-signal-400" : "text-pulse-400"
                    }`}
                  >
                    {result.correct ? t("question.correct") : t("question.incorrect")}
                  </p>
                  <p className="font-mono text-xs text-white/40">
                    {t("question.heard", {
                      text: result.spoken || t("question.heardNone"),
                    })}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="mt-6 flex justify-center gap-3">
        {result && (
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
        {!result && !isSupported && (
          <button
            type="button"
            onClick={() =>
              onAnswered({
                questionId: question.id,
                target: question.target,
                spoken: "",
                correct: false,
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

function SpeakerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M4 9v6h4l5 4V5L8 9H4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M16.5 8.5a5 5 0 010 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
