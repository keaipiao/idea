"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

interface ModalContextValue {
  openModal: (node: React.ReactNode) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

/**
 * Modal 顶层 Portal + Context。PR-3 ADR-19 + /review P1-J 修法。
 * 同时刻仅 1 个 modal,Esc 关闭。
 * 加 focus restoration + 仅在背景按下且松开时关(防文本拖选误关)。
 */
export function ModalRoot({ children }: { children: React.ReactNode }) {
  const [node, setNode] = useState<React.ReactNode>(null);
  const [mounted, setMounted] = useState(false);
  const previousFocus = useRef<HTMLElement | null>(null);
  // P1-J:track 鼠标按下位置,防文本拖选松开时误判背景点击
  const pressedOnBackdrop = useRef(false);

  useEffect(() => setMounted(true), []);

  const openModal = useCallback((n: React.ReactNode) => {
    // 保存 modal 打开前的焦点,关闭时恢复
    if (typeof document !== "undefined") {
      previousFocus.current = document.activeElement as HTMLElement | null;
    }
    setNode(n);
  }, []);

  const closeModal = useCallback(() => {
    setNode(null);
    // 焦点恢复
    setTimeout(() => previousFocus.current?.focus(), 0);
  }, []);

  // Esc 关
  useEffect(() => {
    if (!node) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [node, closeModal]);

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      {mounted && createPortal(
        <AnimatePresence>
          {node && (
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm"
              onMouseDown={(e) => {
                pressedOnBackdrop.current = e.target === e.currentTarget;
              }}
              onMouseUp={(e) => {
                if (pressedOnBackdrop.current && e.target === e.currentTarget) {
                  closeModal();
                }
                pressedOnBackdrop.current = false;
              }}
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0, y: 8 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 4 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {node}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </ModalContext.Provider>
  );
}

export function useModal(): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal 必须在 <ModalRoot> 内调用");
  return ctx;
}
