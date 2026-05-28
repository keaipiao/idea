package com.ideabox.api.idea.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ideabox.api.idea.entity.Idea;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface IdeaMapper extends BaseMapper<Idea> {
}
