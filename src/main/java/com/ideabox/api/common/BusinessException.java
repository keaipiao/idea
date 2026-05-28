package com.ideabox.api.common;

import lombok.Getter;

/**
 * 业务异常。Service 层抛出,由 GlobalExceptionHandler 统一转 Result。
 */
@Getter
public class BusinessException extends RuntimeException {

    private final ResultCode resultCode;

    public BusinessException(ResultCode resultCode) {
        super(resultCode.getMessage());
        this.resultCode = resultCode;
    }

    public BusinessException(ResultCode resultCode, String message) {
        super(message);
        this.resultCode = resultCode;
    }
}
