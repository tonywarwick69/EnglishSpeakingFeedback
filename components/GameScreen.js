"use client";

import { useState } from "react";
import { QUESTIONS } from "@/data/questions";
import ProgressTrack from "./ProgressTrack";
import QuestionCard from "./QuestionCard";
import { useLocale } from "./LocaleProvider";

export default function GameScreen({ username, onFinish }) {
  const { t } = useLocale();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState([]);

  const question = QUESTIONS[index];

  const handleAnswered = (answer) => {
    const next = [...answers, answer];
    setAnswers(next);

    if (index + 1 >= QUESTIONS.length) {
      onFinish(next);
    } else {
      setIndex((i) => i + 1);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-5 flex items-center justify-between">
        <p className="font-mono text-xs text-white/40">
          {t("game.player")}: <span className="text-signal-400">{username}</span>
        </p>
        <p className="font-mono text-xs text-white/40">{t("game.header")}</p>
      </div>

      <ProgressTrack currentIndex={index} answers={answers} />

      <div className="mt-6">
        <QuestionCard
          key={question.id}
          question={question}
          index={index}
          total={QUESTIONS.length}
          onAnswered={handleAnswered}
        />
      </div>
    </div>
  );
}
