package com.ideabox.api.auth.dto;

import com.ideabox.api.user.entity.User;
import java.time.Instant;
import lombok.Builder;
import lombok.Data;

/**
 * 登录响应。
 */
@Data
@Builder
public class LoginResponse {

    /** JWT 字符串 */
    private String token;
    /** 过期时刻 ISO-8601 */
    private Instant expiresAt;
    /** 用户信息 */
    private User user;
}
