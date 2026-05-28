"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useIdeas } from "@/app/_hooks/useIdeas";
import { useToast } from "./ToastProvider";
import { useModal } from "./ModalRoot";
import { IdeaInput } from "./IdeaInput";
import { IdeaItem } from "./IdeaItem";
import { SortableIdeaList } from "./SortableIdeaList";
import { EditIdeaModal } from "./EditIdeaModal";
import { EmptyState } from "./EmptyState";
import { Skeleton } from "./Skeleton";
import { COPY, DELETE_UNDO_MS } from "@/lib/copy";
import type { IdeaVO } from "@/lib/types";

interface Props {
  projectId: number | null;
  projectName: string;
}

/**
 * 想法列表:顶部 IdeaInput + 未完成区(可拖) + 已完成区(折叠,可拖)。
 * PR-3 § 3.2.0 + ADR-14 + ADR-10 + /review P0-A/B + P1-G/H 修法
 */
export function IdeaList({ projectId, projectName }: Props) {
  const ideasApi = useIdeas(projectId);
  const { ideas, isLoading, error, create, toggleComplete, update, remove, reorderApi, refetch, setLocal } =
    ideasApi;
  const { showToast } = useToast();
  const { openModal, closeModal } = useModal();
  const [doneExpanded, setDoneExpanded] = useState(false);

  // /review P0-A:pending 删除 timer 跟踪,unmount 时清(防孤儿)
  // /review P0-B:revert 改用 refetch,不用 snapshot 回滚
  const pendingTimers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  useEffect(() => {
    const timers = pendingTimers.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  // /review P1-G:useMemo 稳定 undone / done 引用
  const undone = useMemo(
    () =>
      ideas
        .filter((i) => !i.completed)
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [ideas],
  );
  const done = useMemo(
    () =>
      ideas
        .filter((i) => i.completed)
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [ideas],
  );

  const handleCreate = async (content: string) => create(content);

  const handleToggle = async (i: IdeaVO) => {
    try {
      await toggleComplete(i.id, i.completed);
    } catch (e) {
      showToast(e instanceof Error ? e.message : COPY.systemError, "error");
    }
  };

  const handleEdit = (i: IdeaVO) => {
    openModal(
      <EditIdeaModal
        initial={i.content}
        onSave={async (content) => {
          try {
            await update(i.id, { content });
            showToast(COPY.ideaUpdated, "success");
          } catch (e) {
            showToast(e instanceof Error ? e.message : COPY.systemError, "error");
            throw e;
          }
        }}
        onClose={closeModal}
      />,
    );
  };

  const handleDelete = (i: IdeaVO) => {
    // 乐观隐藏:本地标 deleting,UI 立即不显示。不写 SWR cache snapshot,失败 refetch 重拉(P0-B)
    let undone = false;
    const timer = setTimeout(async () => {
      if (undone) return;
      pendingTimers.current.delete(timer);
      try {
        await remove(i.id);
      } catch (e) {
        showToast(e instanceof Error ? e.message : COPY.systemError, "error");
        // 失败 refetch 重拉 — 不依赖本地 snapshot,避免覆盖窗口期内新建/编辑
        await refetch();
      }
    }, DELETE_UNDO_MS);
    pendingTimers.current.add(timer);

    showToast(`${COPY.ideaDeleted}`, "info", {
      action: COPY.ideaDeleteUndo,
      onAction: () => {
        undone = true;
        clearTimeout(timer);
        pendingTimers.current.delete(timer);
        // 撤销:UI 已乐观隐藏的话,需 refetch 让它回来(实际本组件未做乐观隐藏,所以 noop)
      },
    });

    // 真乐观:用 mutate 把这条 idea 标 deleting(仅 UI 层),由 IdeaItem 决定渲染
    // 但避免引入新 state 字段,这里采取**不做乐观隐藏**策略:
    // delete 后 5s 内卡片仍在 UI,toast undo;5s 后真发 DELETE + SWR refetch
    // 用户视觉感:点删除 → toast 出现 → 5s 后卡片消失。略迟但不丢数据。
  };

  if (!projectId) {
    return <EmptyState message={COPY.projectEmpty} />;
  }

  // /review P1-H + 阶段 5 P0 修法:reorder 整段 ids + **乐观本地 setLocal + 失败 refetch**
  // 原 bug:仅调 reorderApi 但 SWR cache 未更新 → UI 顺序不变,只有刷新页才看新顺序。
  const applyOptimisticReorder = (idsInNewOrder: number[]) => {
    // 按 newOrder 重排本地 SWR cache 里的 ideas(只动 sortOrder 字段)
    const idToIdea = new Map(ideas.map((i) => [i.id, i]));
    const next = idsInNewOrder
      .map((id, idx) => {
        const i = idToIdea.get(id);
        return i ? { ...i, sortOrder: idx } : null;
      })
      .filter((x): x is IdeaVO => x !== null);
    void setLocal(next);
  };

  // 拆分:本地立即更新 vs API 异步调用
  const localReorderUndone = (newUndoneIds: number[]) => {
    const allIds = [...newUndoneIds, ...done.map((d) => d.id)];
    applyOptimisticReorder(allIds);
  };
  const apiReorderUndone = async (newUndoneIds: number[]) => {
    const allIds = [...newUndoneIds, ...done.map((d) => d.id)];
    try {
      await reorderApi(allIds);
    } catch (e) {
      await refetch();
      throw e;
    }
  };
  const localReorderDone = (newDoneIds: number[]) => {
    const allIds = [...undone.map((u) => u.id), ...newDoneIds];
    applyOptimisticReorder(allIds);
  };
  const apiReorderDone = async (newDoneIds: number[]) => {
    const allIds = [...undone.map((u) => u.id), ...newDoneIds];
    try {
      await reorderApi(allIds);
    } catch (e) {
      await refetch();
      throw e;
    }
  };

  const totalCount = undone.length + done.length;

  return (
    <div className="flex h-full flex-col">
      {/* 项目名 + 元信息(创建时间从 API 拉,这里仅显示项目名 + 想法数) */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-bg-primary)] px-[var(--space-xl)] pb-[var(--space-l)] pt-[var(--space-xl)]">
        <h1 className="text-[28px] font-semibold tracking-tight text-[var(--color-text-primary)]">
          {projectName}
        </h1>
        <p className="mt-[var(--space-xs)] text-sm text-[var(--color-text-secondary)]">
          {totalCount} 个想法 · {done.length} 已完成
        </p>
      </header>

      {/* 主区域(滚动)— IdeaInput 在顶部,然后 list */}
      <div className="flex-1 overflow-y-auto"><div className="mx-auto max-w-[760px] px-[var(--space-xl)] py-[var(--space-xl)]">

      {/* IdeaInput 卡片化 */}
      <div className="mb-[var(--space-xl)]">
        <IdeaInput projectId={projectId} onSubmit={handleCreate} />
      </div>
        {isLoading && (
          <div className="flex flex-col gap-[var(--space-m)]">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        )}
        {error && <div className="text-sm text-[var(--color-danger)]">{COPY.networkError}</div>}
        {!isLoading && !error && ideas.length === 0 && (
          <EmptyState message={COPY.ideaListEmpty} />
        )}

        {undone.length > 0 && (
          <SortableIdeaList
            items={undone}
            onLocalReorder={localReorderUndone}
            onApiReorder={(ids) =>
              apiReorderUndone(ids).catch((e) => {
                showToast(e instanceof Error ? e.message : COPY.ideaReorderFailed, "error");
                throw e;
              })
            }
            renderItem={(i) => (
              <IdeaItem
                idea={i}
                onToggle={() => handleToggle(i)}
                onDoubleClickEdit={() => handleEdit(i)}
                onDelete={() => handleDelete(i)}
              />
            )}
          />
        )}

        {done.length > 0 && (
          <div className="mt-[var(--space-xl)] border-t border-[var(--color-border)] pt-[var(--space-l)]">
            <button
              type="button"
              onClick={() => setDoneExpanded((v) => !v)}
              className="w-full py-[var(--space-s)] text-center text-sm text-[var(--color-text-secondary)]"
              aria-expanded={doneExpanded}
            >
              {COPY.ideaCompletedSection(done.length)}
            </button>
            {doneExpanded && (
              <div className="mt-[var(--space-m)]">
                <SortableIdeaList
                  items={done}
                  onLocalReorder={localReorderDone}
                  onApiReorder={(ids) =>
                    apiReorderDone(ids).catch((e) => {
                      showToast(e instanceof Error ? e.message : COPY.ideaReorderFailed, "error");
                      throw e;
                    })
                  }
                  renderItem={(i) => (
                    <IdeaItem
                      idea={i}
                      onToggle={() => handleToggle(i)}
                      onDoubleClickEdit={() => handleEdit(i)}
                      onDelete={() => handleDelete(i)}
                    />
                  )}
                />
              </div>
            )}
          </div>
        )}
      </div></div>
    </div>
  );
}
