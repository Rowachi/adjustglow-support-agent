"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * Respects the OS-level prefers-reduced-motion setting for every
 * motion/react animation on the page (taste-skill: reduced motion must be
 * honored, not just paused via a CSS animation-duration override).
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
