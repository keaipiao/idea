/**
 * API 客户端 fetch 包装。
 * 详 docs/01-想法记录MVP/PR-3/01-设计.md § 4.4。
 *
 * 行为:
 * - 自动加 Authorization: Bearer {token} header(若存在 token)
 * - 2xx + Result.code=0 → 返回 data
 * - 2xx + Result.code≠0 → throw ApiError
 * - 4xx/5xx HTTP → throw ApiError
 * - 401001/2/3 → 触发 onUnauthorized 重新拿 token + 一次性重试;**第二次仍 401 直接 throw 防死循环**
 * - 网络中断 / abort → throw ApiError(isNetwork: true)
 *
 * PR-3 ADR-4 / ADR-15 / ADR-21
 */

import { ApiError, type ApiResult, ResultCode } from "./types";
import { LS_TOKEN_KEY } from "./copy";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

/** 401 自动重新登录的回调,由 auth.ts 在初始化时挂钩。返回 true = 已拿新 token 可重试 */
type ReauthHandler = () => Promise<boolean>;
let reauthHandler: ReauthHandler | null = null;
export function setReauthHandler(h: ReauthHandler | null): void {
  reauthHandler = h;
}

/**
 * 并发 401 风暴防御(/review P0-C):
 * 同时刻多请求 401 → 共享同一个 reauth Promise,避免 N 次 devLogin race。
 */
let inflightReauth: Promise<boolean> | null = null;
function reauthOnce(): Promise<boolean> {
  if (!reauthHandler) return Promise.resolve(false);
  if (inflightReauth) return inflightReauth;
  inflightReauth = reauthHandler().finally(() => {
    inflightReauth = null;
  });
  return inflightReauth;
}

/** 读 token(SSR / 测试环境 localStorage 缺失时返 null) */
function readToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(LS_TOKEN_KEY);
  } catch {
    return null;
  }
}

/** 判定 code 是否 JWT 401 三档 */
function isJwt401(code: number): boolean {
  return (
    code === ResultCode.JWT_EXPIRED ||
    code === ResultCode.JWT_INVALID ||
    code === ResultCode.JWT_MISSING
  );
}

/** 内部 fetch 一次。不做 reauth 重试,由上层 api() 决定 */
async function fetchOnce<T>(path: string, init?: RequestInit): Promise<T> {
  const token = readToken();
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // /review P1-L:同源 same-origin 不需 include;跨域时后端 CORS 已显式 allowCredentials
  // dev → cross-origin localhost:3000 → localhost:8080,prod → same-origin /api 反代
  const credentials: RequestCredentials = url.startsWith("/") || url.startsWith(API_BASE)
    ? "same-origin"
    : "include";
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers, credentials });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "network error";
    throw new ApiError(0, msg, { isNetwork: true });
  }

  // HTTP 非 2xx + 非 JSON 响应 → 直接报 HTTP 错(不解析 Result)
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    if (!res.ok) {
      throw new ApiError(res.status, `HTTP ${res.status}`, {});
    }
    // 2xx 但非 JSON(如 DELETE 204)— 返 undefined as T
    return undefined as T;
  }

  let body: ApiResult<T>;
  try {
    body = (await res.json()) as ApiResult<T>;
  } catch {
    throw new ApiError(res.status, "invalid JSON response", {});
  }

  // 业务码非 0 → 错
  if (body.code !== ResultCode.SUCCESS) {
    throw new ApiError(body.code, body.message ?? "API error", { errors: body.errors });
  }

  return body.data as T;
}

/**
 * 主 API 调用。带一次性 401 重试。
 *
 * 死循环防御(关键):reauth 后**最多重试 1 次**。第二次仍 401 直接 throw。
 */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    return await fetchOnce<T>(path, init);
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    if (!isJwt401(e.code)) throw e;

    // P0-C:并发 401 共享同一次 reauth
    const ok = await reauthOnce();
    if (!ok) throw e;

    // 重试一次 — 失败直接抛(不再 reauth)
    return await fetchOnce<T>(path, init);
  }
}

/** 测试/dev 用:重置 base URL(避免 hardcode 测试环境) */
export function getApiBase(): string {
  return API_BASE;
}
