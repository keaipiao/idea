"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { DND_ACTIVATION_DISTANCE, REORDER_DEBOUNCE_MS } from "@/lib/copy";
import type { IdeaVO } from "@/lib/types";

interface Props {
  items: IdeaVO[];
  /** 立即同步更新本地顺序(乐观,卡片立刻跳到新位置) */
  onLocalReorder: (ids: number[]) => void;
  /** debounced 调 API 持久化新顺序 */
  onApiReorder: (ids: number[]) => Promise<void>;
  renderItem: (item: IdeaVO) => React.ReactNode;
}

/**
 * 可拖拽的想法子列表(未完成 / 已完成各一个,独立 SortableContext)。
 * PR-3 ADR-6 翻转 + ADR-14 + ADR-17(debounce 300ms)+ Outside voice H(useMemo items)
 *
 * @param items 当前区段的想法
 * @param onReorder 调 reorder API,由调用方做乐观更新 + 失败 revert
 */
export function SortableIdeaList({ items, onLocalReorder, onApiReorder, renderItem }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: DND_ACTIVATION_DISTANCE },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // useMemo 稳定 id 数组引用 — Outside voice H
  const ids = useMemo(() => items.map((i) => i.id), [items]);

  // debounce reorder API 调用 — ADR-17
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingIds = useRef<number[] | null>(null);

  // /review P1-I:unmount 时清 timer,防切项目后旧 ids 调 API
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
      pendingIds.current = null;
    };
  }, []);

  const scheduleApi = (nextIds: number[]) => {
    pendingIds.current = nextIds;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      const ids = pendingIds.current;
      if (!ids) return;
      pendingIds.current = null;
      void onApiReorder(ids).catch(() => {/* 由 onApiReorder 内部 toast */});
    }, REORDER_DEBOUNCE_MS);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(Number(active.id));
    const newIndex = ids.indexOf(Number(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(ids, oldIndex, newIndex);
    onLocalReorder(next);  // 立即更新本地顺序(乐观)
    scheduleApi(next);     // debounced 调 API
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul className="flex flex-col gap-[var(--space-m)]">
          {items.map((i) => (
            <li key={i.id}>{renderItem(i)}</li>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
