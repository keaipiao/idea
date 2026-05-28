package com.ideabox.api.config;

import com.ideabox.api.common.jwt.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Spring Security 配置。
 * <ul>
 *   <li>无状态(JWT),禁 CSRF / 表单登录 / HTTP Basic</li>
 *   <li>白名单精确路径:/actuator/health、/api/auth/login/{dev,mp}、/druid/**、/error</li>
 *   <li>其余路径默认 denied 由 JwtAuthFilter 校验,filter 内 set Authentication 才允许通过</li>
 *   <li>CORS 走 {@link CorsConfig} 暴露的 CorsConfigurationSource bean</li>
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
                .cors(Customizer.withDefaults())  // 走 CorsConfigurationSource bean
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // 健康检查
                        .requestMatchers("/actuator/health", "/actuator/health/**").permitAll()
                        // 登录精确白名单(不要前缀通配,防新增 endpoint 自动免鉴权)
                        .requestMatchers("/api/auth/login/dev", "/api/auth/login/mp").permitAll()
                        // Druid 内部 allow 列表兜底
                        .requestMatchers("/druid/**").permitAll()
                        .requestMatchers("/error").permitAll()
                        // OPTIONS 预检放行(CORS)
                        .requestMatchers(org.springframework.http.HttpMethod.OPTIONS).permitAll()
                        // 其余路径要求已鉴权(由 JwtAuthFilter set authentication)
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
