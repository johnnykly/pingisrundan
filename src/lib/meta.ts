import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LANG, dictionaries, isLang, LANG_COOKIE, type Dict } from "@/i18n";

export async function serverDict(): Promise<Dict> {
  const v = (await cookies()).get(LANG_COOKIE)?.value;
  return dictionaries[isLang(v) ? v : DEFAULT_LANG];
}

/** Page <title> in the visitor's language. */
export function titleFrom(pick: (d: Dict) => string) {
  return async () => ({ title: pick(await serverDict()) });
}
