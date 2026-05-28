package com.ideabox.api.config;

import jakarta.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * JWT 配置项。
 * <p>
 * 启动时校验 secret 至少 32 字节(HS256 安全要求),缺失/过短 fail-fast。
 */
@Data
@Component
@ConfigurationProperties(prefix = "ideabox.jwt")
public class JwtProperties {

    /** HMAC-SHA256 签名密钥,必须 >= 32 字节 */
    private String secret;
    /** 有效期(小时) */
    private int expirationHours = 168;
    /** 签发方 */
    private String issuer = "ideabox-api";

    @PostConstruct
    void validate() {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException(
                    "ideabox.jwt.secret 必须配置且 >= 32 字节(HS256 安全要求)。"
                            + "请设置环境变量 IDEABOX_JWT_SECRET,使用 openssl rand -base64 48 生成");
        }
        if (expirationHours <= 0) {
            throw new IllegalStateException("ideabox.jwt.expiration-hours 必须 > 0");
        }
    }
}
