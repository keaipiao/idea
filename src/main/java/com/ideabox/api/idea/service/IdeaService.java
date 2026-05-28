package com.ideabox.api.idea.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ideabox.api.common.BusinessException;
import com.ideabox.api.common.ResultCode;
import com.ideabox.api.idea.entity.Idea;
import com.ideabox.api.idea.mapper.IdeaMapper;
import com.ideabox.api.project.service.ProjectService;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class IdeaService {

    private final IdeaMapper ideaMapper;
    private final ProjectService projectService;

    @Transactional(readOnly = true)
    public IPage<Idea> listByProject(Long projectId, Long userId, Boolean completed, long page, long size) {
        // 校验项目归属
        projectService.getOwnedById(projectId, userId);

        Page<Idea> p = Page.of(
                com.ideabox.api.common.PageResult.normalizePage(page),
                com.ideabox.api.common.PageResult.normalizeSize(size));
        LambdaQueryWrapper<Idea> q = new LambdaQueryWrapper<Idea>()
                .eq(Idea::getProjectId, projectId);
        if (completed != null) {
            if (completed) {
                q.isNotNull(Idea::getCompletedAt);
            } else {
                q.isNull(Idea::getCompletedAt);
            }
        }
        q.orderByAsc(Idea::getSortOrder).orderByDesc(Idea::getId);
        return ideaMapper.selectPage(p, q);
    }

    @Transactional
    public Idea create(Long projectId, Long userId, String content) {
        projectService.getOwnedById(projectId, userId);

        Integer maxOrder = ideaMapper.selectList(
                        new LambdaQueryWrapper<Idea>()
                                .select(Idea::getSortOrder)
                                .eq(Idea::getProjectId, projectId)
                                .orderByDesc(Idea::getSortOrder)
                                .last("LIMIT 1"))
                .stream().findFirst().map(Idea::getSortOrder).orElse(-1);

        Idea i = new Idea();
        i.setProjectId(projectId);
        i.setContent(content);
        i.setSortOrder(maxOrder + 1);
        ideaMapper.insert(i);
        return i;
    }

    /**
     * 查并校验想法归属(经由 project 间接校验)。
     */
    @Transactional(readOnly = true)
    public Idea getOwnedById(Long ideaId, Long userId) {
        Idea i = ideaMapper.selectById(ideaId);
        if (i == null) {
            throw new BusinessException(ResultCode.RESOURCE_NOT_FOUND, "想法不存在");
        }
        projectService.getOwnedById(i.getProjectId(), userId);
        return i;
    }

    @Transactional
    public Idea update(Long ideaId, Long userId, String content, Boolean completed, Integer sortOrder) {
        Idea i = getOwnedById(ideaId, userId);
        if (content == null && completed == null && sortOrder == null) {
            return i;  // 无变更字段不 churn updated_at
        }
        Long expectedProjectId = i.getProjectId();
        if (content != null) {
            i.setContent(content);
        }
        if (completed != null) {
            if (completed) {
                if (i.getCompletedAt() == null) {
                    i.setCompletedAt(LocalDateTime.now());
                }
            } else {
                i.setCompletedAt(null);
            }
        }
        if (sortOrder != null) {
            i.setSortOrder(sortOrder);
        }
        // 钉 project_id 防 TOCTOU:SELECT 后并发事务把 idea 改到别人项目的窗口期
        int affected = ideaMapper.update(i, new LambdaUpdateWrapper<Idea>()
                .eq(Idea::getId, ideaId)
                .eq(Idea::getProjectId, expectedProjectId));
        if (affected == 0) {
            throw new BusinessException(ResultCode.RESOURCE_NOT_FOUND, "想法不存在");
        }
        return i;
    }

    @Transactional
    public void delete(Long ideaId, Long userId) {
        Idea i = getOwnedById(ideaId, userId);
        // 钉 project_id 防 TOCTOU(与 update 对称)
        int affected = ideaMapper.delete(new LambdaQueryWrapper<Idea>()
                .eq(Idea::getId, ideaId)
                .eq(Idea::getProjectId, i.getProjectId()));
        if (affected == 0) {
            throw new BusinessException(ResultCode.RESOURCE_NOT_FOUND, "想法不存在");
        }
    }

    @Transactional
    public void reorder(Long projectId, Long userId, List<Long> ids) {
        projectService.getOwnedById(projectId, userId);
        if (ids == null || ids.isEmpty()) {
            return;
        }

        List<Idea> ideas = ideaMapper.selectBatchIds(new HashSet<>(ids));
        Map<Long, Idea> byId = ideas.stream().collect(Collectors.toMap(Idea::getId, Function.identity()));

        Set<Long> seen = new HashSet<>();
        for (Long iid : ids) {
            if (!seen.add(iid)) {
                throw new BusinessException(ResultCode.PARAM_INVALID, "ids 包含重复值");
            }
            Idea idea = byId.get(iid);
            // 错误消息不带 id 防 IDOR;404/403 分档与单 CRUD 一致
            if (idea == null) {
                throw new BusinessException(ResultCode.RESOURCE_NOT_FOUND, "想法不存在");
            }
            if (!idea.getProjectId().equals(projectId)) {
                throw new BusinessException(ResultCode.FORBIDDEN_OWNER, "无权访问该想法");
            }
        }

        List<Long> sorted = ids.stream().sorted().toList();
        Map<Long, Integer> newOrder = new HashMap<>();
        for (int i = 0; i < ids.size(); i++) {
            newOrder.put(ids.get(i), i);
        }
        for (Long iid : sorted) {
            Idea idea = byId.get(iid);
            idea.setSortOrder(newOrder.get(iid));
            ideaMapper.updateById(idea);
        }
    }
}
