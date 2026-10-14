"use client";

import { useEffect } from "react";

/** Fraction of the remaining distance the planes travel per frame; low enough to carry momentum, high enough to follow. */
const EASE_PER_FRAME = 0.08;
/** Below this the planes are close enough to the pointer target that the loop stops writing and sleeps. */
const SETTLED = 0.001;
const FINE_POINTER = "(hover: hover) and (pointer: fine) and (min-width: 1024px)";
const REDUCED = "(prefers-reduced-motion: reduce)";

/**
 * Pointer depth for the hero planes (SC-1, scroll-craft hero-depth). Desktop fine pointers only, never under reduced
 * motion, never touch. It writes two unitless numbers, --mx and --my in [-1, 1], on the hero section; hero.module.css
 * owns every magnitude (each plane multiplies them by its own depth), so this file holds no design values. Renders
 * nothing, so the hero still paints from server HTML before hydration.
 */
export function HeroDepth({ targetId }: { targetId: string }) {
  useEffect(() => {
    const hero = document.getElementById(targetId);
    const fine = window.matchMedia(FINE_POINTER);
    const reduced = window.matchMedia(REDUCED);
    if (!hero) return;

    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let frame = 0;
    let enabled = false;

    const write = () => {
      hero.style.setProperty("--mx", current.x.toFixed(4));
      hero.style.setProperty("--my", current.y.toFixed(4));
    };

    const tick = () => {
      current.x += (target.x - current.x) * EASE_PER_FRAME;
      current.y += (target.y - current.y) * EASE_PER_FRAME;
      const settled = Math.abs(target.x - current.x) < SETTLED && Math.abs(target.y - current.y) < SETTLED;
      if (settled) {
        current.x = target.x;
        current.y = target.y;
      }
      write();
      frame = settled ? 0 : requestAnimationFrame(tick);
    };

    const wake = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const box = hero.getBoundingClientRect();
      target.x = Math.max(-1, Math.min(1, ((event.clientX - box.left) / box.width) * 2 - 1));
      target.y = Math.max(-1, Math.min(1, ((event.clientY - box.top) / box.height) * 2 - 1));
      wake();
    };

    const onLeave = () => {
      target.x = 0;
      target.y = 0;
      wake();
    };

    const enable = () => {
      hero.addEventListener("pointermove", onMove);
      hero.addEventListener("pointerleave", onLeave);
    };

    const disable = () => {
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
      frame = 0;
      target.x = target.y = current.x = current.y = 0;
      hero.style.removeProperty("--mx");
      hero.style.removeProperty("--my");
    };

    const sync = () => {
      const next = fine.matches && !reduced.matches;
      if (next === enabled) return;
      enabled = next;
      if (enabled) enable();
      else disable();
    };

    sync();
    fine.addEventListener("change", sync);
    reduced.addEventListener("change", sync);
    return () => {
      fine.removeEventListener("change", sync);
      reduced.removeEventListener("change", sync);
      disable();
    };
  }, [targetId]);

  return null;
}
