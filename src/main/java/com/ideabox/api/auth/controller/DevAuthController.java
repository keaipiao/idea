package com.ideabox.api.auth.controller;

import com.ideabox.api.auth.dto.DevLoginRequest;
import com.ideabox.api.auth.dto.LoginResponse;
import com.ideabox.api.common.Result;
import com.ideabox.api.common.jwt.JwtUtil;
import com.ideabox.api.user.entity.User;
import com.ideabox.api.user.service.UserService;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 开发期登录 endpoint。
 * <p>
 * <strong>仅 dev profile 注册</strong>:prod 启动时此 controller 不存在,/api/auth/login/dev 返 404。
 */
@RestController
@RequestMapping("/api/auth/login")
@Profile("dev")
@RequiredArgsConstructor
public class DevAuthController {

    private final JwtUtil jwtUtil;
    private final UserService userService;

    /**
     * 开发期登录。拿种子 dev 用户(默认 userId=1)的 JWT,绕过微信。
     */
    @PostMapping("/dev")
    public Result<LoginResponse> devLogin(@RequestBody(required = false) DevLoginRequest req) {
        Long userId = (req != null && req.getUserId() != null) ? req.getUserId() : 1L;
        User user = userService.getById(userId);
        Instant issuedAt = Instant.now();
        String token = jwtUtil.issue(userId);
        return Result.ok(LoginResponse.builder()
                .token(token)
                .expiresAt(jwtUtil.expirationOf(issuedAt))
                .user(user)
                .build());
    }
}
