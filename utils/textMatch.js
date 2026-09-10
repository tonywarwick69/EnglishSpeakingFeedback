// Lightweight string-similarity scorer used to compare what the Web Speech API
// heard against the target word/phrase/sentence. No external dependency needed.

export function normalize(str) {
  return (str || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Levenshtein edit distance
function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;

  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      dp[j] = Math.min(
        dp[j] + 1, // deletion
        dp[j - 1] + 1, // insertion
        prev + (a[i - 1] === b[j - 1] ? 0 : 1) // substitution
      );
      prev = temp;
    }
  }
  return dp[n];
}

// Returns a similarity ratio between 0 and 1 (1 = identical)
export function similarityRatio(a, b) {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na && !nb) return 1;
  if (!na || !nb) return 0;
  const distance = levenshtein(na, nb);
  const maxLen = Math.max(na.length, nb.length);
  return 1 - distance / maxLen;
}

// Word-overlap ratio — helpful complement for multi-word phrases/sentences where
// word order recognized by the browser can vary slightly.
export function wordOverlapRatio(a, b) {
  const wa = normalize(a).split(" ").filter(Boolean);
  const wb = new Set(normalize(b).split(" ").filter(Boolean));
  if (wa.length === 0) return 0;
  const hits = wa.filter((w) => wb.has(w)).length;
  return hits / wa.length;
}

// Combined score: takes the best of character-level similarity and word overlap,
// which is more forgiving for short recognitions of long sentences.
export function pronunciationScore(spokenText, targetText) {
  const charScore = similarityRatio(spokenText, targetText);
  const overlapScore = wordOverlapRatio(targetText, spokenText);
  return Math.max(charScore, overlapScore);
}
