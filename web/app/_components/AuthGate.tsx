"use client";

import { useEffect, useState } from "react";
import {
  AUTH_FAILED_EVENT,
  clearToken,
  ensureAuth,
  installIdleLogout,
  installReauthHandler,
} from "@/lib/auth";
import { getAuthMode } from "@/lib/types";
import { COPY } from "@/lib/copy";

type Status = "checking" | "ready" | "need-login" | "failed";

/**
 * 鉴权门:子组件渲染前确保有 token。
 * PR-3 ADR-1 / ADR-16 / ADR-18 + /review P0-D / P1-E / P1-F 修法
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("checking");

  // 装 reauth handler 一次(P0-D:每次 mount 重装,closure 永远拿最新 mode)
  useEffect(() => {
    installReauthHandler();
  }, []);

  // 鉴权检查
  useEffect(() => {
    let canceled = false;
    void (async () => {
      const r = await ensureAuth(getAuthMode());
      if (canceled) return;
      if (r === "ok") setStatus("ready");
      else if (r === "login") setStatus("need-login");
      else setStatus("failed");
    })();
    return () => {
      canceled = true;
    };
  }, []);

  // idle 30min 自动 clearToken + setStatus(P1-E:每次 mount 独立 install + 完整 cleanup)
  useEffect(() => {
    const cleanup = installIdleLogout(() => {
      setStatus("need-login");
    });
    return cleanup;
  }, []);

  // 监听全局 auth failed(P0-D:reauth handler 失败时设状态)
  useEffect(() => {
    const onAuthFailed = () => setStatus("need-login");
    window.addEventListener(AUTH_FAILED_EVENT, onAuthFailed);
    return () => window.removeEventListener(AUTH_FAILED_EVENT, onAuthFailed);
  }, []);

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-[var(--color-text-secondary)]">{COPY.loading}</div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-[var(--space-l)]">
        <div className="text-[var(--color-danger)]">{COPY.authLoginFailed}</div>
        <button
          type="button"
          onClick={() => location.reload()}
          className="rounded-[var(--radius-s)] bg-[var(--color-primary)] px-[var(--space-l)] py-[var(--space-s)] text-white"
        >
          {COPY.retry}
        </button>
      </div>
    );
  }

  if (status === "need-login") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-[var(--space-l)]">
        <div className="text-2xl font-semibold">{COPY.appName}</div>
        <div className="text-[var(--color-text-secondary)]">{COPY.authWechatPlaceholder}</div>
        <button
          type="button"
          onClick={() => {
            clearToken();
            location.reload();
          }}
          className="text-sm text-[var(--color-text-secondary)] underline"
        >
          {COPY.retry}
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
