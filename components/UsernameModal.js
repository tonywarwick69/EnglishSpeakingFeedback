"use client";

import { useState } from "react";
import { useLocale } from "./LocaleProvider";

export default function UsernameModal({ open, onSubmit, onClose, defaultValue = "" }) {
  const { t } = useLocale();
  const [value, setValue] = useState(defaultValue);
  const [touched, setTouched] = useState(false);

  if (!open) return null;

  const trimmed = value.trim();
  const isValid = trimmed.length >= 2 && trimmed.length <= 20;

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;
    onSubmit(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-void-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-void-800 p-6 shadow-glow">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-signal-500/15 text-signal-400">
            <IdIcon />
          </span>
          <div>
            <h3 className="font-display text-lg font-semibold text-white">
              {t("username.title")}
            </h3>
          </div>
        </div>

        <p className="mb-4 text-sm text-white/60">
          {t("username.description")}
        </p>

        <form onSubmit={handleSubmit}>
          <input
            autoFocus
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t("username.placeholder")}
            maxLength={20}
            className="focus-ring w-full rounded-xl border border-white/15 bg-void-900 px-4 py-3 text-white placeholder:text-white/30"
          />
          {touched && !isValid && (
            <p className="mt-2 text-xs text-pulse-400">
              {t("username.invalid")}
            </p>
          )}

          <div className="mt-5 flex gap-3">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="focus-ring flex-1 rounded-full border border-white/15 px-4 py-2.5 text-sm text-white/70 transition hover:border-white/40 hover:text-white"
              >
                {t("username.cancel")}
              </button>
            )}
            <button
              type="submit"
              className="focus-ring flex-1 rounded-full bg-signal-500 px-4 py-2.5 text-sm font-semibold text-void-950 transition hover:bg-signal-400"
            >
              {t("username.submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function IdIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M5 19c1.2-3.4 4-5 7-5s5.8 1.6 7 5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
