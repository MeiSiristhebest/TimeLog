# TimeLog Proposal Alignment Remediation Report
Date: 2026-02-14  
Scope: Wave A/B（F3.1、F3.4、Gallery Search、IO 边界、Recovery Code、create_profile 队列）

## 1. 承诺-证据-风险-整改计划矩阵
| ID | 承诺项 | 整改前状态 | 本次整改动作 | 代码证据 | 测试证据 | 整改后状态 | 残余风险 / 后续计划 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F3.1 | Discovery 本地预置题库离线可用（本地优先+远端补充） | 部分对齐 | 新增本地题库基座；远端/家庭题并行拉取；按 question_text 归一化去重；家庭题置顶；分类统一 `expandCategories` | `src/features/discovery/services/discoveryService.ts:136`, `src/features/discovery/services/discoveryService.ts:163` | `src/features/discovery/services/discoveryService.test.ts:131` | 已完成 | 可进一步增加本地题库版本号与灰度更新策略 |
| F3.4 | Discovery “Try another”随机语义 | 未对齐（顺序轮转） | `handleNextCard` 改为随机且不立即重复当前题 | `src/features/discovery/hooks/useDiscoveryLogic.ts:18`, `src/features/discovery/hooks/useDiscoveryLogic.ts:106` | `src/features/discovery/hooks/useDiscoveryLogic.test.ts:3` | 已完成 | 可补充长序列随机分布统计测试 |
| F2-Should | Gallery Search（标题+转写+主题标签） | 未实现 | `StoriesTabScreen` 增加搜索框；`useStoryGallery` 增加 `searchQuery`/debounce/`matchingTopicIds`；`useStories` 下推到 SQLite 查询层 | `src/features/story-gallery/hooks/useStories.ts:44`, `src/features/story-gallery/hooks/useStoryGallery.ts:18`, `src/features/story-gallery/screens/StoriesTabScreen.tsx:88` | `src/features/story-gallery/hooks/useStories.test.ts:81` | 已完成 | 当前使用 `LIKE`，后续可升级 FTS5 提升大数据量检索性能 |
| ARCH-IO | 外部 IO 边界（screen/component 禁止直接 FileSystem） | 部分对齐 | 头像持久化抽离到 `avatarStorageService`；波形分析缓存抽离到 `waveformAnalysisService`；新增边界规则测试 | `src/features/settings/services/avatarStorageService.ts:10`, `src/features/story-gallery/services/waveformAnalysisService.ts:24`, `tests/integration/filesystem-import-boundary.test.ts:30` | `tests/integration/filesystem-import-boundary.test.ts:30` | 已完成 | 建议后续纳入 ESLint `no-restricted-imports` 静态规则 |
| AUTH-Recovery | Recovery Code 流程真实化（去 mock/TODO） | 部分对齐 | `useRecoveryCodeLogic` 接入 `getActiveRecoveryCode` + `generateRecoveryCode`；页面增加 loading/empty/ready 三态 | `src/features/auth/hooks/useAuthLogic.ts:131`, `src/features/auth/screens/RecoveryCodeScreen.tsx:53`, `src/features/auth/services/recoveryCodeService.ts:74` | `src/features/auth/services/recoveryCodeService.test.ts:51`, `src/features/auth/hooks/useAuthLogic.recovery.test.ts:24` | 已完成 | 可加 e2e 覆盖“复制/分享”平台行为差异 |
| SYNC-Profile | `create_profile` 队列真实实现 | 部分对齐（跳过分支） | 增加 `ProfileSyncPayload`；新增 `enqueueProfileUpsert`；`useProfile` 远端失败自动入队；`processQueue` 实现 `create_profile` update/upsert/retry | `src/types/entities.ts:152`, `src/lib/sync-engine/queue.ts:151`, `src/lib/sync-engine/store.ts:499`, `src/features/settings/hooks/useProfile.ts:216` | `src/lib/sync-engine/queue.test.ts:128`, `src/lib/sync-engine/store.test.ts:322`, `src/features/settings/hooks/useProfile.integration.test.tsx:190` | 已完成 | 建议后续补“会话不可用时暂存不丢弃”的策略测试 |

