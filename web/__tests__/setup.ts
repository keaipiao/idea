/// <reference types="vitest/globals" />
import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// 每个 test 后清 DOM(避免组件 mount 互相干扰)
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

// 默认 mock fetch(每个 test 按需 override)
global.fetch = vi.fn();
