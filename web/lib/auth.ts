/**
 * 鉴权:token 持久化 + dev login + AUTH_MODE 分支 + idle 30min 自动登出。
 * PR-3 § 4.4 + ADR-5 + ADR-16 + ADR-18 + ADR-21
 */

import { api, setReauthHandler } from "./api";
import { LS_TOKEN_KEY, LS_EXPIRES_KEY, IDLE_LOGOUT_MS } from "./copy";
import { type AuthMode, type LoginResponse, getAuthMode } from "./types";

/* ---------- token 持久化 ---------- */

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(LS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string, expiresAt: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_TOKEN_KEY, token);
  localStorage.setItem(LS_EXPIRES_KEY, expiresAt);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LS_TOKEN_KEY);
  localStorage.removeItem(LS_EXPIRES_KEY);
}

export function isTokenExpired(): boolean {
  if (typeof window === "undefined") return true;
  const expiresAt = localStorage.getItem(LS_EXPIRES_KEY);
  if (!expiresAt) return true;
  try {
    return new Date(expiresAt).getTime() <= Date.now();
  } catch {
    return true;
  }
}

/* ---------- dev login ---------- */

export async function devLogin(userId?: number): Promise<LoginResponse> {
  const body = userId ? { userId } : {};
  const r = await api<LoginResponse>("/api/auth/login/dev", {
    method: "POST",
    body: JSON.stringify(body),
  });
  setToken(r.token, r.expiresAt);
  return r;
}

/* ---------- ensureAuth(按 mode 分支) ---------- */

/**
 * 确保有可用 token。返回:
 * - 'ok'    已有 token,继续业务
 * - 'login' 需要走 login 流程(UI 显登录页 / 占位页)
 * - 'failed' 自动登录失败
 */
export type AuthResult = "ok" | "login" | "failed";

export async function ensureAuth(mode: AuthMode = getAuthMode()): Promise<AuthResult> {
  if (typeof window === "undefined") return "login";

  // 已有有效 token
  if (getToken() && !isTokenExpired()) return "ok";

  // dev 模式:自动登录种子用户
  if (mode === "dev") {
    try {
      await devLogin();
      return "ok";
    } catch {
      return "failed";
    }
  }

  // wechat / none:不自动登录,显示登录 UI
  return "login";
}

/* ---------- reauth handler 装配(给 api.ts 用) ---------- */

/** /review P0-D 修法:全局事件名,reauth 失败时 dispatch,AuthGate 监听重设状态 */
export const AUTH_FAILED_EVENT = "ideabox:auth-failed";

/**
 * 装 reauth handler。reauth 失败时 dispatch AUTH_FAILED_EVENT。
 * 每次调用都覆盖(支持 AUTH_MODE 切换 / cleanup 后重装)。
 */
export function installReauthHandler(): void {
  setReauthHandler(async () => {
    // 每次调动态读 mode,不冻结 closure(P0-D)
    const mode = getAuthMode();
    if (mode !== "dev") {
      clearToken();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(AUTH_FAILED_EVENT));
      }
      return false;
    }
    try {
      await devLogin();
      return true;
    } catch {
      clearToken();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(AUTH_FAILED_EVENT));
      }
      return false;
    }
  });
}

/* ---------- idle timer(ADR-18 XSS 缓解:30min 无操作自动 clearToken) ---------- */

/**
 * 启动 idle 监听。任何 mousemove / keydown / scroll / click 重置 30min 计时器。
 * 返回 cleanup 函数。
 *
 * /review P1-E 修法:不用 module-level flag,每次 mount 完全独立装/卸,
 * 避免 StrictMode 双 mount 时第二次 install noop 导致 listeners 全丢。
 */
export function installIdleLogout(onLogout: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  let timer: ReturnType<typeof setTimeout> | null = null;
  const reset = (): void => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      clearToken();
      onLogout();
    }, IDLE_LOGOUT_MS);
  };

  const events: Array<keyof WindowEventMap> = [
    "mousemove",
    "keydown",
    "click",
    "scroll",
    "touchstart",
  ];
  events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
  reset();

  return () => {
    if (timer) clearTimeout(timer);
    timer = null;
    events.forEach((e) => window.removeEventListener(e, reset));
  };
}
