/**
 * 后端 13 endpoint 契约镜像。
 * 严格对齐 PR-1 后端 DTO/VO/Result/ResultCode(详 src/main/java/com/ideabox/api/)。
 * 字段顺序与可空性与后端保持一致。
 */

/* ---------- 通用 ---------- */

/** 后端 Result<T> 包装(src/main/java/com/ideabox/api/common/Result.java) */
export interface ApiResult<T> {
  code: number;
  message: string;
  data: T | null;
  /** 仅 @Valid 校验失败时(code=400001)有值 */
  errors?: string[];
}

/** 分页(src/main/java/com/ideabox/api/common/PageResult.java) */
export interface PageResult<T> {
  records: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

/** 业务码(src/main/java/com/ideabox/api/common/ResultCode.java) */
export enum ResultCode {
  SUCCESS = 0,
  PARAM_INVALID = 400001,
  JWT_EXPIRED = 401001,
  JWT_INVALID = 401002,
  JWT_MISSING = 401003,
  FORBIDDEN_OWNER = 403001,
  RESOURCE_NOT_FOUND = 404001,
  NOT_IMPLEMENTED = 501000,
  SYSTEM_ERROR = 500000,
}

/* ---------- 实体 VO ---------- */

/** 用户对象(src/main/java/com/ideabox/api/user/dto/UserVO.java)— 不含 unionId/openId */
export interface UserVO {
  id: number;
  nickname: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

/** 项目对象(src/main/java/com/ideabox/api/project/dto/ProjectVO.java) */
export interface ProjectVO {
  id: number;
  name: string;
  sortOrder: number | null;
  createdAt: string;
  updatedAt: string;
}

/** 想法对象(src/main/java/com/ideabox/api/idea/dto/IdeaVO.java) */
export interface IdeaVO {
  id: number;
  projectId: number;
  content: string;
  completed: boolean;
  completedAt: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/* ---------- Auth ---------- */

/** dev 登录响应(src/main/java/com/ideabox/api/auth/dto/LoginResponse.java) */
export interface LoginResponse {
  token: string;
  expiresAt: string;
  user: UserVO;
}

/** dev 登录请求(可选 userId,默认 1) */
export interface DevLoginRequest {
  userId?: number;
}

/* ---------- 请求 DTO ---------- */

export interface ProjectCreateReq {
  /** @NotBlank @Size(max=100) */
  name: string;
}

export interface ProjectUpdateReq {
  /** @Pattern(non-blank) @Size(max=100),可选 */
  name?: string;
  sortOrder?: number;
}

export interface IdeaCreateReq {
  /** @NotBlank @Size(max=5000) */
  content: string;
}

export interface IdeaUpdateReq {
  /** @Pattern(non-blank multiline) @Size(max=5000),可选 */
  content?: string;
  completed?: boolean;
  sortOrder?: number;
}

export interface ReorderReq {
  /** @NotEmpty @Size(max=500) — 按目标顺序排列的 id 数组 */
  ids: number[];
}

/* ---------- 客户端错误 ---------- */

/** 客户端 API 调用错误。Result.code 非 0 / HTTP 4xx5xx / 网络 / abort 都用这个类型抛 */
export class ApiError extends Error {
  /** 业务 code 或 HTTP status */
  readonly code: number;
  /** 字段级错误(校验失败时) */
  readonly errors?: string[];
  /** 是否网络层错误(timeout / abort / 离线) */
  readonly isNetwork: boolean;

  constructor(code: number, message: string, options?: { errors?: string[]; isNetwork?: boolean }) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.errors = options?.errors;
    this.isNetwork = options?.isNetwork ?? false;
  }
}

/* ---------- AuthMode(PR-3 ADR-16) ---------- */

export type AuthMode = "dev" | "wechat" | "none";

export function getAuthMode(): AuthMode {
  const v = process.env.NEXT_PUBLIC_AUTH_MODE ?? "dev";
  if (v === "dev" || v === "wechat" || v === "none") return v;
  return "dev";
}
