import type { Status } from "@/content/schema";

/** Spec §6.9 (+ §14 S7 ruling: "Shipped" uses the "In production" treatment). A new status is a type error here. */
const variantFor: Record<Status, "production" | "progress" | "sandbox"> = {
  "In production": "production",
  Shipped: "production",
  "In progress": "progress",
  "Paper / sandbox": "sandbox",
};

export function StatusBadge({ status }: { status: Status }) {
  return <span className={`status-badge status-${variantFor[status]} t-mono-badge`}><span aria-hidden="true" className="status-glyph" />{status}</span>;
}
