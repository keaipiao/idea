import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  clearToken,
  ensureAuth,
  getToken,
  installIdleLogout,
  isTokenExpired,
  setToken,
} from "@/lib/auth";
import { LS_TOKEN_KEY, LS_EXPIRES_KEY } from "@/lib/copy";

const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>;

function mockLoginOk(): void {
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60).toISOString();
  fetchMock.mockResolvedValueOnce(
    new Response(
      JSON.stringify({
        code: 0,
        message: "ok",
        data: { token: "test.jwt", expiresAt, user: { id: 1, nickname: "dev", avatarUrl: null, createdAt: expiresAt } },
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    ),
  );
}

beforeEach(() => {
  fetchMock.mockReset();
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("token persistence", () => {
  it("setToken / getToken / clearToken roundtrip", () => {
    expect(getToken()).toBeNull();
    setToken("abc", new Date(Date.now() + 1000).toISOString());
    expect(getToken()).toBe("abc");
    expect(localStorage.getItem(LS_TOKEN_KEY)).toBe("abc");
    clearToken();
    expect(getToken()).toBeNull();
    expect(localStorage.getItem(LS_TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(LS_EXPIRES_KEY)).toBeNull();
  });

  it("isTokenExpired returns true when no expires", () => {
    expect(isTokenExpired()).toBe(true);
  });

  it("isTokenExpired returns true when past", () => {
    setToken("x", new Date(Date.now() - 1000).toISOString());
    expect(isTokenExpired()).toBe(true);
  });

  it("isTokenExpired returns false when future", () => {
    setToken("x", new Date(Date.now() + 60_000).toISOString());
    expect(isTokenExpired()).toBe(false);
  });
});

describe("ensureAuth — AuthMode 分支", () => {
  it("dev mode + no token → auto devLogin → ok", async () => {
    mockLoginOk();
    const r = await ensureAuth("dev");
    expect(r).toBe("ok");
    expect(getToken()).toBe("test.jwt");
  });

  it("dev mode + valid token → ok (no fetch)", async () => {
    setToken("existing", new Date(Date.now() + 60_000).toISOString());
    const r = await ensureAuth("dev");
    expect(r).toBe("ok");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("dev mode + login fails → failed", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("net down"));
    const r = await ensureAuth("dev");
    expect(r).toBe("failed");
  });

  it("wechat mode + no token → login (no fetch)", async () => {
    const r = await ensureAuth("wechat");
    expect(r).toBe("login");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("wechat mode + valid token → ok", async () => {
    setToken("existing", new Date(Date.now() + 60_000).toISOString());
    const r = await ensureAuth("wechat");
    expect(r).toBe("ok");
  });

  it("none mode + no token → login", async () => {
    const r = await ensureAuth("none");
    expect(r).toBe("login");
  });
});

describe("installIdleLogout", () => {
  it("triggers onLogout after IDLE_LOGOUT_MS without activity", async () => {
    vi.useFakeTimers();
    const onLogout = vi.fn();
    setToken("x", new Date(Date.now() + 60 * 60_000).toISOString());

    const cleanup = installIdleLogout(onLogout);
    expect(onLogout).not.toHaveBeenCalled();

    vi.advanceTimersByTime(30 * 60 * 1000);
    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(getToken()).toBeNull();

    cleanup();
  });

  it("resets timer on mousemove", async () => {
    vi.useFakeTimers();
    const onLogout = vi.fn();
    setToken("x", new Date(Date.now() + 60 * 60_000).toISOString());

    const cleanup = installIdleLogout(onLogout);

    vi.advanceTimersByTime(20 * 60 * 1000); // 20min
    window.dispatchEvent(new Event("mousemove"));
    vi.advanceTimersByTime(20 * 60 * 1000); // 又 20min,total 40min,但中间 reset

    // 只走了 reset 后 20min,没到 30min → 未 logout
    expect(onLogout).not.toHaveBeenCalled();

    cleanup();
  });
});
