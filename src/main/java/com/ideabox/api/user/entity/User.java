package com.ideabox.api.user.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Data;

/**
 * 用户实体。对应 {@code t_user} 表。
 */
@Data
@TableName("t_user")
public class User {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 微信开放平台 unionid(PR-4 接入后填充) */
    private String unionId;
    /** 小程序 openid */
    private String openIdMp;
    /** 网页应用 openid */
    private String openIdWeb;
    /** 微信昵称 */
    private String nickname;
    /** 头像 URL */
    private String avatarUrl;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
