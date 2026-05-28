package com.ideabox.api.common;

import jakarta.servlet.http.HttpServletResponse;
import java.util.ArrayList;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

/**
 * 全局异常处理。所有未捕获异常统一转 Result + 对应 HTTP 状态码。
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /** 业务异常(主动抛出) */
    @ExceptionHandler(BusinessException.class)
    public Result<Void> handleBusiness(BusinessException ex, HttpServletResponse resp) {
        resp.setStatus(ex.getResultCode().getHttpStatus());
        return Result.fail(ex.getResultCode(), ex.getMessage());
    }

    /** @Valid 校验失败 */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Result<List<String>> handleValidation(MethodArgumentNotValidException ex, HttpServletResponse resp) {
        List<String> errors = new ArrayList<>();
        ex.getBindingResult().getFieldErrors().forEach(fe ->
                errors.add(fe.getField() + ": " + fe.getDefaultMessage()));
        resp.setStatus(ResultCode.PARAM_INVALID.getHttpStatus());
        return Result.fail(ResultCode.PARAM_INVALID, "参数校验失败", errors);
    }

    /** 缺失必填请求参数 */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public Result<Void> handleMissingParam(MissingServletRequestParameterException ex, HttpServletResponse resp) {
        resp.setStatus(ResultCode.PARAM_INVALID.getHttpStatus());
        return Result.fail(ResultCode.PARAM_INVALID, "缺少参数: " + ex.getParameterName());
    }

    /** 请求参数类型不匹配 */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public Result<Void> handleTypeMismatch(MethodArgumentTypeMismatchException ex, HttpServletResponse resp) {
        resp.setStatus(ResultCode.PARAM_INVALID.getHttpStatus());
        return Result.fail(ResultCode.PARAM_INVALID, "参数类型错误: " + ex.getName());
    }

    /** JSON 解析失败 */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public Result<Void> handleBadJson(HttpMessageNotReadableException ex, HttpServletResponse resp) {
        resp.setStatus(ResultCode.PARAM_INVALID.getHttpStatus());
        return Result.fail(ResultCode.PARAM_INVALID, "请求体格式错误");
    }

    /** 兜底:未识别异常 */
    @ExceptionHandler(Exception.class)
    public Result<Void> handleUnknown(Exception ex, HttpServletResponse resp) {
        log.error("[系统异常] 未捕获", ex);
        resp.setStatus(ResultCode.SYSTEM_ERROR.getHttpStatus());
        return Result.fail(ResultCode.SYSTEM_ERROR, "系统繁忙,请稍后重试");
    }
}
