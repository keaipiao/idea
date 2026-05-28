package com.ideabox.api.idea.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Data;

/**
 * 想法实体。对应 {@code t_idea} 表。
 */
@Data
@TableName("t_idea")
public class Idea {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long projectId;
    private String content;

    /** 完成时间。NULL=未完成,有值=已完成 */
    private LocalDateTime completedAt;

    private Integer sortOrder;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
