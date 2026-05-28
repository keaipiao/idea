package com.ideabox.api.common;

import lombok.Getter;

/**
 * 业务响应码。
 * <p>
 * 约定:HTTP 状态码 ↔ Result.code 双层契约。HTTP 仅作传输层提示,前端只解析 Result.code。
 * 详见 docs/01-想法记录MVP/PR-1/01-设计.md ADR-9。
 */
@Getter
public enum ResultCode {

    SUCCESS(0, 200, "ok"),

    PARAM_INVALID(400001, 400, "参数校验失败"),

    JWT_EXPIRED(401001, 401, "JWT 已过期"),
    JWT_INVALID(401002, 401, "JWT 签名无效或解析失败"),
    JWT_MISSING(401003, 401, "Authorization 头缺失"),

    FORBIDDEN_OWNER(403001, 403, "无权访问该资源"),

    RESOURCE_NOT_FOUND(404001, 404, "资源不存在"),

    NOT_IMPLEMENTED(501000, 501, "尚未实现"),

    SYSTEM_ERROR(500000, 500, "系统内部异常");

    /** 业务码 */
    private final int code;
    /** 建议的 HTTP 状态码 */
    private final int httpStatus;
    /** 默认提示消息 */
    private final String message;

    ResultCode(int code, int httpStatus, String message) {
        this.code = code;
        this.httpStatus = httpStatus;
        this.message = message;
    }
}
