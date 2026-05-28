package com.ideabox.api.config;

import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

/**
 * CORS 配置。
 * <p>
 * dev profile:宽松允许 localhost 前端开发端口。
 * prod profile:留 PR-3 网页端上线时配白名单。
 * <p>
 * 小程序请求无 Origin 头,不受 CORS 约束。
 */
@Configuration
public class CorsConfig {

    @Bean
    @Profile("dev")
    public CorsFilter devCorsFilter() {
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(List.of(
                "http://localhost:3000",   // Next.js dev
                "http://localhost:5173",   // Vite dev
                "http://127.0.0.1:3000",
                "http://127.0.0.1:5173"
        ));
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        cfg.setAllowedHeaders(List.of("*"));
        cfg.setExposedHeaders(List.of("Authorization"));
        cfg.setAllowCredentials(true);
        cfg.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource src = new UrlBasedCorsConfigurationSource();
        src.registerCorsConfiguration("/api/**", cfg);
        return new CorsFilter(src);
    }
}
