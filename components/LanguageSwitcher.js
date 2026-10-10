"use client";

import { SUPPORTED_LOCALES, useLocale } from "./LocaleProvider";

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();

  return (
    <div
      role="group"
      aria-label={t("language.switchTo")}
      className="inline-flex rounded-full border border-white/10 bg-void-800/60 p-0.5"
    >
      {SUPPORTED_LOCALES.map((code) => {
        const active = locale === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            aria-pressed={active}
            title={t(`language.${code}Full`)}
            className={`focus-ring rounded-full px-3 py-1 font-mono text-xs font-medium transition ${
              active ? "bg-signal-500 text-void-950" : "text-white/60 hover:text-white"
            }`}
          >
            {t(`language.${code}`)}
          </button>
        );
      })}
    </div>
  );
}
