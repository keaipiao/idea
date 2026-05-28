package com.ideabox.api.config;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class JwtPropertiesTest {

    @Test
    @DisplayName("secret 缺失启动 fail-fast")
    void missingSecretFailsFast() {
        JwtProperties p = new JwtProperties();
        assertThatThrownBy(p::validate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("ideabox.jwt.secret");
    }

    @Test
    @DisplayName("secret 短于 32 字节启动 fail-fast")
    void shortSecretFailsFast() {
        JwtProperties p = new JwtProperties();
        p.setSecret("short");
        assertThatThrownBy(p::validate).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("expiration <= 0 启动 fail-fast")
    void nonPositiveExpirationFailsFast() {
        JwtProperties p = new JwtProperties();
        p.setSecret("a_very_strong_secret_that_is_at_least_32_bytes_long_xx");
        p.setExpirationHours(0);
        assertThatThrownBy(p::validate).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("合法配置启动通过")
    void validConfigPasses() {
        JwtProperties p = new JwtProperties();
        p.setSecret("a_very_strong_secret_that_is_at_least_32_bytes_long_xx");
        p.setExpirationHours(168);
        assertThatCode(p::validate).doesNotThrowAnyException();
    }
}
