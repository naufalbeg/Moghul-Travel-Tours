"use client";

import { useLinkStatus } from "next/link";
import type { ReactNode } from "react";

/**
 * Feedback for a clicked link whose page is still loading (every public page
 * is rendered per request, so there is a short wait). Must be rendered
 * inside a <Link>.
 *
 * - `<PendingDim>` fades its children slightly while the page loads: for
 *   menu links and pills.
 * - `<PendingSpinner>` shows a small spinner: for cards and rows.
 */
export function PendingDim({ children }: { children: ReactNode }) {
  const { pending } = useLinkStatus();
  return <span className={`transition-opacity duration-150 ${pending ? "link-pending" : ""}`}>{children}</span>;
}

export function PendingSpinner({ className = "" }: { className?: string }) {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return <span aria-hidden="true" className={`spinner ${className}`} />;
}
