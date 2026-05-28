package com.ideabox.api.project.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.Data;

/**
 * 批量重排请求。ids 数组顺序决定新的 sort_order(数组首位 sort_order=0)。
 * 上限 500 防 DoS。
 */
@Data
public class ReorderReq {

    @NotEmpty(message = "ids 不能为空")
    @Size(max = 500, message = "ids 不能超过 500 项")
    private List<Long> ids;
}
