"use client";

import { useEffect, useRef, useState } from "react";
import { COPY, PROJECT_NAME_MAX } from "@/lib/copy";

interface Props {
  initial: string;
  title: string;
  onSave: (value: string) => Promise<void>;
  onClose: () => void;
}

/**
 * 重命名 Modal,替代 window.prompt。
 * /review P2-O 修法。
 */
export function RenameModal({ initial, title, onSave, onClose }: Props) {
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const trimmed = value.trim();
  const overLimit = value.length > PROJECT_NAME_MAX;
  const canSave = trimmed.length > 0 && !overLimit && trimmed !== initial.trim() && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await onSave(trimmed);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex w-[min(90vw,440px)] flex-col gap-[var(--space-m)] rounded-[var(--radius-l)] bg-[var(--color-bg-primary)] p-[var(--space-l)]">
      <div className="text-lg font-semibold">{title}</div>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, PROJECT_NAME_MAX))}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void handleSave();
          }
        }}
        maxLength={PROJECT_NAME_MAX}
        className={`rounded-[var(--radius-s)] border bg-[var(--color-bg-secondary)] px-[var(--space-m)] py-[var(--space-s)] text-sm ${
          overLimit ? "border-[var(--color-danger)]" : "border-[var(--color-border)]"
        }`}
      />
      <div className="flex justify-end gap-[var(--space-s)]">
        <button
          type="button"
          onClick={onClose}
          className="rounded-[var(--radius-s)] px-[var(--space-l)] py-[var(--space-s)] text-sm"
        >
          {COPY.cancel}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="rounded-[var(--radius-s)] bg-[var(--color-primary)] px-[var(--space-l)] py-[var(--space-s)] text-sm text-white disabled:opacity-50"
        >
          {COPY.save}
        </button>
      </div>
    </div>
  );
}
