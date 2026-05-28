package com.ideabox.api.config;

import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.core.handlers.MetaObjectHandler;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import java.time.LocalDateTime;
import org.apache.ibatis.reflection.MetaObject;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

/**
 * MyBatis-Plus 配置:分页插件 + 时间戳自动填充。
 */
@Configuration
public class MybatisPlusConfig {

    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.POSTGRE_SQL));
        return interceptor;
    }

    /**
     * 创建/更新时间自动填充。entity 字段加 @TableField(fill=...) 即生效。
     */
    @Component
    public static class TimeFieldFillHandler implements MetaObjectHandler {

        @Override
        public void insertFill(MetaObject meta) {
            LocalDateTime now = LocalDateTime.now();
            strictInsertFill(meta, "createdAt", LocalDateTime.class, now);
            strictInsertFill(meta, "updatedAt", LocalDateTime.class, now);
        }

        @Override
        public void updateFill(MetaObject meta) {
            strictUpdateFill(meta, "updatedAt", LocalDateTime.class, LocalDateTime.now());
        }
    }
}
