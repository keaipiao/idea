import { describe, expect, it, vi, beforeEach } from "vitest";
import { api, setReauthHandler } from "@/lib/api";
import { ApiError, ResultCode } from "@/lib/types";
import { LS_TOKEN_KEY } from "@/lib/copy";

const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>;

function mockJson(code: number, data: unknown, status = 200, errors?: string[]): Response {
  return new Response(JSON.stringify({ code, message: code === 0 ? "ok" : "fail", data, errors }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  fetchMock.mockReset();
  setReauthHandler(null);
});

describe("api()", () => {
  it("2xx + code=0 returns data", async () => {
    fetchMock.mockResolvedValueOnce(mockJson(0, { id: 1, name: "p" }));
    const r = await api<{ id: number; name: string }>("/api/projects");
    expect(r).toEqual({ id: 1, name: "p" });
  });

  it("code≠0 throws ApiError with code + errors", async () => {
    fetchMock.mockResolvedValueOnce(mockJson(ResultCode.PARAM_INVALID, null, 400, ["name: blank"]));
    await expect(api("/api/projects", { method: "POST", body: "{}" })).rejects.toMatchObject({
      code: ResultCode.PARAM_INVALID,
      errors: ["name: blank"],
    });
  });

  it("HTTP 4xx without JSON throws ApiError(status)", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("Not found", { status: 404, headers: { "content-type": "text/plain" } }),
    );
    await expect(api("/api/x")).rejects.toMatchObject({ code: 404 });
  });

  it("network error throws ApiError(isNetwork: true)", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    await expect(api("/api/x")).rejects.toMatchObject({ isNetwork: true });
  });

  it("attaches Authorization header when token in localStorage", async () => {
    localStorage.setItem(LS_TOKEN_KEY, "abc.def.ghi");
    fetchMock.mockResolvedValueOnce(mockJson(0, null));
    await api("/api/users/me");
    const calledWith = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const headers = calledWith.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer abc.def.ghi");
  });

  it("401 + reauth handler returns true → retries once and succeeds", async () => {
    fetchMock
      .mockResolvedValueOnce(mockJson(ResultCode.JWT_EXPIRED, null, 401))
      .mockResolvedValueOnce(mockJson(0, { id: 1 }));
    setReauthHandler(async () => true);
    const r = await api<{ id: number }>("/api/users/me");
    expect(r).toEqual({ id: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("CRITICAL — 401 twice in a row does NOT loop, throws after second", async () => {
    // 第一次 401 → reauth → 第二次仍 401:必须直接 throw,不再 reauth
    fetchMock
      .mockResolvedValueOnce(mockJson(ResultCode.JWT_EXPIRED, null, 401))
      .mockResolvedValueOnce(mockJson(ResultCode.JWT_EXPIRED, null, 401));
    const reauth = vi.fn(async () => true);
    setReauthHandler(reauth);
    await expect(api("/api/users/me")).rejects.toMatchObject({
      code: ResultCode.JWT_EXPIRED,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(reauth).toHaveBeenCalledTimes(1); // 仅 reauth 1 次
  });

  it("401 + reauth handler returns false throws original 401", async () => {
    fetchMock.mockResolvedValueOnce(mockJson(ResultCode.JWT_INVALID, null, 401));
    setReauthHandler(async () => false);
    await expect(api("/api/users/me")).rejects.toMatchObject({
      code: ResultCode.JWT_INVALID,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("401 without reauth handler throws", async () => {
    fetchMock.mockResolvedValueOnce(mockJson(ResultCode.JWT_MISSING, null, 401));
    await expect(api("/api/users/me")).rejects.toMatchObject({
      code: ResultCode.JWT_MISSING,
    });
  });

  it("2xx non-JSON returns undefined", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(null, { status: 204, headers: { "content-type": "text/plain" } }),
    );
    const r = await api("/api/ideas/1", { method: "DELETE" });
    expect(r).toBeUndefined();
  });

  it("absolute URL path is used as-is", async () => {
    fetchMock.mockResolvedValueOnce(mockJson(0, null));
    await api("https://other.example.com/x");
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://other.example.com/x");
  });

  it("sets Content-Type for POST body", async () => {
    fetchMock.mockResolvedValueOnce(mockJson(0, null));
    await api("/api/projects", { method: "POST", body: JSON.stringify({ name: "x" }) });
    const headers = fetchMock.mock.calls[0]?.[1].headers as Headers;
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("ApiError instance check", () => {
    const e = new ApiError(401, "x");
    expect(e).toBeInstanceOf(Error);
    expect(e).toBeInstanceOf(ApiError);
    expect(e.name).toBe("ApiError");
  });

  // /review P0-C 防 race:并发 N 个 401 请求只 reauth 一次
  it("CRITICAL — 并发 401 共享同一次 reauth (no race)", async () => {
    // 前 5 个 fetch 全 401;后 5 个 fetch 全成功
    // mockImplementation 按调用顺序分阶段
    let call = 0;
    fetchMock.mockImplementation(() => {
      call++;
      if (call <= 5) {
        return Promise.resolve(mockJson(ResultCode.JWT_EXPIRED, null, 401));
      }
      return Promise.resolve(mockJson(0, { ok: call }));
    });
    let reauthCalls = 0;
    setReauthHandler(async () => {
      reauthCalls++;
      await new Promise((r) => setTimeout(r, 10));
      return true;
    });
    const results = await Promise.all(
      Array.from({ length: 5 }, (_, i) => api<{ ok: number }>(`/api/x?${i}`)),
    );
    expect(results).toHaveLength(5);
    // singleton:5 个并发只 reauth 1 次
    expect(reauthCalls).toBe(1);
    // 总 fetch 10 次(5 个 401 + 5 个重试成功)
    expect(call).toBe(10);
  });
});
