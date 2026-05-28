-- ========== 用户表 ==========
CREATE TABLE t_user (
    id BIGSERIAL PRIMARY KEY,
    union_id VARCHAR(64),
    open_id_mp VARCHAR(64),
    open_id_web VARCHAR(64),
    nickname VARCHAR(64),
    avatar_url VARCHAR(512),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE  t_user             IS '用户表 - 多端身份关联';
COMMENT ON COLUMN t_user.id          IS '主键';
COMMENT ON COLUMN t_user.union_id    IS '微信开放平台 unionid(PR-4 接入后填充)';
COMMENT ON COLUMN t_user.open_id_mp  IS '小程序 openid';
COMMENT ON COLUMN t_user.open_id_web IS '网页应用 openid';
COMMENT ON COLUMN t_user.nickname    IS '微信昵称';
COMMENT ON COLUMN t_user.avatar_url  IS '头像 URL';
COMMENT ON COLUMN t_user.created_at  IS '创建时间';
COMMENT ON COLUMN t_user.updated_at  IS '更新时间';

CREATE UNIQUE INDEX uk_user_union_id    ON t_user(union_id)    WHERE union_id    IS NOT NULL;
CREATE UNIQUE INDEX uk_user_open_id_mp  ON t_user(open_id_mp)  WHERE open_id_mp  IS NOT NULL;
CREATE UNIQUE INDEX uk_user_open_id_web ON t_user(open_id_web) WHERE open_id_web IS NOT NULL;


-- ========== 项目表 ==========
CREATE TABLE t_project (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES t_user(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE  t_project            IS '项目表';
COMMENT ON COLUMN t_project.id         IS '主键';
COMMENT ON COLUMN t_project.user_id    IS '所属用户 id';
COMMENT ON COLUMN t_project.name       IS '项目名称';
COMMENT ON COLUMN t_project.sort_order IS '排序序号(数值小靠前)';
COMMENT ON COLUMN t_project.created_at IS '创建时间';
COMMENT ON COLUMN t_project.updated_at IS '更新时间';

CREATE INDEX idx_project_user ON t_project(user_id, sort_order);


-- ========== 想法表 ==========
CREATE TABLE t_idea (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES t_project(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    completed_at TIMESTAMP,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE  t_idea              IS '想法表';
COMMENT ON COLUMN t_idea.id           IS '主键';
COMMENT ON COLUMN t_idea.project_id   IS '所属项目 id';
COMMENT ON COLUMN t_idea.content      IS '想法内容(纯文本)';
COMMENT ON COLUMN t_idea.completed_at IS '完成时间(NULL=未完成,有值=已完成)';
COMMENT ON COLUMN t_idea.sort_order   IS '排序序号';
COMMENT ON COLUMN t_idea.created_at   IS '创建时间';
COMMENT ON COLUMN t_idea.updated_at   IS '更新时间';

CREATE INDEX idx_idea_project ON t_idea(project_id, completed_at, sort_order);
