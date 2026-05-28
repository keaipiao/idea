package com.ideabox.api.common;

/**
 * 当前请求用户上下文(线程隔离)。
 * <p>
 * JwtAuthFilter 解析 token 成功后 set,filter chain 结束 remove。
 * Service 层通过 {@link #requireUserId()} 拿当前 userId。
 * <p>
 * <strong>禁止跨线程使用</strong>:目前无 @Async,未来引入异步任务时升级为 TransmittableThreadLocal。
 */
public final class UserContext {

    private static final ThreadLocal<Long> CURRENT_USER_ID = new ThreadLocal<>();

    private UserContext() {
    }

    public static void setUserId(Long userId) {
        CURRENT_USER_ID.set(userId);
    }

    public static Long getUserId() {
        return CURRENT_USER_ID.get();
    }

    /** 取当前 userId,缺失抛 JWT_MISSING(理论上 filter 已拦,这里是兜底) */
    public static Long requireUserId() {
        Long uid = CURRENT_USER_ID.get();
        if (uid == null) {
            throw new BusinessException(ResultCode.JWT_MISSING);
        }
        return uid;
    }

    public static void clear() {
        CURRENT_USER_ID.remove();
    }
}
