"use client";

import { useState } from "react";
import { QUESTIONS } from "@/data/questions";
import UsernameModal from "./UsernameModal";
import GameScreen from "./GameScreen";
import ResultScreen from "./ResultScreen";
import { useLocale } from "./LocaleProvider";

export default function Dashboard({
  onScoreSaved = () => {},
  onGoToScoreboard = () => {},
}) {
  const { t } = useLocale();
  const [phase, setPhase] = useState("intro"); // intro | playing | result
  const [username, setUsername] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const handleStartClick = () => {
    if (username) {
      setPhase("playing");
    } else {
      setShowModal(true);
    }
  };

  const handleUsernameSubmit = (name) => {
    setUsername(name);
    try {
      window.localStorage.setItem("speaking_lab_username", name);
    } catch (_) {
      /* localStorage unavailable — non-blocking */
    }
    setShowModal(false);
    setPhase("playing");
  };

  const handleFinish = (finalAnswers) => {
    setAnswers(finalAnswers);
    setSaveFailed(false);
    setPhase("result");
  };

  const saveResult = async () => {
    const total = QUESTIONS.length;
    const correct = answers.filter((a) => a.correct).length;
    const score = Math.round((correct / total) * 100);

    setSaving(true);
    setSaveFailed(false);
    try {
      const res = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, score, correct, total }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error("save_failed");
      onScoreSaved?.();
      return true;
    } catch (err) {
      setSaveFailed(true);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handlePlayAgain = async () => {
    const ok = await saveResult();
    if (ok) {
      setAnswers([]);
      setPhase("playing");
    }
  };

  const handleChangePlayer = () => {
    setUsername("");
    setAnswers([]);
    setPhase("intro");
    setShowModal(true);
  };

  return (
    <div className="flex w-full flex-col items-center">
      <UsernameModal
        open={showModal}
        defaultValue={username}
        onSubmit={handleUsernameSubmit}
        onClose={username ? () => setShowModal(false) : undefined}
      />

      {phase === "intro" && (
        <IntroHero username={username} onStart={handleStartClick} />
      )}

      {phase === "playing" && (
        <GameScreen username={username} onFinish={handleFinish} />
      )}

      {phase === "result" && (
        <ResultScreen
          username={username}
          answers={answers}
          onPlayAgain={handlePlayAgain}
          onChangePlayer={handleChangePlayer}
          onViewScoreboard={onGoToScoreboard}
          saving={saving}
          saveError={saveFailed ? t("result.saveError") : ""}
        />
      )}
    </div>
  );
}

function IntroHero({ username, onStart }) {
  const { t } = useLocale();
  return (
    <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-void-800/70 p-8 text-center backdrop-blur-sm sm:p-10">
      <span className="inline-flex items-center gap-2 rounded-full border border-signal-500/30 bg-signal-500/10 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-signal-400">
        {t("intro.badge")}
      </span>

      <h1 className="mt-5 font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
        {t("intro.titleLine1")}
        <span className="block text-signal-400">{t("intro.titleLine2")}</span>
      </h1>

      <p className="mx-auto mt-4 max-w-md text-sm text-white/60 sm:text-base">
        {t("intro.description")}
      </p>

      <div className="mx-auto mt-8 grid max-w-md grid-cols-3 gap-3 text-left">
        <StatChip label={t("intro.statQuestions")} value="10" />
        <StatChip label={t("intro.statLevels")} value="3" />
        <StatChip label={t("intro.statGrading")} value="AI" />
      </div>

      <button
        type="button"
        onClick={onStart}
        className="focus-ring mt-9 rounded-full bg-signal-500 px-8 py-3 text-sm font-semibold text-void-950 transition hover:bg-signal-400"
      >
        {username ? t("intro.startAs", { name: username }) : t("intro.start")}
      </button>

      <p className="mt-4 font-mono text-[11px] text-white/30">{t("intro.browserNote")}</p>
    </div>
  );
}

function StatChip({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-void-900/60 px-3 py-3 text-center">
      <p className="font-display text-2xl font-bold text-white">{value}</p>
      <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">{label}</p>
    </div>
  );
}
