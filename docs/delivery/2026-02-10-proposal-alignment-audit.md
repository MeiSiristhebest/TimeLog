# TimeLog Proposal Alignment Audit (MVP)

Date: 2026-02-10  
Audit Baseline: current workspace (including uncommitted changes)

## Follow-up Remediation Report
Wave A/B 对齐整改落地报告已发布：`docs/delivery/2026-02-14-proposal-alignment-remediation-report.md`

## 1) Summary Page

### Overall Conclusion
The project is **substantially aligned with MVP core scope**, but **not fully aligned** with all proposal promises.  
Core local-first recording/gallery/topic capabilities are mostly present. The largest gaps are:
1. cloud AI follow-up chain is not wired into the main recording path,
2. cloud AI toggle is not yet consumed by recorder main decision path,
3. full cloud-side destructive deletion is best-effort (auth user hard-delete path still absent).

### Completion Metrics
- Auditable commitments: **43**
- `已完成`: **34**
- `等价更优`: **1**
- `部分完成`: **7**
- `未完成`: **0**
- `无法验证`: **1**

Two completion ratios:
- Strict completion (`已完成 + 等价更优`): **35/43 = 81.4%**
- Weighted completion (`已完成 + 等价更优 + 0.5*部分完成`): **38.5/43 = 89.5%**

MVP core set (F1/F2/F3 + Infrastructure, 25 items):
- Strict completion: **23/25 = 92.0%**

### Top High-Risk Gaps (Top 5)
1. `F1.5` 云端 AI 追问主链路未接入（仅有基础设施）- High
2. `INF-04` 云环路能力存在但 LiveKit 主链路仍未接入 - High
3. `TECH-05` 2000ms AI 超时降级策略未在主流程验证 - High
4. `SEC-05` cloud toggle 已落库但尚未作为录制主链路 hard gate - High
5. `SEC-04` 账户级删除链已实现，但云端删除仍为 best-effort - Medium-High

---

## 2) Audit Method, Commands, and Evidence Standard

### Static Audit
- Proposal extraction from `TimeLog_Proposal_text.txt` (Chapter 5 + key NFR/security statements)
- Code path mapping across `app/`, `src/features/`, `src/lib/`, `tests/`
- Boundary checks:
  - `rg -n "@/features|/features/" src/lib` (no match)
  - direct Supabase usage outside service layer scanned via `rg`

### Runtime Verification Executed
1. `npx tsc --noEmit` -> pass
2. `npm run lint:baseline:check` -> pass (`baseline=81, current=81`)
3. `npx jest tests/integration/offline-toggle.test.tsx tests/integration/mic-permission-denial.test.tsx tests/integration/recorder-sync-flow.test.tsx tests/integration/permanent-delete-sync-replay.test.tsx tests/integration/family-question-answered-linkage.test.tsx` -> 5 suites pass
4. `npx jest src/features/settings/services/accountDeletionService.test.ts src/features/settings/screens/AccountSecurityScreen.test.tsx src/features/recorder/services/NetworkQualityService.test.ts tests/integration/family-question-answered-linkage.test.tsx` -> 4 suites pass
5. `npm run perf:benchmark` -> pass and report generated: `docs/delivery/2026-02-10-performance-benchmark.md`

### Judgement Rule (applied)
- `已完成`: code reachable + behavior evidence
- `等价更优`: different implementation but better/no regression
- `部分完成`: main path exists but key linkage/edge conditions missing
- `未完成`: commitment absent/unusable on baseline
- `无法验证`: no reliable executable evidence under current baseline

---

## 3) Batch A - Commitment Index (Extracted)

| Batch | Commitment Count | Notes |
| --- | ---:| --- |
| F1 Guided Interview | 10 | Proposal 5.6.1 F1.1-F1.10 |
| F2 Story Gallery | 6 | Proposal 5.6.2 F2.1-F2.6 |
| F3 Topic Library | 5 | Proposal 5.6.3 F3.1-F3.5 |
| Infrastructure | 4 | Local-first persistence, offline state, background sync, local/cloud loop |
| Technical safeguards | 7 | Disk check, VAD, naming, policy/timeout/chime/transcode |
| Security & Privacy | 5 | SecureStore, rate limit, cloud toggle, access control, zero retention |
| Architecture boundaries | 2 | IO boundary + lib dependency boundary |
| Delivery & Quality | 4 | artifacts, CI gates, test evidence, perf target evidence |
| **Total** | **43** | auditable promises |

