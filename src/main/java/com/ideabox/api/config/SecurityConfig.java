package com.ideabox.api.config;

import com.ideabox.api.common.jwt.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Spring Security 配置。
 * <ul>
 *   <li>无状态(JWT),禁 CSRF / 表单登录 / HTTP Basic</li>
 *   <li>白名单:/actuator/health、/api/auth/login/**、/druid/**</li>
 *   <li>其余路径全开放给 Filter 链,鉴权由 JwtAuthFilter 完成</li>
 * </ul>
 */
@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> {})
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/actuator/health", "/actuator/health/**").permitAll()
                        .requestMatchers("/api/auth/login/**").permitAll()
                        .requestMatchers("/druid/**").permitAll()  // Druid 内部 deny/allow 控制
                        .requestMatchers("/error").permitAll()
                        .anyRequest().permitAll()  // 鉴权由 JwtAuthFilter 处理,这里全放
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
