package com.ideabox.api.project.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import lombok.Data;

/**
 * 批量重排请求。ids 数组顺序决定新的 sort_order(数组首位 sort_order=0)。
 */
@Data
public class ReorderReq {

    @NotEmpty(message = "ids 不能为空")
    private List<Long> ids;
}
