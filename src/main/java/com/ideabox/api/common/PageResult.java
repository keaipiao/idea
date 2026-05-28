package com.ideabox.api.common;

import com.baomidou.mybatisplus.core.metadata.IPage;
import java.util.List;
import java.util.function.Function;
import lombok.Builder;
import lombok.Data;

/**
 * 统一分页响应包。
 *
 * @param <T> 记录类型
 */
@Data
@Builder
public class PageResult<T> {

    /** 单次请求允许的最大 size,防 `?size=10000` 拖垮 */
    public static final long MAX_SIZE = 200L;

    /** 当前页记录 */
    private List<T> records;
    /** 总数 */
    private long total;
    /** 当前页码(从 1 起) */
    private long page;
    /** 每页大小 */
    private long size;
    /** 总页数 */
    private long pages;

    /** 把 MyBatis-Plus 的 IPage 转换为 PageResult,可选 mapper 把 entity 转 VO */
    public static <E, V> PageResult<V> from(IPage<E> p, Function<E, V> mapper) {
        return PageResult.<V>builder()
                .records(p.getRecords().stream().map(mapper).toList())
                .total(p.getTotal())
                .page(p.getCurrent())
                .size(p.getSize())
                .pages(p.getPages())
                .build();
    }

    /** 规范化分页参数,防 ?page=0 / ?size=10000 等异常输入 */
    public static long normalizePage(long page) {
        return page < 1 ? 1 : page;
    }

    public static long normalizeSize(long size) {
        if (size < 1) return 1;
        return Math.min(size, MAX_SIZE);
    }
}
