import "server-only";
import { getData } from "./data";
import { ConfigError } from "./store";
import type { Data } from "./types";

export type Loaded = { ok: true; data: Data } | { ok: false; error: "config" | "loadFailed" };

/** Reads the sheet and turns failures into a renderable state instead of a 500. */
export async function load(): Promise<Loaded> {
  try {
    return { ok: true, data: await getData() };
  } catch (e) {
    console.error(e);
    return { ok: false, error: e instanceof ConfigError ? "config" : "loadFailed" };
  }
}
