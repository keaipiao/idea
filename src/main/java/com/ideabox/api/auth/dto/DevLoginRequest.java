package com.ideabox.api.auth.dto;

import lombok.Data;

/**
 * 开发期登录请求。userId 可选,默认 1(种子 dev 用户)。
 */
@Data
public class DevLoginRequest {
    private Long userId;
}
