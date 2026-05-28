package com.ideabox.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ideabox.api.common.jwt.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

/**
 * 集成测试基类。
 * <p>
 * <strong>非 Testcontainers 方案</strong>:Testcontainers 在 Windows + Docker Desktop WSL2 backend
 * 上 named pipe 探测失败(Testcontainers 1.21.3 在 {@code //./pipe/dockerDesktopLinuxEngine}
 * 上无法识别)。改用共享 dev PG 容器 + 独立 {@code ideabox_test} database,
 * Flyway 自动建表。测试间 @Sql 清表或全靠 @Transactional rollback。
 * <p>
 * 详见 docs/_开发踩坑记录.md D2。
 */
@SpringBootTest
@AutoConfigureMockMvc
@org.springframework.test.context.ActiveProfiles("dev")
public abstract class IntegrationTestBase {

    @DynamicPropertySource
    static void overrideProps(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", () -> "jdbc:postgresql://localhost:5432/ideabox_test");
        r.add("spring.datasource.username", () -> "ideabox");
        r.add("spring.datasource.password", () -> "ideabox_dev_password");

        // 强 secret(32+ 字节)
        r.add("ideabox.jwt.secret", () -> "test_secret_that_is_definitely_at_least_32_bytes_long_xxx_yyy");
        r.add("ideabox.jwt.expiration-hours", () -> "1");

        // 关 Druid 监控页 + filter(测试场景不需要)
        r.add("spring.datasource.druid.stat-view-servlet.enabled", () -> "false");
        r.add("spring.datasource.druid.web-stat-filter.enabled", () -> "false");
        r.add("spring.datasource.druid.filter.wall.enabled", () -> "false");
    }

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    protected JwtUtil jwtUtil;

    /** 拿种子 dev 用户(id=1)的 JWT */
    protected String devUserToken() {
        return jwtUtil.issue(1L);
    }

    /** 模拟另一个用户的 JWT(uid 不存在也能签;用于跨用户访问测试) */
    protected String otherUserToken(long uid) {
        return jwtUtil.issue(uid);
    }
}
