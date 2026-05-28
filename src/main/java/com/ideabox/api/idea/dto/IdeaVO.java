package com.ideabox.api.idea.dto;

import com.ideabox.api.idea.entity.Idea;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class IdeaVO {

    private Long id;
    private Long projectId;
    private String content;
    private Boolean completed;
    private LocalDateTime completedAt;
    private Integer sortOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static IdeaVO fromEntity(Idea i) {
        return IdeaVO.builder()
                .id(i.getId())
                .projectId(i.getProjectId())
                .content(i.getContent())
                .completed(i.getCompletedAt() != null)
                .completedAt(i.getCompletedAt())
                .sortOrder(i.getSortOrder())
                .createdAt(i.getCreatedAt())
                .updatedAt(i.getUpdatedAt())
                .build();
    }
}
