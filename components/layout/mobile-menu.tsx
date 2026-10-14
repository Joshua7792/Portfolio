"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DownloadIcon, Icon } from "@/components/ui/icon";
import { Brand } from "@/components/layout/brand";
import { cssVars } from "@/lib/css-vars";
import { motion } from "@/lib/motion";

/* Plain props from the server Nav: this client file must never import content/site.ts (it is server-only, and
   importing it would ship the whole content object and Zod to every browser). */
type MobileMenuProps = {
  name: string;
  items: ReadonlyArray<{ label: string; href: string }>;
  ctaLabel: string;
  resumeHref: string;
};

// Spec §8 rows 15-16, passed to the CSS in app/globals.css as custom properties.
const panelMotion = cssVars({
  "--menu-open": motion.duration.menuOpen,
  "--menu-item": motion.duration.menuItem,
  "--menu-close": motion.duration.menuClose,
});
const DESKTOP = "(min-width: 1024px)"; // spec §4: the lg switch hides the trigger
const FOCUSABLE = "a[href], button:not([disabled])";

function itemDelay(index: number) {
  return cssVars({ "--menu-item-delay": `${motion.delay.menuItem + index * motion.delay.menuItemStep}ms` });
}

/** Everything a pointer or keyboard could reach behind the dialog: main, footer, skip link, the rest of the header. */
function backgroundOf(panel: HTMLElement): HTMLElement[] {
  const header = panel.closest("header");
  const headerParts = header ? [...header.querySelectorAll<HTMLElement>(".site-nav-inner > *")].filter((node) => node !== panel) : [];
  const page = [...document.querySelectorAll<HTMLElement>("body > .skip-link, body > main, body > footer")];
  return [...page, ...headerParts];
}

/** Spec §6.1 mobile menu: modal dialog, background inert, focus trapped, Esc / Close return focus to the trigger. */
export function MobileMenu({ name, items, ctaLabel, resumeHref }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const returnFocus = useRef(false);

  // Stable (refs and state setters only), so the open effect can list it as a dependency.
  const close = useCallback((focusTrigger: boolean) => {
    if (closeTimer.current !== undefined) return;
    returnFocus.current = focusTrigger;
    setClosing(true);
    closeTimer.current = window.setTimeout(() => {
      closeTimer.current = undefined;
      setClosing(false);
      setOpen(false);
    }, motion.ms.menuClose);
  }, []);

  useEffect(() => {
    const dialog = panel.current;
    if (!open || !dialog) return;
    // html is the scroller (body carries overflow-x: clip), so the lock goes on the root element.
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    const triggerButton = trigger.current;
    const background = backgroundOf(dialog);
    background.forEach((node) => { node.inert = true; });
    dialog.querySelector<HTMLElement>(".mobile-menu-close")?.focus();

    // On the document, not the panel: Escape and the trap still work after a click on the panel's dead space.
    function onKeyDown(event: KeyboardEvent) {
      if (!dialog) return;
      if (event.key === "Escape") { event.preventDefault(); close(true); return; }
      if (event.key !== "Tab") return;
      const focusable = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)];
      const first = focusable[0];
      const last = focusable.at(-1);
      const active = document.activeElement;
      const outside = !dialog.contains(active) || active === dialog;
      if (event.shiftKey && (active === first || outside)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (active === last || outside)) { event.preventDefault(); first?.focus(); }
    }
    // A viewport that grows past lg hides the trigger; close so the page does not stay locked behind a stale panel.
    const desktop = window.matchMedia(DESKTOP);
    function onBreakpoint(event: MediaQueryListEvent) { if (event.matches) close(false); }

    document.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onBreakpoint);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onBreakpoint);
      background.forEach((node) => { node.inert = false; });
      root.style.overflow = previousOverflow;
      // After inert is cleared, or the focus call would be ignored.
      if (returnFocus.current) triggerButton?.focus();
      returnFocus.current = false;
    };
  }, [open, close]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  return <>
    <button aria-expanded={open} aria-label="Open menu" className="mobile-menu-trigger" onClick={() => setOpen(true)} ref={trigger} type="button">
      <span aria-hidden="true" className="menu-bars"><span /><span /></span>
    </button>
    {open && <div aria-label="Menu" aria-modal="true" className={`mobile-menu-panel ${closing ? "menu-exit" : "menu-enter"}`} data-surface="light"
      id="mobile-menu" ref={panel} role="dialog" style={panelMotion} tabIndex={-1}>
      <div className="container mobile-menu-head">
        <Brand name={name} onClick={() => close(false)} size={24} />
        <button aria-label="Close menu" className="mobile-menu-close" onClick={() => close(true)} type="button"><Icon name="close" /></button>
      </div>
      <nav aria-label="Main" className="container mobile-menu-links">
        {/* Link clicks navigate to the section; focus follows the fragment target, not the trigger. */}
        {items.map((item, index) => <Link className="t-menu menu-item" href={`/${item.href}`} key={item.href} onClick={() => close(false)} style={itemDelay(index)}>{item.label}</Link>)}
        <Button className="mobile-menu-cta menu-item" download href={resumeHref} size="lg-mobile" style={itemDelay(items.length)}>{ctaLabel}<DownloadIcon /></Button>
      </nav>
    </div>}
  </>;
}
