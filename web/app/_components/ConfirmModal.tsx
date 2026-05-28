"use client";

import { COPY } from "@/lib/copy";

interface Props {
  title: string;
  message: string;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
  danger?: boolean;
}

/**
 * 通用确认 Modal,替代 window.confirm。
 * /review P2-O 修法。
 */
export function ConfirmModal({ title, message, onConfirm, onClose, danger }: Props) {
  return (
    <div className="flex w-[min(90vw,440px)] flex-col gap-[var(--space-m)] rounded-[var(--radius-l)] bg-[var(--color-bg-primary)] p-[var(--space-l)]">
      <div className="text-lg font-semibold">{title}</div>
      <div className="text-sm text-[var(--color-text-secondary)]">{message}</div>
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
          onClick={async () => {
            await onConfirm();
            onClose();
          }}
          className={`rounded-[var(--radius-s)] px-[var(--space-l)] py-[var(--space-s)] text-sm text-white ${
            danger ? "bg-[var(--color-danger)]" : "bg-[var(--color-primary)]"
          }`}
        >
          {danger ? COPY.delete : COPY.save}
        </button>
      </div>
    </div>
  );
}
