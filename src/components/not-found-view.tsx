"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/provider";
import { EmptyState } from "./ui";

export function NotFoundView() {
  const { d } = useI18n();
  return (
    <EmptyState>
      <p>{d.common.notFound}</p>
      <Link href="/" className="mt-4 inline-flex min-h-11 items-center font-semibold text-ink underline">
        {d.nav.home}
      </Link>
    </EmptyState>
  );
}
