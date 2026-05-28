/**
 * 文案常量。所有 UI 文字集中此处,禁组件 hardcode。
 * 全局规则 12 禁魔法值;PR-3 § 4.2。
 */
export const COPY = {
  // App
  appName: "IdeaBox",

  // Auth
  authWechatPlaceholder: "微信扫码登录(开发中)",
  authLoginFailed: "登录失败,请重试",

  // Project
  projectNew: "+ 新建项目",
  projectNewPlaceholder: "项目名",
  projectEmpty: "还没有项目,点击 + 开始",
  projectMenuRename: "重命名",
  projectMenuDelete: "删除",
  projectDeleteConfirm: "删除项目会一并删除所有想法,确定?",
  projectCreated: "已创建项目",
  projectDeleted: "已删除项目",

  // Idea
  ideaInputPlaceholder: "输入新想法,Enter 发送 / Shift+Enter 换行",
  ideaInputNoProject: "请先选择项目",
  ideaListEmpty: "记录你的第一个想法吧",
  ideaCreated: "已记录",
  ideaUpdated: "已更新",
  ideaDeleted: "已删除",
  ideaDeleteUndo: "撤销",
  ideaOverLimit: (used: number, max: number): string => `${used} / ${max} 字`,
  ideaCompletedSection: (count: number): string => `── 已完成 (${count}) ──`,
  ideaExpand: "展开",
  ideaCollapse: "收起",
  ideaEditModalTitle: "编辑想法",
  ideaEditSave: "保存",
  ideaEditCancel: "取消",
  ideaReorderFailed: "排序失败,请重试",

  // Common
  loading: "加载中…",
  loadingSlow: "加载缓慢,请检查网络",
  networkError: "网络异常,请重试",
  retry: "重试",
  save: "保存",
  cancel: "取消",
  delete: "删除",
  unauthorized: "未授权",
  forbidden: "无权访问",
  notFound: "资源已删除",
  systemError: "服务异常",
  notImplemented: "功能开发中",
} as const;

/** 字数上限(与后端 IdeaCreateReq @Size(max=5000) 对齐) */
export const IDEA_CONTENT_MAX = 5000;
export const PROJECT_NAME_MAX = 100;

/** 拖拽 debounce 毫秒(PR-3 ADR-17) */
export const REORDER_DEBOUNCE_MS = 300;

/** dnd-kit 拖拽激活距离(PR-3 § 4.8 手势冲突) */
export const DND_ACTIVATION_DISTANCE = 8;

/** Toast 持续时间 */
export const TOAST_DURATION_MS = {
  success: 2000,
  error: 5000,
  info: 3000,
} as const;

/** Toast 队列上限(PR-3 ADR-20) */
export const TOAST_MAX_CONCURRENT = 3;

/** 删除 undo 窗口(PR-3 ADR-10) */
export const DELETE_UNDO_MS = 5000;

/** Skeleton 显示窗口(PR-3 § 3.11) */
export const SKELETON_MIN_MS = 200;
export const SKELETON_MAX_MS = 5000;

/** 空闲自动登出毫秒(PR-3 ADR-18 XSS 缓解) */
export const IDLE_LOGOUT_MS = 30 * 60 * 1000;

/** localStorage key */
export const LS_TOKEN_KEY = "ideabox.jwt";
export const LS_EXPIRES_KEY = "ideabox.jwt.expires";
