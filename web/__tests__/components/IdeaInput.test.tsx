import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { IdeaInput } from "@/app/_components/IdeaInput";
import { ToastProvider } from "@/app/_components/ToastProvider";
import { COPY, IDEA_CONTENT_MAX } from "@/lib/copy";

function renderWithToast(node: React.ReactNode) {
  return render(<ToastProvider>{node}</ToastProvider>);
}

describe("IdeaInput", () => {
  it("Enter 触发 submit + 清空", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderWithToast(<IdeaInput projectId={1} onSubmit={onSubmit} />);
    const ta = screen.getByRole("textbox") as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: "hello world" } });
    fireEvent.keyDown(ta, { key: "Enter" });
    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledWith("hello world"));
    expect(ta.value).toBe("");
  });

  it("Shift+Enter 不触发 submit(换行)", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderWithToast(<IdeaInput projectId={1} onSubmit={onSubmit} />);
    const ta = screen.getByRole("textbox") as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: "x" } });
    fireEvent.keyDown(ta, { key: "Enter", shiftKey: true });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("失败时回填内容", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("boom"));
    renderWithToast(<IdeaInput projectId={1} onSubmit={onSubmit} />);
    const ta = screen.getByRole("textbox") as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: "保留" } });
    fireEvent.keyDown(ta, { key: "Enter" });
    await vi.waitFor(() => expect(ta.value).toBe("保留"));
  });

  it("无 projectId 时 disabled + 占位符提示", () => {
    const onSubmit = vi.fn();
    renderWithToast(<IdeaInput projectId={null} onSubmit={onSubmit} />);
    const ta = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(ta).toBeDisabled();
    expect(ta.placeholder).toBe(COPY.ideaInputNoProject);
  });

  it("超字数时计数变红 + 按钮 disabled", () => {
    const onSubmit = vi.fn();
    renderWithToast(<IdeaInput projectId={1} onSubmit={onSubmit} />);
    const ta = screen.getByRole("textbox");
    fireEvent.change(ta, { target: { value: "x".repeat(IDEA_CONTENT_MAX + 10) } });
    const btn = screen.getByRole("button", { name: /发送/ });
    expect(btn).toBeDisabled();
  });

  it("空白字符串不触发 submit", () => {
    const onSubmit = vi.fn();
    renderWithToast(<IdeaInput projectId={1} onSubmit={onSubmit} />);
    const ta = screen.getByRole("textbox");
    fireEvent.change(ta, { target: { value: "   " } });
    fireEvent.keyDown(ta, { key: "Enter" });
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
