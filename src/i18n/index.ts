import { en } from "./en";
import { sv, type Dict } from "./sv";

export type Lang = "sv" | "en";
export const LANGS: Lang[] = ["sv", "en"];
export const DEFAULT_LANG: Lang = "sv";
export const LANG_STORAGE_KEY = "pingis.lang";
export const LANG_COOKIE = "pingis_lang";

export const dictionaries: Record<Lang, Dict> = { sv, en };

export function isLang(v: unknown): v is Lang {
  return v === "sv" || v === "en";
}

/** Replaces {key} placeholders. */
export function fmt(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) =>
    k in vars ? String(vars[k]) : `{${k}}`,
  );
}

export type { Dict };
