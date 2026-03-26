# storyboard-copilot-web - 主计划

> 状态: IN_PROGRESS
> 创建: 2026-03-25
> 更新: 2026-03-25
> 团队: storyboard-copilot-web (auth-dev, image-dev, db-dev, canvas-dev, ai-dev, video-dev, reviewer)
> 决策记录: .plans/storyboard-copilot-web/decisions.md

---

## 1. 项目概述

基于桌面版 Storyboard-Copilot（Tauri 2 + Rust）升级扩展为 Web SaaS 产品，覆盖全球和中国市场。
核心功能：节点画布 + 图片 AI 生成/编辑 + 视频生成 + 分镜工具，配合 Supabase Auth + 支付体系。

详细产品定义 → docs/implementation-plan.md（项目根目录）

---

## 2. 文档索引

| 文档 | 位置 | 内容 |
|------|------|------|
| 架构 | .plans/storyboard-copilot-web/docs/architecture.md | 系统组件、数据流、关键设计决策 |
| API 契约 | .plans/storyboard-copilot-web/docs/api-contracts.md | 前后端接口定义 |
| 不变量 | .plans/storyboard-copilot-web/docs/invariants.md | 不可违反的系统边界 |
| 实现计划 | docs/implementation-plan.md | 各阶段详细任务清单 |
| 系统设计 | docs/system-design-plan.md | 系统架构设计 |

---

## 3. 阶段概览

### Phase 0（当前：Wave 1 并行进行）

| 工作流 | Agent | worktree | 状态 |
|--------|-------|----------|------|
| A: Auth + App Shell | auth-dev | D:/ws-auth-shell | in_progress |
| F: 图片处理 API | image-dev | D:/ws-image-processing | in_progress |

### Phase 1（Wave 1 同步：DB先行；Wave 2：C跟进）

| 工作流 | Agent | worktree | 状态 |
|--------|-------|----------|------|
| B: DB Schema + 持久化 | db-dev | D:/ws-project-persistence | done |
| C: 画布 + 节点 | canvas-dev | D:/ws-canvas-nodes | in_progress |

### Phase 2（Wave 2：D先行；Wave 3：E跟进）

| 工作流 | Agent | worktree | 状态 |
|--------|-------|----------|------|
| D: 服务端 AI Provider | ai-dev | D:/ws-ai-providers | in_progress |
| E: 服务端视频 Provider | video-dev | D:/ws-video-providers | blocked（等D的KIE Common） |

---

## 4. 任务汇总

| # | 任务 | 负责人 | 状态 | 计划文件 |
|---|------|--------|------|----------|
| T-A | Phase 0 - Auth + App Shell | auth-dev | in_progress | .plans/storyboard-copilot-web/auth-dev/task_plan.md |
| T-F | Phase 0 - 图片处理 API | image-dev | in_progress | .plans/storyboard-copilot-web/image-dev/task_plan.md |
| T-B | Phase 1 - DB Schema + 持久化 | db-dev | in_progress | .plans/storyboard-copilot-web/db-dev/task_plan.md |
| T-C | Phase 1 - 画布 + 节点 | canvas-dev | blocked | .plans/storyboard-copilot-web/canvas-dev/task_plan.md |
| T-D | Phase 2 - AI Provider | ai-dev | blocked | .plans/storyboard-copilot-web/ai-dev/task_plan.md |
| T-E | Phase 2 - 视频 Provider | video-dev | blocked | .plans/storyboard-copilot-web/video-dev/task_plan.md |

---

## 5. 并行策略

```
Wave 1（同时启动）: auth-dev + image-dev + db-dev
Wave 2（B完成后）:  canvas-dev + ai-dev
Wave 3（D完成后）:  video-dev
```

### 解锁条件

- canvas-dev 解锁：db-dev 完成 B.2（项目 CRUD API）+ B.3（草稿 API）
- ai-dev 解锁：db-dev 完成 B.1（含 005_ai_jobs.sql）
- video-dev 解锁：ai-dev 完成 D.1（AI Provider 接口）+ D.3（KIE 共享基础设施）

---

## 6. 当前阶段

Wave 1 正在并行开发中：
- auth-dev → Phase 0 工作流 A（脚手架 + 认证 + Shell）
- image-dev → Phase 0 工作流 F（sharp 图片处理 API）
- db-dev → Phase 1 工作流 B（数据库 schema + 持久化）

下一里程碑：Wave 1 三个 agent 各自提 PR，合并后解锁 Wave 2。
