package com.ideabox.api.user.dto;

import com.ideabox.api.user.entity.User;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Data;

/**
 * 用户对外视图。
 * <p>
 * <strong>不暴露</strong> unionId / openIdMp / openIdWeb 等微信身份标识 — 这些是跨应用追踪强标识,
 * 仅服务端持有,前端永远拿不到。User entity 永远不直接序列化到 controller 响应。
 */
@Data
@Builder
public class UserVO {

    private Long id;
    private String nickname;
    private String avatarUrl;
    private LocalDateTime createdAt;

    public static UserVO fromEntity(User u) {
        return UserVO.builder()
                .id(u.getId())
                .nickname(u.getNickname())
                .avatarUrl(u.getAvatarUrl())
                .createdAt(u.getCreatedAt())
                .build();
    }
}
