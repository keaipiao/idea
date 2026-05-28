package com.ideabox.api.common.jwt;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.ideabox.api.config.JwtProperties;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import java.lang.reflect.Field;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class JwtUtilTest {

    private JwtUtil jwtUtil;
    private JwtProperties props;

    @BeforeEach
    void setUp() {
        props = new JwtProperties();
        props.setSecret("a_very_strong_secret_that_is_at_least_32_bytes_long_for_test");
        props.setExpirationHours(1);
        props.setIssuer("test-issuer");
        jwtUtil = new JwtUtil(props);
    }

    @Test
    @DisplayName("签发后能解析出相同 userId")
    void issueAndParseRoundtrip() {
        String token = jwtUtil.issue(42L);
        Long parsed = jwtUtil.parseUserId(token);
        assertThat(parsed).isEqualTo(42L);
    }

    @Test
    @DisplayName("不同 userId 签出的 token 不同")
    void differentUsersDifferentTokens() {
        String t1 = jwtUtil.issue(1L);
        String t2 = jwtUtil.issue(2L);
        assertThat(t1).isNotEqualTo(t2);
    }

    @Test
    @DisplayName("过期 token 解析抛 ExpiredJwtException")
    void expiredTokenThrows() throws Exception {
        // 把过期时间设成 -1 小时(已经过期)
        setField(props, "expirationHours", -1);
        String token = jwtUtil.issue(1L);
        assertThatThrownBy(() -> jwtUtil.parseUserId(token))
                .isInstanceOf(ExpiredJwtException.class);
    }

    @Test
    @DisplayName("篡改后的 token 解析抛 JwtException")
    void tamperedTokenThrows() {
        String token = jwtUtil.issue(1L) + "x";
        assertThatThrownBy(() -> jwtUtil.parseUserId(token))
                .isInstanceOf(JwtException.class);
    }

    @Test
    @DisplayName("用另一个 secret 签的 token 当前 JwtUtil 解析失败")
    void wrongSecretThrows() {
        JwtProperties other = new JwtProperties();
        other.setSecret("another_strong_secret_that_is_at_least_32_bytes_long_xxx");
        other.setExpirationHours(1);
        other.setIssuer("test-issuer");
        JwtUtil otherUtil = new JwtUtil(other);

        String foreignToken = otherUtil.issue(1L);
        assertThatThrownBy(() -> jwtUtil.parseUserId(foreignToken))
                .isInstanceOf(JwtException.class);
    }

    @Test
    @DisplayName("issuer 不匹配抛 JwtException")
    void wrongIssuerThrows() {
        JwtProperties other = new JwtProperties();
        other.setSecret(props.getSecret());
        other.setExpirationHours(1);
        other.setIssuer("foreign-issuer");
        JwtUtil otherUtil = new JwtUtil(other);

        String foreignToken = otherUtil.issue(1L);
        assertThatThrownBy(() -> jwtUtil.parseUserId(foreignToken))
                .isInstanceOf(JwtException.class);
    }

    /** 反射改私有字段(仅测试用,避免暴露 setter) */
    private static void setField(Object target, String name, Object value) throws Exception {
        Field f = target.getClass().getDeclaredField(name);
        f.setAccessible(true);
        f.set(target, value);
    }
}
