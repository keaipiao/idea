package com.ideabox.api;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.ideabox.api.common.ResultCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

@org.springframework.transaction.annotation.Transactional
class AuthIntegrationTest extends IntegrationTestBase {

    // ========== 金路径 ==========

    @Test
    @DisplayName("POST /api/auth/login/dev 返 token + 用户")
    void devLoginReturnsTokenAndUser() throws Exception {
        mockMvc.perform(post("/api/auth/login/dev")
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.user.id").value(1))
                .andExpect(jsonPath("$.data.user.nickname").value("开发测试用户"));
    }

    @Test
    @DisplayName("GET /api/users/me 带种子 JWT 返用户")
    void getMeReturnsUser() throws Exception {
        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + devUserToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.id").value(1));
    }

    // ========== NEG case 6/6 ==========

    @Test
    @DisplayName("NEG1: Authorization 缺失 → 401003")
    void missingAuthHeader() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(ResultCode.JWT_MISSING.getCode()));
    }

    @Test
    @DisplayName("NEG2: 错签 JWT → 401002")
    void invalidSignatureToken() throws Exception {
        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer eyJhbGciOiJIUzI1NiJ9.invalid.token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(ResultCode.JWT_INVALID.getCode()));
    }

    @Test
    @DisplayName("NEG3: 过期 JWT → 401001")
    void expiredToken() throws Exception {
        // 直接用 jjwt 签一个已过期 token
        String expired = io.jsonwebtoken.Jwts.builder()
                .issuer("ideabox-api")
                .subject("1")
                .claim("uid", 1L)
                .issuedAt(new java.util.Date(System.currentTimeMillis() - 3600_000))
                .expiration(new java.util.Date(System.currentTimeMillis() - 1000))
                .signWith(new javax.crypto.spec.SecretKeySpec(
                        "test_secret_that_is_definitely_at_least_32_bytes_long_xxx_yyy".getBytes(),
                        "HmacSHA256"), io.jsonwebtoken.Jwts.SIG.HS256)
                .compact();

        mockMvc.perform(get("/api/users/me").header("Authorization", "Bearer " + expired))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(ResultCode.JWT_EXPIRED.getCode()));
    }

    @Test
    @DisplayName("NEG4: 格式错误 Authorization 头(无 Bearer 前缀) → 401003")
    void malformedAuthHeader() throws Exception {
        mockMvc.perform(get("/api/users/me").header("Authorization", "abc"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(ResultCode.JWT_MISSING.getCode()));
    }

    @Test
    @DisplayName("微信小程序登录占位返 501")
    void wxMpLoginReturns501() throws Exception {
        mockMvc.perform(post("/api/auth/login/mp")
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isNotImplemented())
                .andExpect(jsonPath("$.code").value(ResultCode.NOT_IMPLEMENTED.getCode()))
                .andExpect(jsonPath("$.message", containsString("PR-4")));
    }
}
