"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cssVars } from "@/lib/css-vars";
import { motion } from "@/lib/motion";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Position among its siblings; spec §8 row 14 staggers 60ms per sibling, capped at the 6th (300ms). */
  index?: number;
};

/**
 * Spec §8 row 14 scroll reveal. Server-rendered children stay server components. The hidden state exists only under
 * html.js (set in the document head), so the content is visible without JavaScript. app/globals.css owns the motion;
 * this component only flips data-visible once and passes the stagger as --reveal-delay.
 */
export function Reveal({ children, className = "", index = 0 }: RevealProps) {
  const element = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = element.current;
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.15, rootMargin: "0px 0px -10% 0px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const step = Math.min(Math.max(index, 0), motion.delay.staggerMaxSteps);
  const style = step > 0 ? cssVars({ "--reveal-delay": `${step * motion.delay.staggerStep}ms` }) : undefined;
  return <div className={`reveal ${className}`.trim()} data-visible={visible} ref={element} style={style}>{children}</div>;
}
