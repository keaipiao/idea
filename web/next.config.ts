import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone:产出最小自包含运行目录(.next/standalone/server.js),用于 Docker
  // 详 docs/01-想法记录MVP/PR-3/01-设计.md § 4.7
  output: "standalone",

  // 严格 React 检查
  reactStrictMode: true,
};

export default nextConfig;
