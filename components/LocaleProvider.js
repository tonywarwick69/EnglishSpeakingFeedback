"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import en from "@/locales/en";
import vi from "@/locales/vi";

const dictionaries = { en, vi };

export const SUPPORTED_LOCALES = ["en", "vi"];
export const DEFAULT_LOCALE = "vi";
const STORAGE_KEY = "speaking_lab_locale";

function resolve(dict, path) {
  return path.split(".").reduce((obj, key) => (obj && obj[key] !== undefined ? obj[key] : undefined), dict);
}

// Looks up `key` (e.g. "tabs.dashboard") in the active locale, falls back to
// English, then to the key itself. Replaces {placeholders} with `vars`.
function translate(locale, key, vars) {
  let str = resolve(dictionaries[locale], key);
  if (str === undefined) str = resolve(dictionaries.en, key);
  if (str === undefined) return key;
  if (typeof str !== "string") return key;
  if (vars) {
    str = str.replace(/\{(\w+)\}/g, (match, name) =>
      vars[name] !== undefined ? String(vars[name]) : match
    );
  }
  return str;
}

const LocaleContext = createContext({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key, vars) => translate(DEFAULT_LOCALE, key, vars),
});

export function LocaleProvider({ children }) {
  // Start with the default so server and first client render match, then
  // apply the saved / browser language after mount.
  const [locale, setLocaleState] = useState(DEFAULT_LOCALE);

  useEffect(() => {
    let initial = DEFAULT_LOCALE;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (SUPPORTED_LOCALES.includes(saved)) {
        initial = saved;
      } else if (navigator.language) {
        initial = navigator.language.toLowerCase().startsWith("vi") ? "vi" : "en";
      }
    } catch (_) {
      /* localStorage unavailable — keep default */
    }
    setLocaleState(initial);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next) => {
    if (!SUPPORTED_LOCALES.includes(next)) return;
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch (_) {
      /* non-blocking */
    }
  }, []);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: (key, vars) => translate(locale, key, vars),
    }),
    [locale, setLocale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
