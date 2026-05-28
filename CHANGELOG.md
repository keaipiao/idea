# Changelog

> 遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) + [Semantic Versioning](https://semver.org/lang/zh-CN/)。

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
