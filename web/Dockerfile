# IdeaBox Web — Next.js 16 standalone 多阶段构建
# 详 docs/01-想法记录MVP/PR-3/01-设计.md § 4.7
#
# build:
#   docker build \
#     --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.idea.example.com \
#     --build-arg NEXT_PUBLIC_AUTH_MODE=wechat \
#     -t ideabox-web:tag ./web
#
# ⚠️ NEXT_PUBLIC_* 必须 build-time inline,docker run -e 改不动已 build 的 image
# ⚠️ 每环境(dev/staging/prod)各 build 一个镜像,镜像不可跨环境共享
# ⚠️ standalone 模式必须 3 处 COPY,漏一个 → 生产 0 CSS / 静态 404

# Stage 1: 依赖安装
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Stage 2: 构建
FROM node:22-alpine AS builder
WORKDIR /app
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_AUTH_MODE=wechat
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_AUTH_MODE=$NEXT_PUBLIC_AUTH_MODE
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: 运行
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# 非 root 用户(安全)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# standalone 3 处 COPY(顺序:先 standalone bundle,再 static,再 public)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

# Next.js standalone server.js(代替 next start,镜像更小)
CMD ["node", "server.js"]
