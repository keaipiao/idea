# IdeaBox · 想法记录 MVP

> 一款轻量级想法捕捉工具 — 微信小程序 + 网页端,按项目维度组织想法,支持语音/文字输入,多端同步。
> 详细设计:[docs/01-想法记录MVP/](docs/01-想法记录MVP/)

---

## 项目状态

| 模块 | 状态 | 文档 |
|---|---|---|
| **PR-1** 后端脚手架 + DB + REST API + 开发期 JWT | ✅ 2026-05-28 v0.1.1(hotfix from v0.1.0) | [docs/01-想法记录MVP/PR-1/](docs/01-想法记录MVP/PR-1/) |
| **PR-3** 网页端前端 + 拖拽 + 动画 + nginx 反代 | ✅ 2026-05-28 v0.2.0 | [docs/01-想法记录MVP/PR-3/](docs/01-想法记录MVP/PR-3/) |
| **PR-2** 小程序前端 | ⏸ 待启动 | [PR-2/](docs/01-想法记录MVP/PR-2/) |
| **PR-4** 微信登录(unionid) | ⏸ 待个体工商户认证 | [PR-4/](docs/01-想法记录MVP/PR-4/) |
| **PR-5** 语音输入(同声传译) | ⏸ 待企业主体小程序 | [PR-5/](docs/01-想法记录MVP/PR-5/) |

---

## 仓库结构

```
ideabox/
├── pom.xml                       后端 Maven 构建文件
├── Dockerfile                    后端 Spring Boot multi-stage 镜像
├── src/                          Spring Boot 后端源码
│   ├── main/java/com/ideabox/api/  按模块分包:user / auth / project / idea / config / common
│   ├── main/resources/             application.yml + Flyway migration
│   └── test/                       JUnit5(本地 PG dev/test 共享)
├── web/                          Next.js 16 网页端
│   ├── app/                       App Router(layout / page / projects/[id])+ _components / _hooks
│   ├── lib/                       api.ts / auth.ts / types.ts / copy.ts
│   ├── __tests__/                 vitest + @testing-library 单测(39 case)
│   ├── scripts/                   lint-design-tokens.sh + lint-xss.sh
│   ├── Dockerfile                 standalone multi-stage(3 处 COPY)
│   └── package.json               Next 16 + React 19 + Tailwind 4 + framer-motion + @dnd-kit + swr
├── docker/
│   └── nginx/nginx.conf           prod 反代 /api → backend + CSP / X-Frame-Options 等
├── docker-compose.dev.yml         本地开发(PostgreSQL 16,端口 25432)
├── docker-compose.prod.yml        生产 stack(postgres + backend + web + nginx 4 services)
├── .env.example                   环境变量模板
└── docs/
    ├── _UI设计规范.md             项目级 UI 通用规范
    ├── _开发流程SOP.md            开发流程姊妹文档
    └── 01-想法记录MVP/            feature 级设计 + PR-1 / PR-3 子目录
```

---

## 快速开始

**前置**:JDK 21 / Maven 3.9+ / Docker Desktop / Git。

```bash
# 1) 复制环境变量模板
cp .env.example .env

# 2) 编辑 .env,至少设 IDEABOX_JWT_SECRET(≥32 字节随机串)
#    生成方式:openssl rand -base64 48
#    Windows PowerShell:[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(48))

# 3) 启动开发数据库
docker compose -f docker-compose.dev.yml --env-file .env up -d

# 4) 跑后端(dev profile,Flyway 自动建表 + 种子 dev 用户)
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# 5) 健康检查
curl http://localhost:8080/actuator/health
# 期望:{"status":"UP"}

# 6) 拿开发期 JWT
curl -X POST http://localhost:8080/api/auth/login/dev -H "Content-Type: application/json" -d '{}'
# 期望:{"code":0,"data":{"token":"eyJhbGc...","expiresAt":"...","user":{...}}}

# 7) 启网页前端(新会话)
cd web
cp .env.example .env.local  # NEXT_PUBLIC_API_BASE_URL=http://localhost:8080 / NEXT_PUBLIC_AUTH_MODE=dev
npm install --legacy-peer-deps
npm run dev
# 打开 http://localhost:3000(若占用 -p 3001)
```

## 端口占用清单

| 端口 | 服务 |
|---|---|
| **25432** | PostgreSQL dev(host port → container 5432;5432 留给本机其他实例) |
| **26380** | Redis 占位(未引入) |
| 8080 | Spring Boot backend |
| 3000 / 3001 | Next.js dev(被占自动切 3001) |

prod stack 经 nginx 单一入口 80(或自定义 `NGINX_PORT`),内部 service 不暴露端口。

---

## 必填环境变量(最小集)

| 变量 | 说明 |
|---|---|
| `POSTGRES_PASSWORD` | dev DB 密码 |
| `IDEABOX_JWT_SECRET` | HMAC-SHA256 签名密钥,≥32 字节 |

完整变量见 [`.env.example`](.env.example)。

---

## 关键设计决策

| 决策 | 选择 | 文档 |
|---|---|---|
| ORM | MyBatis-Plus | [01-设计.md ADR-6](docs/01-想法记录MVP/01-设计.md#44-关键决策adr) |
| 微信 SDK | WxJava 4.8.0(PR-4 引入)| ADR-7 |
| JWT | HMAC-SHA256(对称 + 7 天有效期)| [PR-1 ADR-1](docs/01-想法记录MVP/PR-1/01-设计.md#44-关键决策pr-1-adr) |
| DTO 转换 | Controller 层手写 `XxxVO.fromEntity()` | PR-1 ADR-13 |
| 时间戳填充 | MyBatis-Plus `MetaObjectHandler` | PR-1 ADR-15 |

---

## License

私有项目,暂不开源。
