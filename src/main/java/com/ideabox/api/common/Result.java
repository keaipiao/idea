package com.ideabox.api.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

/**
 * 统一响应包装。
 * <p>
 * 前端解构稳定:{@code code} / {@code message} 必填,{@code data} 字段恒存在(无数据时为 null)。
 *
 * @param <T> 业务数据类型
 */
@Data
@JsonInclude(JsonInclude.Include.ALWAYS)
public class Result<T> {

    /** 业务码,0=成功,其他见 {@link ResultCode} */
    private int code;
    /** 提示消息 */
    private String message;
    /** 业务数据,无数据时为 null 但字段必出 */
    private T data;

    public static <T> Result<T> ok() {
        return ok(null);
    }

    public static <T> Result<T> ok(T data) {
        Result<T> r = new Result<>();
        r.code = ResultCode.SUCCESS.getCode();
        r.message = ResultCode.SUCCESS.getMessage();
        r.data = data;
        return r;
    }

    public static <T> Result<T> fail(ResultCode rc) {
        return fail(rc, rc.getMessage(), null);
    }

    public static <T> Result<T> fail(ResultCode rc, String message) {
        return fail(rc, message, null);
    }

    public static <T> Result<T> fail(ResultCode rc, String message, T data) {
        Result<T> r = new Result<>();
        r.code = rc.getCode();
        r.message = message;
        r.data = data;
        return r;
    }
}