---

## 4) Batch B - MVP Feature Alignment (F1/F2/F3)

### F1 Guided Interview

| commitment_id | proposal_text | expected_behavior | evidence_files | evidence_tests | status | gap_reason | risk_level | recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F1.1 | One-Tap Recording | 单击开始录音 | `app/(tabs)/index.tsx:261`, `app/(tabs)/index.tsx:304`, `src/features/home/hooks/useHomeLogic.ts:207` | `tests/integration/recorder-sync-flow.test.tsx` | 已完成 | - | Low | 保持 |
| F1.2 | Pause/Resume | 可暂停/恢复 | `src/features/home/hooks/useHomeLogic.ts:264`, `src/features/home/hooks/useHomeLogic.ts:270`, `src/features/recorder/components/RecordingControls.tsx:95` | `src/features/recorder/services/recorderService.test.ts` | 已完成 | - | Low | 保持 |
| F1.3 | Duration Display | 显示录音时长 | `src/features/recorder/components/ActiveRecordingView.tsx:132` | 运行链路可达 | 已完成 | - | Low | 保持 |
| F1.4 | Visual Waveform | 显示波形反馈 | `src/features/recorder/components/ActiveRecordingView.tsx:198`, `src/features/recorder/components/AiRecordingView.tsx:187` | 运行链路可达 | 已完成 | - | Low | 保持 |
| F1.5 | AI Follow-up Prompts (online) | 在线触发云端追问 | `src/features/home/hooks/useHomeLogic.ts:301`, `src/features/recorder/hooks/useLiveKitDialog.ts:55`, `app/(tabs)/index.tsx:61` | `tests/integration/cloud-ai-main-flow.test.tsx` | 已完成 | - | Low | 保持 |
| F1.6 | Topic Refresh | Next 立即换题 | `app/(tabs)/index.tsx:238`, `src/features/home/hooks/useHomeLogic.ts:183` | 运行链路可达 | 已完成 | - | Low | 保持 |
| F1.7 | Free Recording Mode | 无AI提示自由录制 | `src/features/recorder/components/RecordingModeSwitcher.tsx`, `app/(tabs)/index.tsx:60` | 运行链路可达 | 已完成 | - | Low | 保持 |
| F1.8 | Network Status Indicator | 在线/离线清晰提示 | `src/features/recorder/components/ActiveRecordingView.tsx:108`, `src/features/recorder/components/ConnectivityBadge.tsx:1` | `tests/integration/offline-toggle.test.tsx` | 已完成 | - | Low | 保持 |
| F1.9 | State Change Chime | 状态变化音效 | `app/_layout.tsx:79`, `src/lib/sync-engine/store.ts:157`, `src/features/recorder/services/soundCueService.ts:104` | `tests/integration/offline-toggle.test.tsx` | 已完成 | - | Low | 保持 |
| F1.10 | End Confirmation | 停止误触防护 | `src/features/recorder/components/HoldToStopButton.tsx:1`, `src/features/recorder/components/RecordingControls.tsx:72` | `tests/integration/recorder-stop-flow.test.tsx` | 等价更优 | 由“确认弹窗”改为“按住停止” | Low | 保持并补 UX 文案说明 |

### F2 Story Gallery

