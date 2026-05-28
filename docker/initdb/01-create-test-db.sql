-- 自动建 ideabox_test database 供 IntegrationTestBase 使用。
-- PostgreSQL 镜像首次启动时执行(仅一次,挂在 /docker-entrypoint-initdb.d/)。
-- 之后用户改密码或重建容器会重新跑(因 named volume 持久化,故第二次启动不再执行)。

CREATE DATABASE ideabox_test OWNER ideabox;
