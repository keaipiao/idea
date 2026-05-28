"use client";

import { useSortable, defaultAnimateLayoutChanges } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import type { IdeaVO } from "@/lib/types";
import { COPY } from "@/lib/copy";

interface Props {
  idea: IdeaVO;
  onToggle: () => void;
  onDoubleClickEdit: () => void;
  onDelete: () => void;
}

/**
 * 想法卡片 — 整行可拖 + dnd-kit 自带 layout 动画 + 完成态动画。
 * 不用 framer-motion 的 layout(与 dnd-kit transform 冲突)。
 */
export function IdeaItem({ idea, onToggle, onDoubleClickEdit, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: idea.id,
    animateLayoutChanges: defaultAnimateLayoutChanges,
  });

  const dndStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const stopDnd = {
    onPointerDown: (e: React.PointerEvent) => e.stopPropagation(),
  };

  return (
    <div
      ref={setNodeRef}
      style={dndStyle}
      {...attributes}
      {...listeners}
      onDoubleClick={onDoubleClickEdit}
      className={`group relative flex items-start gap-[var(--space-m)] rounded-[var(--radius-m)] border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-[var(--space-l)] py-[var(--space-m)] cursor-grab active:cursor-grabbing ${
        isDragging
          ? "z-10 scale-[1.02] shadow-[0_12px_32px_rgba(22,119,255,0.18)] border-[var(--color-primary)]"
          : "transition-shadow hover:shadow-md"
      } ${idea.completed ? "opacity-70" : ""}`}
    >
      {/* 完成圆圈 */}
      <button
        type="button"
        onClick={onToggle}
        {...stopDnd}
        aria-pressed={idea.completed}
        aria-label={idea.completed ? "标记未完成" : "标记完成"}
        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 cursor-pointer transition-all duration-200 ${
          idea.completed
            ? "border-[var(--color-success)] bg-[var(--color-success)] scale-105"
            : "border-[var(--color-text-secondary)] hover:border-[var(--color-success)] hover:scale-110"
        }`}
      >
        {idea.completed && (
          <motion.svg
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.2, ease: "backOut" }}
            width="12"
            height="12"
            viewBox="0 0 16 16"
            fill="none"
            className="text-white"
            aria-hidden
          >
            <path
              d="M3 8.5l3.5 3.5L13 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        )}
      </button>

      {/* 内容 */}
      <div
        className={`flex-1 select-text whitespace-pre-wrap break-words text-[15px] leading-relaxed transition-colors ${
          idea.completed
            ? "text-[var(--color-text-secondary)] line-through decoration-[var(--color-text-secondary)]/40"
            : "text-[var(--color-text-primary)]"
        }`}
        title="双击编辑"
      >
        {idea.content}
      </div>

      {/* 右上角删除 × */}
      <button
        type="button"
        onClick={onDelete}
        {...stopDnd}
        aria-label={COPY.delete}
        className="invisible -mt-1 -mr-2 grid h-9 w-9 shrink-0 place-items-center rounded-full text-[18px] text-[var(--color-text-secondary)] transition-all duration-150 hover:scale-110 hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)] group-hover:visible group-focus-within:visible"
      >
        ×
      </button>
    </div>
  );
}
