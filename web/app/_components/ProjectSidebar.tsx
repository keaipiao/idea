"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useProjects } from "@/app/_hooks/useProjects";
import { useToast } from "./ToastProvider";
import { useModal } from "./ModalRoot";
import { ConfirmModal } from "./ConfirmModal";
import { RenameModal } from "./RenameModal";
import { COPY, PROJECT_NAME_MAX } from "@/lib/copy";
import type { ProjectVO } from "@/lib/types";
import { EmptyState } from "./EmptyState";
import { Skeleton } from "./Skeleton";

interface Props {
  currentId: number | null;
}

/**
 * 左侧栏:项目列表 + 新建 + 长按弹菜单(重命名 / 删除)。
 * PR-3 § 3.2.0 + § 3.5.1 + /review P2-O 修法(Modal 替代 prompt/confirm + click-outside 关菜单)
 */
export function ProjectSidebar({ currentId }: Props) {
  const router = useRouter();
  const { projects, isLoading, error, create, update, remove } = useProjects();
  const { showToast } = useToast();
  const { openModal, closeModal } = useModal();
  const [newName, setNewName] = useState("");
  const [menuFor, setMenuFor] = useState<number | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // /review P2-O:click-outside 关菜单
  useEffect(() => {
    if (menuFor === null) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuFor(null);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuFor]);

  // unmount 清 long press timer
  useEffect(() => {
    return () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };
  }, []);

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    try {
      await create(trimmed);
      setNewName("");
      showToast(COPY.projectCreated, "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : COPY.systemError, "error");
    }
  };

  const startLongPress = (id: number) => {
    longPressTimer.current = setTimeout(() => setMenuFor(id), 500);
  };
  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleRename = (p: ProjectVO) => {
    setMenuFor(null);
    openModal(
      <RenameModal
        initial={p.name}
        title={COPY.projectMenuRename}
        onSave={async (val) => {
          if (val === p.name) return;
          try {
            await update(p.id, { name: val.slice(0, PROJECT_NAME_MAX) });
          } catch (e) {
            showToast(e instanceof Error ? e.message : COPY.systemError, "error");
            throw e;
          }
        }}
        onClose={closeModal}
      />,
    );
  };

  const handleDelete = (p: ProjectVO) => {
    setMenuFor(null);
    openModal(
      <ConfirmModal
        title={COPY.projectMenuDelete}
        message={COPY.projectDeleteConfirm}
        danger
        onConfirm={async () => {
          try {
            await remove(p.id);
            showToast(COPY.projectDeleted, "success");
            if (currentId === p.id) router.push("/");
          } catch (e) {
            showToast(e instanceof Error ? e.message : COPY.systemError, "error");
            throw e;
          }
        }}
        onClose={closeModal}
      />,
    );
  };

  return (
    <aside className="flex h-full flex-col gap-[var(--space-l)] border-r border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-[var(--space-l)] py-[var(--space-xl)]">
      <div className="flex items-center gap-[var(--space-s)]">
        <div className="grid h-8 w-8 place-items-center rounded-[var(--radius-m)] bg-[var(--color-primary)] text-base font-semibold text-white">
          I
        </div>
        <div className="text-lg font-semibold tracking-tight">{COPY.appName}</div>
      </div>

      <div className="flex gap-[var(--space-s)]">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value.slice(0, PROJECT_NAME_MAX))}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder={COPY.projectNewPlaceholder}
          aria-label={COPY.projectNewPlaceholder}
          maxLength={PROJECT_NAME_MAX}
          className="flex-1 rounded-[var(--radius-s)] border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-[var(--space-m)] py-[var(--space-s)] text-sm placeholder:text-[var(--color-text-secondary)]"
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={!newName.trim()}
          className="grid h-9 w-9 place-items-center rounded-[var(--radius-s)] bg-[var(--color-primary)] text-lg font-medium text-white shadow-sm transition-opacity disabled:opacity-40"
          aria-label={COPY.projectNew}
        >
          +
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto -mx-[var(--space-s)] px-[var(--space-s)]" aria-label="项目列表">
        {isLoading && (
          <div className="flex flex-col gap-[var(--space-s)]">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        )}
        {error && (
          <div className="text-sm text-[var(--color-danger)]">{COPY.networkError}</div>
        )}
        {!isLoading && !error && projects.length === 0 && (
          <EmptyState message={COPY.projectEmpty} />
        )}
        <ul className="flex flex-col gap-[var(--space-xs)]">
          {projects.map((p) => {
            const isCurrent = p.id === currentId;
            return (
              <li key={p.id} className="relative">
                <button
                  type="button"
                  onClick={() => router.push(`/projects/${p.id}`)}
                  onMouseDown={() => startLongPress(p.id)}
                  onMouseUp={cancelLongPress}
                  onMouseLeave={cancelLongPress}
                  onTouchStart={() => startLongPress(p.id)}
                  onTouchEnd={cancelLongPress}
                  aria-current={isCurrent ? "page" : undefined}
                  className={`w-full rounded-[var(--radius-m)] px-[var(--space-m)] py-[var(--space-s)] text-left text-sm transition-colors ${
                    isCurrent
                      ? "bg-[var(--color-primary)] font-medium text-white"
                      : "text-[var(--color-text-primary)] hover:bg-[var(--color-bg-primary)]"
                  }`}
                >
                  {p.name}
                </button>
                {menuFor === p.id && (
                  <div
                    ref={menuRef}
                    className="absolute right-0 top-full z-20 mt-1 flex flex-col rounded-[var(--radius-s)] border border-[var(--color-border)] bg-[var(--color-bg-primary)] shadow"
                  >
                    <button
                      type="button"
                      onClick={() => handleRename(p)}
                      className="px-[var(--space-m)] py-[var(--space-s)] text-left text-sm hover:bg-[var(--color-bg-secondary)]"
                    >
                      {COPY.projectMenuRename}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p)}
                      className="px-[var(--space-m)] py-[var(--space-s)] text-left text-sm text-[var(--color-danger)] hover:bg-[var(--color-bg-secondary)]"
                    >
                      {COPY.projectMenuDelete}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
