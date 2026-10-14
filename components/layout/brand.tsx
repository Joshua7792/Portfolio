import Link from "next/link";
import { Sparkle } from "@/components/ui/sparkle";

type BrandProps = { name: string; size: 24 | 28; onClick?: () => void };

/** Spec §6.1 wordmark: amber sparkle plus the name, linking home. Used by the nav, the mobile menu and the footer. */
export function Brand({ name, size, onClick }: BrandProps) {
  return <Link aria-label={name} className="brand" href="/" onClick={onClick}><Sparkle className="text-amber" size={size} /><span className="t-logo">{name}</span></Link>;
}
