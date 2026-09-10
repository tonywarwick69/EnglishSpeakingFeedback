"use client";

const BAR_COUNT = 5;

export default function MicVisualizer({ listening, state }) {
  // state: 'idle' | 'listening' | 'correct' | 'incorrect'
  const ringColor =
    state === "correct"
      ? "border-signal-400"
      : state === "incorrect"
      ? "border-pulse-500"
      : "border-signal-400";

  const glow =
    state === "correct"
      ? "shadow-glow"
      : state === "incorrect"
      ? "shadow-glowPulse"
      : listening
      ? "shadow-glow"
      : "";

  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      {listening && (
        <>
          <span
            className={`absolute inline-block h-full w-full rounded-full border ${ringColor} animate-pulse-ring`}
          />
          <span
            className={`absolute inline-block h-full w-full rounded-full border ${ringColor} animate-pulse-ring`}
            style={{ animationDelay: "0.6s" }}
          />
        </>
      )}
      <div
        className={`relative flex h-24 w-24 items-center justify-center rounded-full border-2 ${ringColor} bg-void-800/80 transition-all duration-300 ${glow}`}
      >
        {state === "correct" ? (
          <CheckIcon />
        ) : state === "incorrect" ? (
          <CrossIcon />
        ) : listening ? (
          <div className="flex items-end gap-[3px] h-8">
            {Array.from({ length: BAR_COUNT }).map((_, i) => (
              <span
                key={i}
                className="w-[4px] rounded-full bg-signal-400 animate-bar-bounce"
                style={{
                  height: "100%",
                  animationDelay: `${i * 0.12}s`,
                }}
              />
            ))}
          </div>
        ) : (
          <MicIcon />
        )}
      </div>
    </div>
  );
}

function MicIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="text-signal-400">
      <path
        d="M12 15a3 3 0 003-3V6a3 3 0 10-6 0v6a3 3 0 003 3z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M19 11a7 7 0 01-14 0M12 18v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" className="text-signal-400">
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="text-pulse-500">
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
