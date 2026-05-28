package com.ideabox.api.project.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProjectUpdateReq {

    /**
     * 项目名。null 表示不修改;非 null 必须非空白(`\S` 匹配) + ≤100 字符。
     * 防止客户端通过 PUT {"name":""} 把 NOT NULL 列写成空字符串。
     */
    @Pattern(regexp = "^(?!\\s*$).+", message = "项目名称不能为空白")
    @Size(max = 100, message = "项目名称不能超过 100 字符")
    private String name;

    private Integer sortOrder;
}
