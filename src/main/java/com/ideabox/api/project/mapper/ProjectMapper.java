package com.ideabox.api.project.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ideabox.api.project.entity.Project;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ProjectMapper extends BaseMapper<Project> {
}
