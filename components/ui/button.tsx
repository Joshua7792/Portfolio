import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { NewTabHint } from "./new-tab-hint";

type ButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "inverse";
  size?: "sm" | "md" | "lg" | "lg-mobile";
};

/**
 * Spec §6.2 pill link. Same-site page links ("/#work", "/work/x") render next/link for client navigation; files
 * (download), new tabs and external URLs stay plain anchors. A new tab always gets rel="noopener" and the hidden cue.
 */
export function Button({ children, className = "", variant = "primary", size = "md", href, rel, target, download, ...props }: ButtonProps) {
  const classes = `button button-${variant} button-${size} ${className}`.trim();
  const newTab = target === "_blank";
  if (href.startsWith("/") && !href.startsWith("//") && !download && !newTab) {
    return <Link className={classes} href={href} rel={rel} {...props}>{children}</Link>;
  }
  return (
    <a className={classes} download={download} href={href} rel={newTab ? (rel ?? "noopener") : rel} target={target} {...props}>
      {children}{newTab ? <NewTabHint /> : null}
    </a>
  );
}
