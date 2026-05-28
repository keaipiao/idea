package com.ideabox.api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * Druid 配置占位。
 * <p>
 * 实际监控页 + filter 配置全在 application-dev.yml(starter 接管),此类仅作 profile gate 标识。
 * prod profile 通过 application-prod.yml 关闭监控页。
 */
@Configuration
@Profile("dev")
public class DruidConfig {
    // 配置由 druid-spring-boot-3-starter 通过 application-dev.yml 自动装配
}
