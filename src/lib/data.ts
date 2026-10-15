import "server-only";
import { unstable_cache } from "next/cache";
import { getStore } from "./store";
import type { Data } from "./types";

export const DATA_TAG = "sheet-data";

/**
 * Cached read of both tabs. Writes through the app invalidate the tag immediately;
 * the short revalidate window picks up edits made directly in the sheet.
 */
export const getData = unstable_cache(
  async (): Promise<Data> => getStore().read(),
  ["pingis-data"],
  { tags: [DATA_TAG], revalidate: 20 },
);
