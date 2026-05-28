"use client";

import { useRef, useState } from "react";
import { useToast } from "./ToastProvider";
import { COPY, IDEA_CONTENT_MAX } from "@/lib/copy";

interface Props {
  projectId: number | null;
  onSubmit: (content: string) => Promise<unknown>;
}

/**
 * 输入新想法。PR-3 § 3.5.1 + ADR-11(乐观更新)。
 */
export function IdeaInput({ projectId, onSubmit }: Props) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const trimmed = content.trim();
  const overLimit = content.length > IDEA_CONTENT_MAX;
  const disabled = !projectId;
  const canSubmit = trimmed.length > 0 && !overLimit && !submitting && projectId;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const before = trimmed;
    setContent("");
    try {
      await onSubmit(before);
      showToast(COPY.ideaCreated, "success");
    } catch (e) {
      // 失败回填,不丢字
      setContent(before);
      showToast(e instanceof Error ? e.message : COPY.systemError, "error");
    } finally {
      setSubmitting(false);
      textareaRef.current?.focus();
    }
  };

  return (
    <div
      className={`flex flex-col rounded-[var(--radius-m)] border bg-[var(--color-bg-primary)] shadow-sm transition-shadow focus-within:shadow-md ${
        overLimit ? "border-[var(--color-danger)]" : "border-[var(--color-border)]"
      }`}
    >
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void handleSubmit();
          }
        }}
        placeholder={disabled ? COPY.ideaInputNoProject : COPY.ideaInputPlaceholder}
        aria-label={disabled ? COPY.ideaInputNoProject : COPY.ideaInputPlaceholder}
        disabled={disabled || submitting}
        rows={3}
        className="w-full resize-none rounded-t-[var(--radius-m)] bg-transparent px-[var(--space-l)] pb-[var(--space-s)] pt-[var(--space-l)] text-[15px] leading-relaxed placeholder:text-[var(--color-text-secondary)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      />
      <div className="flex items-center justify-between border-t border-[var(--color-border)] px-[var(--space-l)] py-[var(--space-s)] text-xs text-[var(--color-text-secondary)]">
        <span className={overLimit ? "text-[var(--color-danger)]" : ""}>
          {content.length > 0 ? COPY.ideaOverLimit(content.length, IDEA_CONTENT_MAX) : "Enter 发送 · Shift+Enter 换行"}
        </span>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="rounded-[var(--radius-s)] bg-[var(--color-primary)] px-[var(--space-l)] py-[var(--space-xs)] text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {submitting ? COPY.loading : "发送"}
        </button>
      </div>
    </div>
  );
}
