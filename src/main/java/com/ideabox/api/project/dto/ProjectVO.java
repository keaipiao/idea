package com.ideabox.api.project.dto;

import com.ideabox.api.project.entity.Project;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProjectVO {

    private Long id;
    private String name;
    private Integer sortOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ProjectVO fromEntity(Project p) {
        return ProjectVO.builder()
                .id(p.getId())
                .name(p.getName())
                .sortOrder(p.getSortOrder())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