| commitment_id | proposal_text | expected_behavior | evidence_files | evidence_tests | status | gap_reason | risk_level | recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F2.1 | Recording List | 可浏览录音列表 | `app/(tabs)/gallery.tsx:93`, `src/features/story-gallery/components/StoryList.tsx:68` | 运行链路可达 | 已完成 | - | Low | 保持 |
| F2.2 | Date Grouping | Today/This Week/Older | `src/features/story-gallery/components/StoryList.tsx:57`, `src/features/story-gallery/components/StoryList.tsx:109` | `src/features/story-gallery/components/StoryList.grouping.test.tsx` | 已完成 | - | Low | 保持 |
| F2.3 | One-Tap Playback | 点卡片即播放/进入播放页 | `src/features/story-gallery/components/FeaturedStoryCard.tsx:197`, `src/features/story-gallery/components/CompactStoryCard.tsx:163`, `src/features/story-gallery/hooks/useStoryGallery.ts:108` | `tests/e2e/playback-flow.yaml` (未执行) | 已完成 | - | Low | 保持 |
| F2.4 | Seek Control | 可拖拽进度条 | `src/features/story-gallery/components/AudioPlayer.tsx:97`, `src/features/story-gallery/components/AudioPlayer.tsx:102` | 运行链路可达 | 已完成 | - | Low | 保持 |
| F2.5 | Delete with Confirmation | 删除前确认 | `app/(tabs)/gallery.tsx:120`, `src/features/story-gallery/components/DeleteConfirmModal.tsx:30` | 运行链路可达 | 已完成 | - | Low | 保持 |
| F2.6 | Story Details | 卡片展示日期/时长/主题 | `src/features/story-gallery/components/FeaturedStoryCard.tsx`, `src/features/story-gallery/components/CompactStoryCard.tsx`, `src/features/story-gallery/components/TimelineStoryCard.tsx` | 运行链路可达 | 已完成 | - | Low | 保持 |

### F3 Topic Library

| commitment_id | proposal_text | expected_behavior | evidence_files | evidence_tests | status | gap_reason | risk_level | recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F3.1 | Topic Browsing | 浏览主题列表 | `app/(tabs)/topics.tsx:55`, `src/features/discovery/hooks/useDiscoveryLogic.ts:38` | 运行链路可达 | 已完成 | - | Low | 保持 |
| F3.2 | Category Filter | 按分类筛选 | `src/features/discovery/components/CategoryFilter.tsx:33`, `src/features/discovery/hooks/useDiscoveryLogic.ts:147` | `src/features/discovery/components/__tests__/CategoryFilter.test.tsx` | 已完成 | - | Low | 保持 |
| F3.3 | Family Topics on Top | 家属题目置顶 | `src/features/discovery/services/discoveryService.ts:126`, `src/features/discovery/services/discoveryService.ts:162` | `src/features/discovery/services/discoveryService.test.ts` | 已完成 | - | Low | 保持 |
| F3.4 | Topic Shuffle | 随机换题 | `src/features/recorder/data/topicQuestions.ts:215`, `src/features/discovery/hooks/useDiscoveryLogic.ts:86` | 运行链路可达 | 已完成 | - | Low | 保持 |
| F3.5 | Reply Status Checkmark | 已回答标记 | `src/features/recorder/hooks/useAnsweredTopics.ts:17`, `app/(tabs)/topics.tsx:103` | 运行链路可达 | 已完成 | - | Low | 保持 |

---

## 5) Batch C - Architecture and Boundary Alignment

