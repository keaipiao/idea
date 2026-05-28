package com.ideabox.api.common;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class PageResultTest {

    @Test
    @DisplayName("normalizePage 把 0/负数归一到 1")
    void normalizePageClampsToOne() {
        assertThat(PageResult.normalizePage(0)).isEqualTo(1);
        assertThat(PageResult.normalizePage(-5)).isEqualTo(1);
        assertThat(PageResult.normalizePage(1)).isEqualTo(1);
        assertThat(PageResult.normalizePage(100)).isEqualTo(100);
    }

    @Test
    @DisplayName("normalizeSize 把 0/负数归一到 1,>MAX 归一到 MAX")
    void normalizeSizeClamps() {
        assertThat(PageResult.normalizeSize(0)).isEqualTo(1);
        assertThat(PageResult.normalizeSize(-1)).isEqualTo(1);
        assertThat(PageResult.normalizeSize(50)).isEqualTo(50);
        assertThat(PageResult.normalizeSize(PageResult.MAX_SIZE)).isEqualTo(PageResult.MAX_SIZE);
        assertThat(PageResult.normalizeSize(10000)).isEqualTo(PageResult.MAX_SIZE);
    }
}
