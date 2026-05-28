package com.ideabox.api.idea.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class IdeaCreateReq {

    @NotBlank(message = "想法内容不能为空")
    @Size(max = 5000, message = "想法内容不能超过 5000 字符")
    private String content;
}
