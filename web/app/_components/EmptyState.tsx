"use client";

import { motion } from "framer-motion";

interface Props {
  message: string;
  action?: React.ReactNode;
}

export function EmptyState({ message, action }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-col items-center justify-center gap-[var(--space-l)] py-[var(--space-xl)] text-center"
    >
      <motion.svg
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        width="96"
        height="96"
        viewBox="0 0 96 96"
        fill="none"
        className="text-[var(--color-text-secondary)] opacity-30"
        aria-hidden
      >
        <rect x="20" y="28" width="56" height="14" rx="3" stroke="currentColor" strokeWidth="2" />
        <rect x="20" y="50" width="56" height="14" rx="3" stroke="currentColor" strokeWidth="2" />
        <circle cx="28" cy="35" r="2.5" fill="currentColor" />
        <circle cx="28" cy="57" r="2.5" fill="currentColor" />
        <line x1="36" y1="35" x2="68" y2="35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="36" y1="57" x2="60" y2="57" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </motion.svg>
      <div className="text-sm text-[var(--color-text-secondary)]">{message}</div>
      {action}
    </motion.div>
  );
}
