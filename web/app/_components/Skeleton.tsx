"use client";

import { useEffect, useState } from "react";
import { SKELETON_MIN_MS } from "@/lib/copy";

interface Props {
  className?: string;
}

/**
 * Skeleton 占位条。挂载 200ms 后才显(防闪)。
 * PR-3 § 3.11(SKELETON_MIN_MS = 200ms)
 */
export function Skeleton({ className = "" }: Props) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), SKELETON_MIN_MS);
    return () => clearTimeout(t);
  }, []);
  if (!visible) return null;
  return (
    <div className={`animate-pulse rounded-[var(--radius-m)] bg-[var(--color-bg-secondary)] ${className}`} />
  );
}
