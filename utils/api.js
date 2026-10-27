
const AVG = (array) =>
  array.length ? array.reduce((sum, n) => sum + n, 0) / array.length : 0;
export async function saveSpeakingResult(username, correct, onScoreSaved) {
  const total = 100;
  const accuracy = correct.accuracy;
  const fluency = correct.fluency;
  const pronunciation = correct.pronScore;
  const prosody = correct.prosody;
  const finalCorrect = AVG([accuracy, fluency, pronunciation, prosody]);
  const score = Math.round((finalCorrect / total) * 100);

  try {
    const res = await fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, score,  correct: finalCorrect, total }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error("save_failed");
    onScoreSaved?.();
    return true;
  } catch (err) {
    return false;
  }
}