## 2. 六项整改前后对比（状态变更）
1. F3.1：`部分对齐 -> 已完成`
2. F3.4：`未对齐 -> 已完成`
3. Gallery Search（Should-have）：`未实现 -> 已完成`
4. IO 边界：`部分对齐 -> 已完成`
5. Recovery Code：`部分对齐 -> 已完成`
6. `create_profile` 队列：`部分对齐 -> 已完成`

## 3. 关键实现证据（代码路径）
1. Discovery 本地优先与去重：`src/features/discovery/services/discoveryService.ts:163`
2. Discovery 随机换题：`src/features/discovery/hooks/useDiscoveryLogic.ts:106`
3. Gallery DB 查询层搜索：`src/features/story-gallery/hooks/useStories.ts:69`
4. Gallery 搜索输入与状态：`src/features/story-gallery/screens/StoriesTabScreen.tsx:88`
5. FileSystem 服务层收口：`src/features/settings/services/avatarStorageService.ts:10`
6. 波形缓存服务化：`src/features/story-gallery/services/waveformAnalysisService.ts:24`
7. Recovery Code 真实调用：`src/features/auth/hooks/useAuthLogic.ts:160`
8. Recovery 页面三态：`src/features/auth/screens/RecoveryCodeScreen.tsx:53`
9. Profile 队列入队：`src/features/settings/hooks/useProfile.ts:230`
10. `create_profile` 队列重放：`src/lib/sync-engine/store.ts:499`

## 4. 测试与命令证据
### 已执行并通过
1. `npm run lint`
2. `npx tsc --noEmit`
3.  
```bash
npx jest src/features/discovery/services/discoveryService.test.ts \
  src/features/discovery/hooks/useDiscoveryLogic.test.ts \
  src/features/story-gallery/hooks/useStories.test.ts \
  tests/integration/filesystem-import-boundary.test.ts \
  src/features/auth/services/recoveryCodeService.test.ts \
  src/features/auth/hooks/useAuthLogic.recovery.test.ts \
  src/lib/sync-engine/queue.test.ts \
  src/lib/sync-engine/store.test.ts \
  src/features/settings/hooks/useProfile.integration.test.tsx \
  --runInBand
```

### 全量测试现状（本次执行）
1. `npm test` 未全绿，存在既有测试基线问题（与本次整改点无直接耦合）：
   - `tests/integration/cloud-ai-main-flow.test.tsx`：缺少 QueryClientProvider
   - `tests/integration/recorder-sync-flow.test.tsx`：测试 mock 的 cloud eligibility 与当前逻辑不一致
   - `src/features/story-gallery/hooks/useStoryAvailability.test.ts`：运行时配置（Supabase env）依赖

## 5. 残余风险与后续建议
1. Gallery Search 当前基于 `LIKE`，建议下一阶段引入 SQLite FTS5（保留现有接口不变，仅替换查询实现）。
2. Sync 队列可进一步细化“会话临时不可用”策略，避免极端情况下 profile 队列项被提前放弃。
3. 将“UI 层禁止 FileSystem 直接导入”从测试规则升级到 ESLint 规则，实现开发期即时反馈。

## 6. 外部最佳实践依据（实施约束）
1. Expo SQLite（本地持久化/变更监听）：https://docs.expo.dev/versions/latest/sdk/sqlite
2. Expo FileSystem legacy API 边界：https://docs.expo.dev/versions/latest/sdk/filesystem-legacy/
3. TanStack Query RN 在线状态（`onlineManager + NetInfo`）：https://tanstack.com/query/v4/docs/framework/react/react-native
4. Supabase Functions 安全建议（`security definer` 与 `search_path`）：https://supabase.com/docs/guides/database/functions
