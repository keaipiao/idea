package com.ideabox.api.auth.dto;

import jakarta.validation.constraints.Positive;
import lombok.Data;

/**
 * 开发期登录请求。userId 可选,默认 1(种子 dev 用户)。
 * 非空时必须为正数,防止签发负 userId 的 token。
 */
@Data
public class DevLoginRequest {
    @Positive(message = "userId 必须为正数")
    private Long userId;
}
