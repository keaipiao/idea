package com.ideabox.api.project.controller;

import com.ideabox.api.common.PageResult;
import com.ideabox.api.common.Result;
import com.ideabox.api.common.UserContext;
import com.ideabox.api.project.dto.ProjectCreateReq;
import com.ideabox.api.project.dto.ProjectUpdateReq;
import com.ideabox.api.project.dto.ProjectVO;
import com.ideabox.api.project.dto.ReorderReq;
import com.ideabox.api.project.entity.Project;
import com.ideabox.api.project.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    public Result<PageResult<ProjectVO>> list(
            @RequestParam(defaultValue = "1") long page,
            @RequestParam(defaultValue = "20") long size) {
        Long uid = UserContext.requireUserId();
        var pageData = projectService.listByUser(uid, page, size);
        return Result.ok(PageResult.from(pageData, ProjectVO::fromEntity));
    }

    @PostMapping
    public Result<ProjectVO> create(@Valid @RequestBody ProjectCreateReq req) {
        Long uid = UserContext.requireUserId();
        Project p = projectService.create(uid, req.getName());
        return Result.ok(ProjectVO.fromEntity(p));
    }

    @PutMapping("/reorder")
    public Result<Void> reorder(@Valid @RequestBody ReorderReq req) {
        Long uid = UserContext.requireUserId();
        projectService.reorder(uid, req.getIds());
        return Result.ok();
    }

    @PutMapping("/{id}")
    public Result<ProjectVO> update(@PathVariable Long id, @Valid @RequestBody ProjectUpdateReq req) {
        Long uid = UserContext.requireUserId();
        Project p = projectService.update(id, uid, req.getName(), req.getSortOrder());
        return Result.ok(ProjectVO.fromEntity(p));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        Long uid = UserContext.requireUserId();
        projectService.delete(id, uid);
        return Result.ok();
    }
}
