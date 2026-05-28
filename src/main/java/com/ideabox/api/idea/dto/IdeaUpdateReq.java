package com.ideabox.api.idea.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class IdeaUpdateReq {

    /** null 表示不修改;非 null 必须非空白 + ≤5000 字符 */
    @Pattern(regexp = "(?s)^(?!\\s*$).+", message = "想法内容不能为空白")
    @Size(max = 5000, message = "想法内容不能超过 5000 字符")
    private String content;

    /** 完成状态。true=标记完成,false=取消完成,null=不变 */
    private Boolean completed;

    private Integer sortOrder;
}
