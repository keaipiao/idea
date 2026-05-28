"use client";

import { useEffect, useRef, useState } from "react";
import { COPY, IDEA_CONTENT_MAX } from "@/lib/copy";

interface Props {
  initial: string;
  onSave: (content: string) => Promise<void>;
  onClose: () => void;
}

/**
 * 编辑想法 Modal。PR-3 ADR-13 + ADR-19。
 * 由 useModal 在顶层 ModalRoot 渲染。
 */
export function EditIdeaModal({ initial, onSave, onClose }: Props) {
  const [content, setContent] = useState(initial);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // /review P1-K:仅初次 mount 时 focus + 设光标,不依赖 content(否则每次输入光标会跳)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    textareaRef.current?.focus();
    const len = initial.length;
    textareaRef.current?.setSelectionRange(len, len);
  }, []);

  const trimmed = content.trim();
  const overLimit = content.length > IDEA_CONTENT_MAX;
  const canSave = trimmed.length > 0 && !overLimit && trimmed !== initial.trim();

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await onSave(trimmed);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex w-[min(90vw,560px)] flex-col gap-[var(--space-m)] rounded-[var(--radius-l)] bg-[var(--color-bg-primary)] p-[var(--space-l)]">
      <div className="text-lg font-semibold">{COPY.ideaEditModalTitle}</div>
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void handleSave();
          }
        }}
        rows={6}
        className={`w-full rounded-[var(--radius-s)] border bg-[var(--color-bg-secondary)] p-[var(--space-m)] text-sm ${
          overLimit ? "border-[var(--color-danger)]" : "border-[var(--color-border)]"
        }`}
      />
      <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
        <span className={overLimit ? "text-[var(--color-danger)]" : ""}>
          {COPY.ideaOverLimit(content.length, IDEA_CONTENT_MAX)}
        </span>
        <div className="flex gap-[var(--space-s)]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[var(--radius-s)] px-[var(--space-l)] py-[var(--space-s)] text-sm"
          >
            {COPY.ideaEditCancel}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave || saving}
            className="rounded-[var(--radius-s)] bg-[var(--color-primary)] px-[var(--space-l)] py-[var(--space-s)] text-sm text-white disabled:opacity-50"
          >
            {COPY.ideaEditSave}
          </button>
        </div>
      </div>
    </div>
  );
}
