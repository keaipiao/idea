package com.ideabox.api.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProjectCreateReq {

    @NotBlank(message = "项目名称不能为空")
    @Size(max = 100, message = "项目名称不能超过 100 字符")
    private String name;
}
