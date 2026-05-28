package com.ideabox.api;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * IdeaBox 后端启动类。
 * <p>
 * 包扫描:com.ideabox.api 下全部模块(user / auth / project / idea / config / common)。
 * MyBatis Mapper 接口扫描见 {@link MapperScan}。
 */
@SpringBootApplication
@MapperScan("com.ideabox.api.**.mapper")
public class IdeaboxApplication {

    public static void main(String[] args) {
        SpringApplication.run(IdeaboxApplication.class, args);
    }
}
