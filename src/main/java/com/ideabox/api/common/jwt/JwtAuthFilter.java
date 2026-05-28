package com.ideabox.api.common.jwt;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ideabox.api.common.Result;
import com.ideabox.api.common.ResultCode;
import com.ideabox.api.common.UserContext;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.UrlPathHelper;

/**
 * JWT 鉴权过滤器。
 * <p>
 * 流程:
 * <ol>
 *   <li>白名单路径直接放行(不解析 token)</li>
 *   <li>取 {@code Authorization: Bearer <token>},缺失 → Result 401003</li>
 *   <li>解析 token,过期 → 401001,无效 → 401002</li>
 *   <li>成功:set UserContext + Spring Security Authentication,放行</li>
 *   <li>finally 清理 UserContext(避免线程池复用泄漏)</li>
 * </ol>
 * <p>
 * 异常不抛给 Spring Security 默认 handler,直接写 Result JSON 给前端。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final String HEADER = "Authorization";
    private static final String PREFIX = "Bearer ";

    /** 不需要鉴权的路径前缀 */
    private static final List<String> WHITELIST = List.of(
            "/api/auth/login/",
            "/actuator/",
            "/druid/",
            "/error"
    );

    private final JwtUtil jwtUtil;
    private final ObjectMapper objectMapper;
    private final UrlPathHelper pathHelper = new UrlPathHelper();

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse resp, FilterChain chain)
            throws ServletException, IOException {

        String path = pathHelper.getPathWithinApplication(req);

        // 白名单 + 非 /api/ 路径放行(后者交给 Spring Security 兜底,允许 OPTIONS 预检等)
        if (isWhitelisted(path) || !path.startsWith("/api/")) {
            chain.doFilter(req, resp);
            return;
        }

        String header = req.getHeader(HEADER);
        if (header == null || !header.startsWith(PREFIX)) {
            writeResult(resp, ResultCode.JWT_MISSING);
            return;
        }

        String token = header.substring(PREFIX.length()).trim();
        try {
            Long userId = jwtUtil.parseUserId(token);
            UserContext.setUserId(userId);

            // 同步给 Spring Security,使后续 @PreAuthorize 等正常工作(预留)
            var auth = new UsernamePasswordAuthenticationToken(userId, null, List.of());
            SecurityContextHolder.getContext().setAuthentication(auth);

            chain.doFilter(req, resp);
        } catch (ExpiredJwtException ex) {
            writeResult(resp, ResultCode.JWT_EXPIRED);
        } catch (JwtException | IllegalArgumentException ex) {
            log.debug("[JWT] 解析失败: {}", ex.getMessage());
            writeResult(resp, ResultCode.JWT_INVALID);
        } finally {
            UserContext.clear();
            SecurityContextHolder.clearContext();
        }
    }

    private boolean isWhitelisted(String path) {
        for (String prefix : WHITELIST) {
            if (path.startsWith(prefix)) {
                return true;
            }
        }
        return false;
    }

    private void writeResult(HttpServletResponse resp, ResultCode rc) throws IOException {
        resp.setStatus(rc.getHttpStatus());
        resp.setContentType(MediaType.APPLICATION_JSON_VALUE);
        resp.setCharacterEncoding("UTF-8");
        resp.getWriter().write(objectMapper.writeValueAsString(Result.fail(rc)));
    }
}
