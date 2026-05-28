# Changelog

> 遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) + [Semantic Versioning](https://semver.org/lang/zh-CN/)。

---

## [v0.2.0] — 2026-05-28 · PR-3 网页端 + 拖拽 + 动画系统 + nginx 反代 — docs/01-想法记录MVP/PR-3/

详细变更见 [PR-3/04-部署日志.md](docs/01-想法记录MVP/PR-3/04-部署日志.md) + [PR-3/05-迭代日志.md](docs/01-想法记录MVP/PR-3/05-迭代日志.md)。

### Added

- 网页端 Next.js 16 + TS + Tailwind 4 完整实现(`web/` 目录,20 文件 + 39 单测)
- AuthGate + lib/auth.ts(AUTH_MODE 三档 dev/wechat/none + idle 30min auto clear + reauth singleton 防并发 401 风暴)
- API 客户端 lib/api.ts(401 一次性 re-login + same-origin/include 自适应 credentials)
- 数据 hooks useProjects / useIdeas(SWR cache + 乐观更新 + revalidateOnFocus)
- 12 个 UI 组件:ProjectSidebar / IdeaInput / IdeaItem / IdeaList / SortableIdeaList / EditIdeaModal / RenameModal / ConfirmModal / ToastProvider / ModalRoot / EmptyState / Skeleton
- 拖拽 @dnd-kit:整行可拖 + 立即本地顺序 + debounce 300ms API
- 动画 framer-motion:Toast 滑入 / Modal 弹入 / SVG 浮动 / 完成对勾 backOut
- 后端 Dockerfile + web/Dockerfile + docker-compose.prod.yml(4 services)+ nginx 反代 + CSP header

### Changed

- **PR-1 hotfix**:CorsConfig bean 名改为 `corsConfigurationSource`(Spring Security CorsConfigurer 优先按 name 查找),`allowedOriginPatterns` 支持任意 dev 端口(原 5432/5173 写死)
- PostgreSQL dev 端口 5432 → **25432**(避与本机其他实例冲突),5 处同步:`docker-compose.dev.yml` / `.env.example` / `application.yml` / `IntegrationTestBase.java`
- Redis 占位端口 26380(未引入,文档约定)
- VERSION:v0.1.0 → v0.2.0

### Migrations

无(纯前端 + 配置变更)

### Pitfalls Logged

- PR-3/04-部署日志 § 5 共 6 条:CorsConfig bean name / 端口冲突 / dnd-kit×framer-motion 冲突 / debounce 时机 / jsdom 异步动画 / mvn 跳编译

---

## [v0.1.1] — 2026-05-28 · PR-1 hotfix(/review 暴露 P0/P1 系统修复)

阶段 7 用户 call out 后真跑 `/review` skill,4 个 specialist 暴露 7 P0 + 11 P1。原"0 P0/P1"自评是误报(未实际尝试 skill 即跳过)。

### Security

- **CRITICAL**:UserController.me + LoginResponse.user 不再直接返 User entity,新 UserVO 不含 unionId/openIdMp/openIdWeb
- **CRITICAL**:删 application.yml 全局 logic-delete-* 配置(entity/schema 无对应字段,留着是埋雷)
- **CRITICAL**:V2 seed dev user 移到 db/migration-dev/,prod 不跑(不再有 prod 幽灵账号)
- **CRITICAL**:POSTGRES_PASSWORD 删默认值 fail-fast;Druid 凭据走 env var
- **CRITICAL**:JwtUtil secret 显式 UTF-8 编码(跨平台 token 一致)
- **CRITICAL**:JwtAuthFilter try 块缩到只裹 parseUserId,不再吞下游业务 IllegalArgumentException
- **CRITICAL**:SecurityConfig anyRequest().authenticated();登录 WHITELIST 精确路径

### Fixed

- ProjectUpdateReq.name / IdeaUpdateReq.content 加 @Pattern 拒空白字符串
- ReorderReq.ids @Size(max=500) 防 DoS
- DevLoginRequest.userId @Positive 拦负数
- ProjectService.update/delete 用 LambdaUpdateWrapper 钉死 user_id 防 TOCTOU
- mpLogin 改 HTTP 200 + Result.code=501000(走业务码契约)
- 404 路径走 Result 包装(加 NoHandlerFoundException handler)
- CorsConfig 暴露 CorsConfigurationSource bean,SecurityConfig.cors() 真接管
- reorder 错误消息去 id 防 IDOR

### Changed

- Result 加独立 errors 字段,@Valid 失败 data=null + errors=[字段错误]
- V3__alter_foreign_keys_restrict.sql:ON DELETE CASCADE → RESTRICT
- docker-compose.dev.yml 用 named volume(Windows NTFS bind mount fsync 慢)
- docker/initdb/01-create-test-db.sql 自动建 ideabox_test
- pom.xml 删 testcontainers 死依赖
- application.yml jackson.default-property-inclusion=always 锁 Result 契约
- application.yml flyway.baseline-on-migrate=false 默认(dev 显式 true)

### Migrations

- `V3__alter_foreign_keys_restrict.sql` — t_project / t_idea 外键改 RESTRICT

### Pitfalls Logged

新增踩坑沉淀到 piao-workflow SKILL.md 阶段 3 框架避坑(MyBatis-Plus / Druid wall 等已沉淀,见 v0.1.0 段)。
此次 hotfix 教训沉淀到 piao-workflow 质量门规则:**skill 跑不动必须附实际尝试 stderr 证据**。

---

## [v0.1.0] — 2026-05-28 · 后端脚手架 PR-1 — [docs/01-想法记录MVP/PR-1/](docs/01-想法记录MVP/PR-1/)

后端 MVP 第一波,前端 PR-2/PR-3 解锁。本 PR 不部署生产,仅本地 dev 可用。

### Added

- **后端项目骨架**:Spring Boot 3.5.3 + Java 21 + Maven + MyBatis-Plus 3.5.7 + Druid 1.2.25 + jjwt 0.12.6
- **3 张表**:`t_user` / `t_project` / `t_idea` + 全中文 COMMENT + 复合索引 + partial unique index
- **11 个 REST endpoint**:项目/想法 CRUD + 批量 reorder + 开发期 login + 当前用户 + 微信 mp 占位 501
- **开发期 JWT 认证**:HMAC-SHA256 + 7 天 + secret >= 32 字节 fail-fast + 4 档 401 错误码
- **CORS**:dev 白名单 + allowCredentials + maxAge 1h(prod 留 PR-3)
- **输入校验**:`@Valid` + `@NotBlank` + `@Size`(name ≤100,content ≤5000)
- **分页**:MyBatis-Plus PaginationInnerInterceptor + `PageResult<T>` + size cap 200
- **时间戳自动填充**:MyBatis-Plus `MetaObjectHandler`
- **统一响应包**:`Result<T> = {code, message, data}` + 8 档业务码 + 全局异常处理

### Migrations

- `V1__create_tables.sql` — 建 3 张业务表
- `V2__seed_dev_user.sql` — 种子 dev 用户(id=1)

### Pitfalls Logged

- `_开发踩坑记录.md` D1 — Druid wall filter 拦 PG partial index DDL
- `_开发踩坑记录.md` D2 — Testcontainers Windows + Docker Desktop WSL2 不兼容
- `_开发踩坑记录.md` D3 — MyBatis-Plus 默认 NOT_NULL 让 set null 静默失效

### Testing

- 单测 12 ✅ + 集成测试 16 ✅ + 真实启动 curl 15 ✅
- `/cso` 自评:0 P0 / 0 P1

### Known Limitations

- 不部署生产(留待 PR-3/PR-4)
- 集成测试用本机 PG + `@Transactional` rollback(Testcontainers 在 Windows + Docker Desktop WSL2 不兼容)
- JWT refresh / rate limit / OpenAPI / XSS sanitize 标 TODO,见 [02-开发计划 § 6](docs/01-想法记录MVP/PR-1/02-开发计划.md)

---

## [Unreleased]

下一个里程碑:**PR-2 小程序前端 + PR-3 网页端前端**(可并行)。
