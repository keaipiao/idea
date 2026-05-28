package com.ideabox.api.user.controller;

import com.ideabox.api.common.Result;
import com.ideabox.api.common.UserContext;
import com.ideabox.api.user.entity.User;
import com.ideabox.api.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /** 获取当前登录用户信息 */
    @GetMapping("/me")
    public Result<User> me() {
        Long uid = UserContext.requireUserId();
        return Result.ok(userService.getById(uid));
    }
}
