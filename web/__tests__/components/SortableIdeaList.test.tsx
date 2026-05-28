import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import { SortableIdeaList } from "@/app/_components/SortableIdeaList";
import type { IdeaVO } from "@/lib/types";
import { REORDER_DEBOUNCE_MS } from "@/lib/copy";

function mkIdea(id: number, sortOrder: number): IdeaVO {
  return {
    id,
    projectId: 1,
    content: `idea ${id}`,
    completed: false,
    completedAt: null,
    sortOrder,
    createdAt: "2026-01-01T00:00:00",
    updatedAt: "2026-01-01T00:00:00",
  };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("SortableIdeaList", () => {
  it("渲染所有 items", () => {
    const items = [mkIdea(1, 1), mkIdea(2, 2), mkIdea(3, 3)];
    const { container } = render(
      <SortableIdeaList
        items={items}
        onLocalReorder={vi.fn()} onApiReorder={vi.fn().mockResolvedValue(undefined)}
        renderItem={(i) => <div data-testid={`idea-${i.id}`}>{i.content}</div>}
      />,
    );
    expect(container.querySelectorAll("[data-testid^='idea-']")).toHaveLength(3);
  });

  it("空 items 渲染空 ul", () => {
    const { container } = render(
      <SortableIdeaList
        items={[]}
        onLocalReorder={vi.fn()} onApiReorder={vi.fn().mockResolvedValue(undefined)}
        renderItem={(i) => <div>{i.content}</div>}
      />,
    );
    expect(container.querySelector("ul")?.children).toHaveLength(0);
  });

  // P1-I 测试:unmount 时 clearTimeout
  it("unmount 后不再触发 pending onApiReorder", () => {
    const onApiReorder = vi.fn().mockResolvedValue(undefined);
    const { unmount } = render(
      <SortableIdeaList
        items={[mkIdea(1, 1), mkIdea(2, 2)]}
        onLocalReorder={vi.fn()}
        onApiReorder={onApiReorder}
        renderItem={(i) => <div>{i.content}</div>}
      />,
    );
    unmount();
    act(() => {
      vi.advanceTimersByTime(REORDER_DEBOUNCE_MS + 50);
    });
    expect(onApiReorder).not.toHaveBeenCalled();
  });
});
