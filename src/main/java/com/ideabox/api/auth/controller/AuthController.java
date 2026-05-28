package com.ideabox.api.auth.controller;

import com.ideabox.api.common.Result;
import com.ideabox.api.common.ResultCode;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 鉴权 Controller。
 * <p>
 * 微信小程序登录在 PR-4 实装,当前返 200 + Result.code=501000(走业务码契约,
 * 不用 HTTP 501 避免反向代理 / APM 误判 server error)。
 * <p>
 * 开发期登录 endpoint 在 {@link DevAuthController}(仅 dev profile)。
 */
@RestController
@RequestMapping("/api/auth/login")
public class AuthController {

    /**
     * 微信小程序登录(PR-4 实装)。
     * 返回 HTTP 200 + 业务码 501000,符合项目"前端只解析 Result.code"契约。
     */
    @PostMapping("/mp")
    public Result<Void> mpLogin() {
        return Result.fail(ResultCode.NOT_IMPLEMENTED, "微信小程序登录将在 PR-4 实装");
    }
}