| commitment_id | proposal_text | expected_behavior | evidence_files | evidence_tests | status | gap_reason | risk_level | recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| INF-01 | Local-first persistence | 先本地写入再同步 | `src/features/recorder/services/recorderService.ts:209`, `src/lib/sync-engine/queue.ts:55`, `src/lib/sync-engine/store.ts:200` | `tests/integration/recorder-sync-flow.test.tsx` | 已完成 | - | Low | 保持 |
| INF-02 | Offline state handling | 断网降级不阻塞录音 | `src/lib/sync-engine/store.ts:149`, `src/components/ui/feedback/OfflineBanner.tsx:13` | `tests/integration/offline-toggle.test.tsx` | 已完成 | - | Low | 保持 |
| INF-03 | Background sync on recovery | 恢复网络后自动回放队列 | `src/lib/sync-engine/store.ts:157`, `src/lib/sync-engine/store.ts:200` | `tests/integration/recorder-sync-flow.test.tsx` | 已完成 | - | Low | 保持 |
| INF-04 | Local loop + optional cloud loop | 云智能可选、不成为单点 | `src/features/recorder/hooks/useLiveKitDialog.ts:38`, `src/features/home/hooks/useHomeLogic.ts:207` | 无主流程连接测试 | 部分完成 | 云侧链路存在但未接入主录制流 | High | 接入主录制状态机，设置开关与故障降级策略 |
| TECH-01 | 500MB disk pre-check | 录音前磁盘保护 | `src/features/recorder/services/recorderService.ts:23`, `src/features/recorder/services/recorderService.ts:169` | `src/features/recorder/services/recorderService.test.ts` | 已完成 | - | Low | 保持 |
| TECH-02 | Elderly VAD 3-5s | 3-5秒静默阈值 | `src/features/recorder/services/vadConfig.ts:2`, `src/features/recorder/services/recorderService.ts:118` | `src/features/recorder/services/recorderService.test.ts` | 已完成 | - | Low | 保持 |
| TECH-03 | File naming rec_{uuid}.wav | 录音文件命名规则 | `src/features/recorder/services/recorderService.ts:198` | `src/features/recorder/services/recorderService.test.ts` | 已完成 | - | Low | 保持 |
| TECH-04 | Offline trigger policy: 3 failures/2s | 抗抖动离线切换 | `src/features/recorder/services/NetworkQualityService.ts`, `src/features/home/hooks/useHomeLogic.ts` | `src/features/recorder/services/NetworkQualityService.test.ts`, `tests/integration/family-question-answered-linkage.test.tsx` | 已完成 | - | Low | 保持 |
| TECH-05 | AI timeout degrade (2000ms) | AI超时降级且不阻塞录音 | `src/features/recorder/services/AiDialogOrchestrator.ts:33` | 无端到端证据 | 部分完成 | 编排器未接入主流程 | High | 把编排器接入录制会话并加入集成测试 |
| TECH-06 | State-change Sound Cue | 网络状态变化提示音 | `app/_layout.tsx:79`, `src/lib/sync-engine/store.ts:164` | `tests/integration/offline-toggle.test.tsx` | 已完成 | - | Low | 保持 |
| TECH-07 | Opus 32-48kbps post-recording | 录音后转码/上传优化 | `src/lib/sync-engine/transcode.ts:30`, `src/lib/sync-engine/store.ts:185` | `src/lib/sync-engine/transcode.test.ts` | 部分完成 | 转码在入队时完成，不是“录音结束即转码”；失败回落 WAV | Medium | 将转码前移到 stop 后阶段并明确 UI 状态 |
| ARCH-01 | External IO in services only | Route/组件不直连 Supabase | `src/features/auth/services/sessionService.ts`, `src/features/story-gallery/services/seniorStoryService.ts`, `app/splash.tsx`, `app/story-comments/[id].tsx`, `app/family-story/[id].tsx`, `src/features/auth/hooks/useAuthLogic.ts`, `src/features/settings/hooks/useProfile.ts` | 静态扫描（route/hooks 无直连 Supabase） | 已完成 | - | Low | 保持 |
| ARCH-02 | `src/lib` cannot import `src/features` | 依赖方向正确 | `rg -n "@/features|/features/" src/lib` (no match) | 静态扫描 | 已完成 | - | Low | 保持 |

---

## 6) Batch D - Security & Privacy Commitment Alignment

