-- 开发期固定测试用户(id=1)。PR-4 接入真微信登录后,此用户保留用于本地开发
INSERT INTO t_user (id, nickname, avatar_url)
VALUES (1, '开发测试用户', 'https://placehold.co/96/1677FF/FFFFFF?text=DEV');

-- 推进序列至当前最大 id,避免后续 INSERT 主键冲突
SELECT setval('t_user_id_seq', GREATEST((SELECT MAX(id) FROM t_user), 1));
