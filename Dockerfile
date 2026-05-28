# IdeaBox Backend — Spring Boot 3.5.3 + Java 21 多阶段构建
# PR-3 补建以支撑 docker-compose.prod.yml V5 prod 预演
# (PR-1 未建后端 Dockerfile;此文件可视为 PR-3 顺手补的部署基础设施)

# Stage 1: 构建
FROM maven:3.9-eclipse-temurin-21-alpine AS builder
WORKDIR /app

# 先拷贝 pom 解决依赖(利用 Docker layer cache)
COPY pom.xml ./
RUN mvn dependency:go-offline -B -q

# 拷贝源码 + 打包
COPY src ./src
RUN mvn package -DskipTests -B -q

# Stage 2: 运行
FROM eclipse-temurin:21-jre-alpine AS runner
WORKDIR /app

# 非 root 用户
RUN addgroup -S spring && adduser -S spring -G spring

# 拷贝 fat jar(spring-boot-maven-plugin 默认产物)
COPY --from=builder --chown=spring:spring /app/target/*.jar app.jar

USER spring
EXPOSE 8080

# JVM 推荐参数:容器内存感知 + 时区
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Duser.timezone=Asia/Shanghai"

# Spring Boot 接收 SIGTERM 优雅退出
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