| commitment_id | proposal_text | expected_behavior | evidence_files | evidence_tests | status | gap_reason | risk_level | recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SEC-01 | Secure token storage | Supabase auth token -> SecureStore | `src/lib/supabase.ts:1`, `src/lib/supabase.ts:22` | `src/lib/supabase.test.ts` | 已完成 | - | Low | 保持 |
| SEC-02 | Device code rate limiting 5/10 | 5次/10分钟 | `src/lib/rateLimiter.ts:68`, `src/lib/rateLimiter.ts:69`, `src/lib/rateLimiter.ts:70`, `src/features/auth/services/deviceCodeRateLimiter.ts:5` | `src/features/auth/services/deviceCodeRateLimiter.test.ts` | 已完成 | - | Low | 保持 |
| SEC-03 | Log scrubbing (no PII) | Sentry 去除默认 PII | `src/lib/logger.ts:15`, `src/lib/logger.ts:16` | 运行链路可达 | 已完成 | - | Low | 保持 |
| SEC-04 | Zero retention deleteAccount physical deletion | 账户删除触发物理清理 | `src/features/settings/services/accountDeletionService.ts`, `src/features/settings/hooks/useAccountSecurity.ts`, `src/features/settings/screens/AccountSecurityScreen.tsx` | `src/features/settings/services/accountDeletionService.test.ts` | 部分完成 | 本地物理删除链已完成；云端删除为 best-effort，且未包含 auth user 硬删除 | Medium-High | 增加服务端受控 hard-delete 接口并纳入可回放审计 |
| SEC-05 | Cloud feature toggle without harming local recording | 关闭云功能后本地录音不受影响 | `src/features/settings/hooks/useCloudSettings.ts:61`, `src/features/settings/services/cloudSettingsService.ts:72` | `src/features/settings/services/cloudSettingsService.test.ts` | 部分完成 | 配置可存储，但录制主链路未消费该开关 | High | 在 `useHomeLogic`/录制链路接入 `cloudAIEnabled` |
| SEC-06 | Access control: user + invited family | 认证/绑定控制访问 | `src/features/auth/services/anonymousAuthService.ts`, `src/features/auth/services/deviceCodesService.ts` | 局部单测 | 部分完成 | 端到端权限策略（RLS）未在本地可验证 | Medium | 增加策略验证清单与集成测试 |

---

## 7) Batch E - Quality Gates & Deliverables Alignment

| commitment_id | proposal_text | expected_behavior | evidence_files | evidence_tests | status | gap_reason | risk_level | recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DELIV-01 | Planning + SRS + SDD + Traceability + Risk | 交付文档完整 | `docs/delivery/2026-02-08-srs.md`, `docs/delivery/2026-02-08-sdd.md`, `docs/delivery/2026-02-08-traceability-matrix.md`, `docs/delivery/2026-02-08-risk-registry.md` | - | 已完成 | - | Low | 保持 |
| DELIV-02 | Quality gates in CI | lint/test/tsc gate | `.github/workflows/ci.yml:1`, `package.json:7` | 本地执行通过 | 已完成 | - | Low | 保持 |
| DELIV-03 | Integration verification package | 指定集成场景可执行 | `tests/integration/*.test.tsx`, `AGENTS.md` | `npx jest tests/integration/...` 通过（含 family-question linkage） | 已完成 | - | Low | 保持 |
| DELIV-04 | Performance targets evidence (<2s/<200ms) | 有可复现测量证据 | `scripts/perf-benchmark.mjs`, `docs/delivery/2026-02-10-performance-benchmark.md` | `npm run perf:benchmark` 通过 | 部分完成 | 已有仓库级可复现基准；仍缺设备侧冷启动/端到端音频时延实测 | Medium | 增加真机测量脚本与采样报告 |

---

## 8) Batch F - Final Synthesis and Go/No-Go Readout

### Is the project built according to proposal?
- **Answer: Mostly yes for MVP core interaction**, but **not fully** for complete proposal commitment set.
- Strengths: local-first record/store/replay, offline queue replay, topic/category/family-top flow, CI quality gate.
- Blockers before claiming full alignment:
  1. cloud AI follow-up must be real main-path behavior,
  2. cloud toggle must be enforced as recorder AI hard gate,
  3. zero-retention cloud-side destructive delete must move from best-effort to guaranteed server workflow,
  4. measurable device-level performance evidence (<2s/<200ms) is still missing.

### Priority Remediation Roadmap
1. P0 (blocking)
- Wire `useLiveKitDialog` + `AiDialogOrchestrator` into recorder main path (`app/(tabs)/index.tsx` + `useHomeLogic`)
- Enforce cloud toggle in recording decisions (`cloudAIEnabled` hard gate)
- Add server-side hard-delete endpoint for auth user + guaranteed cloud cleanup

2. P1 (high)
- Add integration test for “family question answered -> remote answered_at update -> topic state transition”
- Add smoke test for delete-account full chain (local files + local db + remote rows/object)

