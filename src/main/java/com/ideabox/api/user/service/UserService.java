package com.ideabox.api.user.service;

import com.ideabox.api.common.BusinessException;
import com.ideabox.api.common.ResultCode;
import com.ideabox.api.user.entity.User;
import com.ideabox.api.user.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserMapper userMapper;

    @Transactional(readOnly = true)
    public User getById(Long id) {
        User u = userMapper.selectById(id);
        if (u == null) {
            throw new BusinessException(ResultCode.RESOURCE_NOT_FOUND, "用户不存在");
        }
        return u;
    }
}
