package com.ideabox.api.auth.controller;

import com.ideabox.api.common.Result;
import com.ideabox.api.common.ResultCode;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 鉴权 Controller。
 * <p>
 * 微信小程序登录在 PR-4 实装,当前返 501。
 * <p>
 * 开发期登录 endpoint 在 {@link DevAuthController}(仅 dev profile)。
 */
@RestController
@RequestMapping("/api/auth/login")
public class AuthController {

    /**
     * 微信小程序登录(PR-4 实装)。
     */
    @PostMapping("/mp")
    public Result<Void> mpLogin(HttpServletResponse resp) {
        resp.setStatus(ResultCode.NOT_IMPLEMENTED.getHttpStatus());
        return Result.fail(ResultCode.NOT_IMPLEMENTED, "微信小程序登录将在 PR-4 实装");
    }
}
