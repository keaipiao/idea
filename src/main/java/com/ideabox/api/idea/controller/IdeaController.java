package com.ideabox.api.idea.controller;

import com.ideabox.api.common.PageResult;
import com.ideabox.api.common.Result;
import com.ideabox.api.common.UserContext;
import com.ideabox.api.idea.dto.IdeaCreateReq;
import com.ideabox.api.idea.dto.IdeaUpdateReq;
import com.ideabox.api.idea.dto.IdeaVO;
import com.ideabox.api.idea.entity.Idea;
import com.ideabox.api.idea.service.IdeaService;
import com.ideabox.api.project.dto.ReorderReq;
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
@RequiredArgsConstructor
public class IdeaController {

    private final IdeaService ideaService;

    @GetMapping("/api/projects/{projectId}/ideas")
    public Result<PageResult<IdeaVO>> list(
            @PathVariable Long projectId,
            @RequestParam(required = false) Boolean completed,
            @RequestParam(defaultValue = "1") long page,
            @RequestParam(defaultValue = "50") long size) {
        Long uid = UserContext.requireUserId();
        var pageData = ideaService.listByProject(projectId, uid, completed, page, size);
        return Result.ok(PageResult.from(pageData, IdeaVO::fromEntity));
    }

    @PostMapping("/api/projects/{projectId}/ideas")
    public Result<IdeaVO> create(@PathVariable Long projectId, @Valid @RequestBody IdeaCreateReq req) {
        Long uid = UserContext.requireUserId();
        Idea i = ideaService.create(projectId, uid, req.getContent());
        return Result.ok(IdeaVO.fromEntity(i));
    }

    @PutMapping("/api/projects/{projectId}/ideas/reorder")
    public Result<Void> reorder(@PathVariable Long projectId, @Valid @RequestBody ReorderReq req) {
        Long uid = UserContext.requireUserId();
        ideaService.reorder(projectId, uid, req.getIds());
        return Result.ok();
    }

    @PutMapping("/api/ideas/{id}")
    public Result<IdeaVO> update(@PathVariable Long id, @Valid @RequestBody IdeaUpdateReq req) {
        Long uid = UserContext.requireUserId();
        Idea i = ideaService.update(id, uid, req.getContent(), req.getCompleted(), req.getSortOrder());
        return Result.ok(IdeaVO.fromEntity(i));
    }

    @DeleteMapping("/api/ideas/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        Long uid = UserContext.requireUserId();
        ideaService.delete(id, uid);
        return Result.ok();
    }
}
