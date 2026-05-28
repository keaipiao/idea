package com.ideabox.api.common.jwt;

import com.ideabox.api.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * JWT 签发 + 解析工具。jjwt 0.12.x API。
 */
@Component
@RequiredArgsConstructor
public class JwtUtil {

    private static final String CLAIM_USER_ID = "uid";

    private final JwtProperties props;

    private SecretKey signingKey() {
        return new SecretKeySpec(props.getSecret().getBytes(), "HmacSHA256");
    }

    /**
     * 签发 token。
     *
     * @param userId 用户 id
     * @return token 字符串
     */
    public String issue(Long userId) {
        Instant now = Instant.now();
        Instant exp = now.plus(props.getExpirationHours(), ChronoUnit.HOURS);
        return Jwts.builder()
                .issuer(props.getIssuer())
                .subject(String.valueOf(userId))
                .claim(CLAIM_USER_ID, userId)
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .signWith(signingKey(), Jwts.SIG.HS256)
                .compact();
    }

    /**
     * 计算给定 userId 的 token 过期时刻(不签发,仅用于 login response 中展示)。
     */
    public Instant expirationOf(Instant issuedAt) {
        return issuedAt.plus(props.getExpirationHours(), ChronoUnit.HOURS);
    }

    /**
     * 解析 token,返回 userId。
     *
     * @throws io.jsonwebtoken.ExpiredJwtException     token 过期
     * @throws io.jsonwebtoken.JwtException            签名无效 / 格式错误 / 其他
     */
    public Long parseUserId(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(signingKey())
                .requireIssuer(props.getIssuer())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        Object uid = claims.get(CLAIM_USER_ID);
        if (uid instanceof Number n) {
            return n.longValue();
        }
        // fallback: subject
        return Long.parseLong(claims.getSubject());
    }
}
