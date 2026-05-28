package com.ideabox.api.project.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ideabox.api.common.BusinessException;
import com.ideabox.api.common.ResultCode;
import com.ideabox.api.project.entity.Project;
import com.ideabox.api.project.mapper.ProjectMapper;
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
public class ProjectService {

    private final ProjectMapper projectMapper;

    @Transactional(readOnly = true)
    public IPage<Project> listByUser(Long userId, long page, long size) {
        Page<Project> p = Page.of(
                com.ideabox.api.common.PageResult.normalizePage(page),
                com.ideabox.api.common.PageResult.normalizeSize(size));
        LambdaQueryWrapper<Project> q = new LambdaQueryWrapper<Project>()
                .eq(Project::getUserId, userId)
                .orderByAsc(Project::getSortOrder)
                .orderByDesc(Project::getId);
        return projectMapper.selectPage(p, q);
    }

    @Transactional
    public Project create(Long userId, String name) {
        // 新建项目 sort_order 取当前最大 + 1(放最后),前端要求倒序可在 UI 反转
        Integer maxOrder = projectMapper.selectList(
                        new LambdaQueryWrapper<Project>()
                                .select(Project::getSortOrder)
                                .eq(Project::getUserId, userId)
                                .orderByDesc(Project::getSortOrder)
                                .last("LIMIT 1"))
                .stream().findFirst().map(Project::getSortOrder).orElse(-1);

        Project p = new Project();
        p.setUserId(userId);
        p.setName(name);
        p.setSortOrder(maxOrder + 1);
        projectMapper.insert(p);
        return p;
    }

    /**
     * 查并校验项目归属。非自己的项目抛 403。
     */
    @Transactional(readOnly = true)
    public Project getOwnedById(Long projectId, Long userId) {
        Project p = projectMapper.selectById(projectId);
        if (p == null) {
            throw new BusinessException(ResultCode.RESOURCE_NOT_FOUND, "项目不存在");
        }
        if (!p.getUserId().equals(userId)) {
            throw new BusinessException(ResultCode.FORBIDDEN_OWNER);
        }
        return p;
    }

    @Transactional
    public Project update(Long projectId, Long userId, String name, Integer sortOrder) {
        Project p = getOwnedById(projectId, userId);
        if (name == null && sortOrder == null) {
            // 无变更字段直接返回,不触发 updated_at churn
            return p;
        }
        if (name != null) {
            p.setName(name);
        }
        if (sortOrder != null) {
            p.setSortOrder(sortOrder);
        }
        // WHERE 钉死 user_id 防 TOCTOU 越权写。受影响行 0 抛 RESOURCE_NOT_FOUND
        int affected = projectMapper.update(p, new LambdaUpdateWrapper<Project>()
                .eq(Project::getId, projectId)
                .eq(Project::getUserId, userId));
        if (affected == 0) {
            throw new BusinessException(ResultCode.RESOURCE_NOT_FOUND, "项目不存在");
        }
        return p;
    }

    @Transactional
    public void delete(Long projectId, Long userId) {
        getOwnedById(projectId, userId);
        // WHERE 钉死 user_id 防 TOCTOU
        int affected = projectMapper.delete(new LambdaQueryWrapper<Project>()
                .eq(Project::getId, projectId)
                .eq(Project::getUserId, userId));
        if (affected == 0) {
            throw new BusinessException(ResultCode.RESOURCE_NOT_FOUND, "项目不存在");
        }
    }

    /**
     * 批量重排。数组顺序 = 新的 sort_order(从 0 起)。
     * <p>
     * 死锁防御:Service 内按 id 升序 update,避免两个并发事务交叉锁行。
     */
    @Transactional
    public void reorder(Long userId, List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return;
        }
        // 取出所有候选项目,一次校验归属
        List<Project> projects = projectMapper.selectBatchIds(new HashSet<>(ids));
        Map<Long, Project> byId = projects.stream().collect(Collectors.toMap(Project::getId, Function.identity()));

        Set<Long> seen = new HashSet<>();
        for (Long pid : ids) {
            if (!seen.add(pid)) {
                throw new BusinessException(ResultCode.PARAM_INVALID, "ids 包含重复值");
            }
            Project p = byId.get(pid);
            // 与单 CRUD 错误码一致(404/403 分档),但错误消息不带 id 防 IDOR 枚举
            if (p == null) {
                throw new BusinessException(ResultCode.RESOURCE_NOT_FOUND, "项目不存在");
            }
            if (!p.getUserId().equals(userId)) {
                throw new BusinessException(ResultCode.FORBIDDEN_OWNER, "无权访问该项目");
            }
        }

        // 按 id 升序 update 防死锁
        List<Long> sorted = ids.stream().sorted().toList();
        Map<Long, Integer> newOrder = new java.util.HashMap<>();
        for (int i = 0; i < ids.size(); i++) {
            newOrder.put(ids.get(i), i);
        }
        for (Long pid : sorted) {
            Project p = byId.get(pid);
            p.setSortOrder(newOrder.get(pid));
            projectMapper.updateById(p);
        }
    }
}
