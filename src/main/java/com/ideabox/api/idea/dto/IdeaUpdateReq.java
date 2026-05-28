package com.ideabox.api.idea.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class IdeaUpdateReq {

    @Size(max = 5000, message = "想法内容不能超过 5000 字符")
    private String content;

    /** 完成状态。true=标记完成,false=取消完成,null=不变 */
    private Boolean completed;

    private Integer sortOrder;
}
