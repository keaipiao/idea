-- 把 t_project / t_idea 外键从 ON DELETE CASCADE 改为 ON DELETE RESTRICT。
-- 理由:删除 user 不应物理穿透清空所有项目和想法。账号合并/恢复/误删保留可能。
-- 业务侧账号删除应走显式 service 逐表删除 + 审计日志。

ALTER TABLE t_project
    DROP CONSTRAINT t_project_user_id_fkey,
    ADD CONSTRAINT t_project_user_id_fkey FOREIGN KEY (user_id) REFERENCES t_user(id) ON DELETE RESTRICT;

ALTER TABLE t_idea
    DROP CONSTRAINT t_idea_project_id_fkey,
    ADD CONSTRAINT t_idea_project_id_fkey FOREIGN KEY (project_id) REFERENCES t_project(id) ON DELETE RESTRICT;

COMMENT ON CONSTRAINT t_project_user_id_fkey ON t_project IS '所属用户外键(RESTRICT - 删用户需先清空项目)';
COMMENT ON CONSTRAINT t_idea_project_id_fkey ON t_idea IS '所属项目外键(RESTRICT - 删项目需先清空想法)';
