// Combines the per-utterance results that Azure's continuous recognition returns
// into one overall result for the whole answer.
//
// segment = { text, accuracy, fluency, prosody, words: [{ word, accuracy, errorType }] }

const isNum = (v) => typeof v === "number" && Number.isFinite(v);

// Weighted average of `key`, weighting each utterance by how many words it has.
function weightedAverage(segments, key) {
  let sum = 0;
  let weight = 0;
  for (const s of segments) {
    if (!isNum(s[key])) continue;
    const w = Math.max(1, s.words?.length || 1);
    sum += s[key] * w;
    weight += w;
  }
  return weight ? sum / weight : null;
}

// Azure's documented formula for the speaking (unscripted) scenario:
// sort the available scores low -> high (s0, s1, s2) and weight them.
export function combinePronScore({ accuracy, fluency, prosody }) {
  const parts = [accuracy, fluency, prosody].filter(isNum).sort((a, b) => a - b);
  if (parts.length === 3) return 0.6 * parts[0] + 0.2 * parts[1] + 0.2 * parts[2];
  if (parts.length === 2) return 0.6 * parts[0] + 0.4 * parts[1];
  return parts[0] ?? 0;
}

export function aggregateSegments(segments) {
  const valid = (segments || []).filter((s) => s.text && s.text.trim());
  if (valid.length === 0) return null;

  const accuracy = weightedAverage(valid, "accuracy");
  const fluency = weightedAverage(valid, "fluency");
  const prosody = weightedAverage(valid, "prosody");
  const transcript = valid.map((s) => s.text.trim()).join(" ");
  const words = valid.flatMap((s) => s.words || []);

  return {
    transcript,
    words,
    wordCount: transcript.split(/\s+/).filter(Boolean).length,
    accuracy,
    fluency,
    prosody,
    pronScore: combinePronScore({ accuracy, fluency, prosody }),
  };
}
