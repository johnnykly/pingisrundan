"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  dictionaries,
  isLang,
  LANG_COOKIE,
  LANG_STORAGE_KEY,
  type Dict,
  type Lang,
} from "./index";

interface I18n {
  lang: Lang;
  d: Dict;
  setLang: (l: Lang) => void;
}

const I18nContext = createContext<I18n | null>(null);

function persist(l: Lang) {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, l);
  } catch {
    // Private mode or storage disabled; the cookie still carries the choice.
  }
  // Mirrored to a cookie so the server renders the right language without a flash.
  document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.lang = l;
}

export function LangProvider({
  initial,
  children,
}: {
  initial: Lang;
  children: React.ReactNode;
}) {
  const [lang, setLangState] = useState<Lang>(initial);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(LANG_STORAGE_KEY);
    } catch {}
    if (isLang(stored) && stored !== initial) {
      setLangState(stored);
      persist(stored);
    } else if (!isLang(stored)) {
      persist(initial);
    }
  }, [initial]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    persist(l);
  }, []);

  const value = useMemo(() => ({ lang, d: dictionaries[lang], setLang }), [lang, setLang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside LangProvider");
  return ctx;
}
