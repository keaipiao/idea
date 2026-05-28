package com.ideabox.api.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;
import lombok.Data;

/**
 * 统一响应包装。
 * <p>
 * 前端解构稳定:{@code code} / {@code message} / {@code data} 三字段恒存在(无数据时为 null)。
 * 校验失败时额外字段 {@code errors}(List<String>)。
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
    /** 业务数据。null 时仍输出 key,前端解构稳定 */
    private T data;
    /** 字段级错误列表(仅 @Valid 校验失败时有值;其他情况 null) */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private List<String> errors;

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
        return fail(rc, rc.getMessage());
    }

    public static <T> Result<T> fail(ResultCode rc, String message) {
        Result<T> r = new Result<>();
        r.code = rc.getCode();
        r.message = message;
        r.data = null;
        return r;
    }

    public static <T> Result<T> validationFail(String message, List<String> errors) {
        Result<T> r = new Result<>();
        r.code = ResultCode.PARAM_INVALID.getCode();
        r.message = message;
        r.data = null;
        r.errors = errors;
        return r;
    }
}