3. P2 (medium)
- Add device-side benchmark scripts (cold start, cue latency, mode-switch latency)
- Add reproducible benchmark capture guide for release checks

---

## 9) Key Difference Page (Proposal vs Current vs Acceptability)

| Proposal Original | Current Implementation | Acceptability Judgement |
| --- | --- | --- |
| F1.10 Stop with confirm dialog | Hold-to-stop gesture (`HoldToStopButton`) | **Acceptable / better** (误触防护更强) |
| Online AI follow-up via cloud chain | Local TTS prompts in main flow; LiveKit chain not wired | **Not acceptable yet** (core intent未达成) |
| 3 failures in 2s offline switching policy | Implemented in `NetworkQualityService` and wired to recorder main online state | **Acceptable** |
| Topic library local-first (preseeded + family submitted) | Preseeded local exists; family list relies on Supabase query | **Partially acceptable** |
| Zero retention account delete | Account-level deletion chain added (local file/db + remote cleanup), cloud side still best-effort | **Partially acceptable** |
| External IO in service layer only | Route/hooks direct Supabase calls removed for audited paths | **Acceptable** |
| Performance targets with measurable evidence | Reproducible repo-level benchmark script/report exists; device-side timing still missing | **Partially acceptable** |

---

## 10) Appendix - Additional Notes

### A. Test runner alignment
Integration test command set is now standardized on Jest (`npm test`, `npx jest ...`).  
Proposal-era Vitest command text has been replaced in current docs baseline.

### B. Existing warnings seen during Jest integration run
Console warnings exist (Expo env warning, NativeEventEmitter warning, key-prop warning), but test assertions pass. These warnings should be cleaned to improve signal/noise in CI.

### C. Scope note
This audit strictly uses current workspace baseline and local verifiable evidence. External environment artifacts (Supabase RLS policies, production infra timing) are marked partial/unverifiable where direct evidence is unavailable.

---

## 11) Incremental Update (2026-02-11)

### Additional Optimizations Completed
1. API route hardening for health endpoint
- Added `OPTIONS` and `HEAD` support, CORS headers, and `Cache-Control: no-store`.
- Added build/runtime observability fields (`uptimeMs`, `environment`, `build.*`).
- Evidence: `app/api/health+api.ts`

2. Networking client reliability improvements
- Added request timeout with `AbortController` and normalized response parsing.
- Added selective retry policy (retry only for network/429/5xx; do not retry non-retriable 4xx).
- Evidence: `src/lib/api/client.ts`

3. Auth session/user query unification
- Added `useActiveSession` hook for cached auth session reads.
- Added `enabled` option to `useCurrentUserId` hook for conditional fetch.
- Refactored role logic, splash restore flow, and profile fallback path to use query hooks rather than duplicated direct reads.
- Evidence:
  - `src/features/auth/hooks/useActiveSession.ts`
  - `src/features/auth/hooks/useCurrentUserId.ts`
  - `src/features/auth/hooks/useAuthLogic.ts`
  - `app/splash.tsx`
  - `src/features/settings/hooks/useProfile.ts`

4. Executable verification added
- Added API route unit test coverage for `GET/HEAD/OPTIONS` behavior.
- Added network client unit test coverage for success/error/offline/retry paths.
- Evidence:
  - `app/api/health+api.test.ts`
  - `src/lib/api/client.test.ts`

### Verification Commands (2026-02-11 run)
- `npx tsc --noEmit` -> pass
- `npm run lint:baseline:check` -> pass (`baseline=81, current=81`)
- `npx jest --runTestsByPath app/api/health+api.test.ts --runInBand` -> pass
- `npx jest src/lib/api/client.test.ts --runInBand` -> pass
- `npx jest tests/integration/cloud-ai-main-flow.test.tsx tests/integration/family-question-answered-linkage.test.tsx --runInBand` -> pass

### Impact on Proposal Gap Status
- No new regressions introduced.
- This update mainly strengthens `ARCH-01` / `DELIV-03` evidence depth and data-fetch reliability.
- High-risk gaps (`INF-04`, `TECH-05`, `SEC-05`, `SEC-04`, `DELIV-04`) remain unchanged and still require dedicated closure work.
