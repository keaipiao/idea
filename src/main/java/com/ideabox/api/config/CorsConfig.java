package com.ideabox.api.config;

import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * CORS 配置。
 * <p>
 * dev profile:暴露 {@link CorsConfigurationSource} bean,Spring Security 通过
 * {@code .cors(Customizer.withDefaults())} 自动接管。允许 localhost 前端开发端口。
 * <p>
 * prod profile:留 PR-3 网页端上线时配白名单。当前 prod 启动时无该 bean,
 * Spring Security CORS handler 处于禁用状态(明确拒绝所有跨域),fail-safe。
 * <p>
 * 小程序请求无 Origin 头,不受 CORS 约束。
 */
@Configuration
public class CorsConfig {

    @Bean
    @Profile("dev")
    public CorsConfigurationSource devCorsConfigurationSource() {
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(List.of(
                "http://localhost:3000",   // Next.js dev
                "http://localhost:5173",   // Vite dev
                "http://127.0.0.1:3000",
                "http://127.0.0.1:5173"
        ));
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        // 显式枚举 + allowCredentials=true(CORS spec 禁止 "*" + credentials 组合)
        cfg.setAllowedHeaders(List.of("Content-Type", "Authorization", "X-Requested-With", "Accept"));
        cfg.setExposedHeaders(List.of("Authorization", "X-Request-Id"));
        cfg.setAllowCredentials(true);
        cfg.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource src = new UrlBasedCorsConfigurationSource();
        src.registerCorsConfiguration("/api/**", cfg);
        return src;
    }
}
