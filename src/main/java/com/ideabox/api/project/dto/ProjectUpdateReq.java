package com.ideabox.api.project.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProjectUpdateReq {

    @Size(max = 100, message = "项目名称不能超过 100 字符")
    private String name;

    private Integer sortOrder;
}
