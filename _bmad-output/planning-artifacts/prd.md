---
stepsCompleted: [1, 2, 3, 4, 6, 7, 8, 9, 10]
inputDocuments: ['_bmad-output/planning-artifacts/product-brief-TimeLog-2026-01-09.md', '_bmad-output/planning-artifacts/research/technical-timelog-voice-pipeline-research-2026-01-09.md']
workflowType: 'prd'
lastStep: 10
---

# Product Requirements Document - TimeLog

**Author:** Mei
**Date:** 2026-01-09

---

## Executive Summary

**Time Log** 是一款面向 65 岁以上老年人的**语音优先移动应用**，旨在帮助他们通过对话式采访轻松录制和保存人生故事。核心创新是**离线优先架构 + AI 引导提示**，确保在任何网络条件下都能可靠运行，解决了云端语音助手的脆弱性问题。

### What Makes This Special

| 差异化因素 | 说明 |
|:-----------|:-----|
| 🔴 **Zero Data Loss** | 本地优先，录音永不丢失 |
| 🟢 **Instant Startup** | < 2 秒启动，无需等待 |
| 🟡 **Graceful Degradation** | Sound Cue 提示离线模式 |
| 🔵 **Dual-Track Auth** | 长者隐式认证 + 家人 Email/Password (Magic Link Post-MVP) |

---

## Project Classification

| 维度 | 分类 |
|:-----|:-----|
| **Technical Type** | 📱 `mobile_app` (React Native/Expo) |
| **Domain** | 🌐 `general` (Consumer/Family) |
| **Complexity** | ⚠️ `medium` (离线语音流、双端同步) |
| **Project Context** | 🆕 Greenfield |

---

## Success Criteria

### User Success

| 指标 | 定义 | 目标 |
|:-----|:-----|:-----|
| 首次录音完成率 | 完成首次引导式录音的用户比例 | ≥80% |
| 录音频率 | 每周录音次数 (活跃用户) | ≥2次/周 |
| 录音时长分布 | 单次录音平均时长 | P50: ≥3分钟 |
| 家人收听率 | 收听父母录音的家人比例 | ≥60%/周 |
| Aha Moment | 首次录音引发家人互动 | ≤24小时 |

### Business Success

| 时间框架 | 目标 | 可衡量指标 |
|:---------|:-----|:-----------|
| MVP (17周) | 功能验证 | 5名老年用户 Pilot |
| 3个月 | 产品市场契合 | NPS ≥40 |
| 6个月 | 有机增长 | 30%用户邀请家人 |

### Technical Success

| 类别 | KPI | 目标 |
|:-----|:----|:-----|
| 可靠性 | 离线录音成功率 | 100% |
| 延迟 | 语音响应 (P95) | ≤2000ms |
| 留存 | 7日/30日留存 | ≥40%/25% |
| 质量 | 语音识别准确率 | ≥85% |

---

## Product Scope

### MVP Features

| Feature | 描述 |
|:--------|:-----|
| Guided Interview | AI 引导式录音采访 |
| Story Gallery | 故事列表和回放 |
| Family Listener | 评论和收听 |
| Topic Library | 预设主题卡片 |
| Dual-Track Auth | 长者隐式认证 + 家人 Email/Password (Magic Link Post-MVP) |
| Privacy & Sharing Controls | 云端功能开关 + 显式同意 + 保留期审计 |
| Recovery Controls | 恢复码 (MVP) |
| Offline Recording | 本地优先 + 后台同步 |

### Out of Scope (MVP)

实时情感分析、照片记忆唤起、RAG 推荐、多语言、社交分享、Magic Link 辅助登录 (FR28, Post-MVP)、可信联系人恢复 (FR32)、快速回应/点赞、温和提醒、锁定录音手势 (Post-MVP)

### Future Vision

| 阶段 | 特性 |
|:-----|:-----|
| v1.1 | 时间线视图、AI 故事续接 |
| v2.0 | 照片记忆、多模态 AI |

---

## User Journeys

### Journey 1: 陈伯伯 - 找回讲述的勇气

陈伯伯是清迈退休语文教师。女儿帮他远程安装 TimeLog，发送六位设备码。当晚，他点了麦克风按钮。

**"您还记得第一次走上讲台的情景吗？"** AI 温柔地问道。

他开始讲述，讲了十五分钟，完全忘记了手机的存在。第二天，张女士在北京地铁上收到推送，戴上耳机听父亲的声音，眼眶湿润。

### Journey 2: 张女士 - 通勤路上的陪伴

张女士每天通勤两小时，打开 TimeLog 听父亲最新的故事。今天的故事是关于外婆的——她从来不知道外婆年轻时是村里唯一会认字的女人。

她评论："爸，这个故事太珍贵了，您能多讲讲吗？" 当晚，陈伯伯看到评论，又点了麦克风按钮。

### Journey 3: 陈伯伯 - 断网时的安心

暴风雨夜晚，网络断了。**"滴——"** 提示音告诉他离线模式，但录音继续保存。

第二天网络恢复，TimeLog 自动上传。张女士收到了完整无损的故事推送："爸，昨晚的故事我听了三遍。"

### Journey 4: 李师傅 - 卡车上的父亲声音

李师傅是陈伯伯的儿子，常年跑货运。姐姐帮他用 Email/Password 登录，必要时通过找回密码流程快速登录。

服务区休息时，他听到父亲讲"教儿子骑车"的故事——他完全不记得，但父亲记得每个细节。他评论了两个字："谢谢"。

---

### Journey Requirements Summary

| Journey | 核心功能需求 |
|:--------|:-------------|
| 首次录音 | Guided Interview, AI 引导, 大麦克风按钮 |
| 家人收听 | 推送通知, 评论功能, 音频播放器 |
| 离线模式 | 本地录音, Sound Cue, 自动同步 |
| 简化收听 | Email/Password 登录, 简化界面 |

---

## Innovation & Novel Patterns

### Detected Innovation Areas

| 创新 | 类型 | 风险等级 |
|:-----|:-----|:---------|
| Offline-First Architecture | 架构 | 低 |
| Sound Cue Graceful Degradation | UX | 低 |
| Dual-Track Authentication | 流程 | 低 |
| Elderly Speech Recognition Tuning | 技术 | 中 |

### Validation Approach

| 阶段 | 验证内容 |
|:-----|:---------|
| PoC Spike (Week 1-2) | Deepgram 老年语音识别 |
| Pilot Testing (Week 15-17) | 5 名老年用户全流程 |
| A/B Testing (Post-MVP) | Sound Cue vs UI 弹窗 |

### Risk Mitigation

| 风险 | 缓解策略 |
|:-----|:---------|
| 老年语音识别不准确 | 客户端 VAD 预过滤 + 调优 |
| Sound Cue 用户不理解 | AI 语音解释 |
| 设备码输入困难 | 语音朗读 + 大字号 |

---

## Mobile App Specific Requirements

### Platform Requirements

| Platform | 最低版本 | 理由 |
|:---------|:---------|:-----|
| iOS | 15.0+ | expo-audio-studio 兼容性 |
| Android | 10 (API 29)+ | Scoped Storage, 覆盖 ~95% 用户 |

**Store Compliance:** targetSdkVersion 34 (Play Store 强制)

### Test Device Matrix

| 平台 | 最低测试 | 最高测试 |
|:-----|:---------|:---------|
| iOS | iPhone 8 (iOS 15) | iPhone 15 (iOS 17+) |
| Android | Samsung A32 (Android 10) | Pixel 8 (Android 14+) |

### Device Permissions

| 权限 | 用途 | 必要性 |
|:-----|:-----|:-------|
| MICROPHONE | 录音 | ✅ 必须 |
| POST_NOTIFICATIONS | 推送 | ✅ 推荐 |
| INTERNET | 同步 | ✅ 必须 |
| FOREGROUND_SERVICE | Android 后台 | ✅ 自动 |

### Offline Mode Architecture

| 组件 | 技术 | 功能 |
|:-----|:-----|:-----|
| 本地存储 | expo-sqlite + Drizzle | 元数据 |
| 音频文件 | FileSystem API | 录音 |
| 同步触发 | 回到前台时 | 检测网络同步 |
| 状态提示 | Sound Cue | 离线/在线 |

### Push Notification Strategy

| 场景 | 触发条件 | 接收者 |
|:-----|:---------|:-------|
| 新录音 | 同步完成 | 家人 |
| 家人评论 | 评论发布 | 长者 |

**Fallback (权限拒绝):** App 内徽章 + 引导开启通知
**In-app Activity Card:** 首页展示最新互动摘要（作为 FR25 的 UI 补充）

---

## Functional Requirements

### 1. 录音管理 (Recording)

- **FR1:** 长者用户可以开始语音录音
- **FR2:** 长者用户可以接收 AI 引导式提问
- **FR3:** 长者用户可以暂停和恢复录音
- **FR4:** 长者用户可以结束录音并保存
- **FR5:** 系统可以在离线状态下保存录音到本地
- **FR6:** 系统可以在网络恢复后自动同步录音

### 2. 故事管理 (Story Gallery)

- **FR7:** 长者用户可以查看已录制的故事列表
- **FR8:** 长者用户可以回放自己的故事
- **FR9:** 长者用户可以删除故事
- **FR10:** 长者用户可以从主题库选择录音话题

### 3. 家人收听 (Family Listener)

- **FR11:** 家人用户可以查看父母的故事列表
- **FR12:** 家人用户可以播放故事录音
- **FR13:** 家人用户可以对故事发表评论
- **FR14:** 家人用户可以收到新故事推送通知
- **FR15:** 长者用户可以看到家人的评论

### 4. 认证与权限 (Authentication)

- **FR16:** 长者用户可以通过设备绑定的隐式认证登录 (无需密码)
- **FR17:** 家人用户可以通过 Email/Password 登录
- **FR18:** 系统可以识别设备并自动保持登录状态
- **FR19:** 家人用户可以与多个家庭成员共享账户
- **FR26:** 家人用户可以为长者生成恢复码 (设备丢失时)

### 5. 离线与同步 (Offline & Sync)

- **FR20:** 系统可以检测网络状态并播放 Sound Cue 提示
- **FR21:** 系统可以在前台时触发同步队列
- **FR22:** 系统可以显示同步状态 (等待/同步中/完成)

### 6. 通知管理 (Notifications)

- **FR23:** 系统可以向家人发送新故事通知
- **FR24:** 系统可以向长者发送家人评论通知
- **FR25:** 用户可以在 App 内看到未读消息徽章

### 7. 主题库管理 (Topic Library)

- **FR27:** 家人用户可以向主题库提交新问题

### 8. 隐私与共享控制 (Privacy & Sharing Controls)

- **FR28:** 家人用户可以使用 Magic Link 作为 Email/Password 的辅助登录方式 (Post-MVP)
- **FR29:** 用户可以在设置中关闭云端 AI 功能与云端分享/上传，本地录音不受影响
- **FR30:** 家人共享/绑定必须经长者显式同意，且可随时撤回
- **FR31:** 系统记录第三方服务商与保留期配置的审计元数据 (不含 PII)
- **FR32:** 长者用户可以设置可信联系人恢复方式 (无家人时的备用路径)

---

### Scope Decision for FR28-FR32

- **MVP Must-Have:** FR29 (云端功能开关), FR30 (显式同意/撤回), FR31 (保留期审计)
- **Post-MVP:** FR28 (Magic Link 作为辅助登录), FR32 (可信联系人恢复)

---

## Non-Functional Requirements

### 1. Performance (Latency)

- **NFR1 (VAD Latency):** 本地 VAD 必须在用户停止说话后 **<200ms** (ITU-T "Immediate" threshold) 检测到静音
- **NFR2 (Sound Cue):** 状态提示音必须在触发后 **<100ms** 内播放。*(备注：需通过 Native Module 实现音频播放，避免 JS Bridge 延迟)*
- **NFR3 (Startup):** 冷启动至 Ready 状态 **<2s**
- **NFR4 (AI Timeout):** 云端 AI 超时阈值设定为 **2000ms** (Fallback 阈值)

### 2. Accessibility (Gerontechnology)

- **NFR8 (Text Size):** 正文支持 **>24pt** (满足 WCAG "Resize Text" 200% 要求)
- **NFR9 (Touch Target):** 核心按钮 **≥48x48dp** (高于 WCAG 2.2 AA)
- **NFR10 (Contrast):** 核心阅读文本 (Core Text) 必须达到 **WCAG 2.2 AAA (7:1)**；装饰性文本保持 AA (4.5:1)。
- **NFR11 (Accessible Auth):** 登录过程不得要求用户进行"认知功能测试"，符合 WCAG 2.2 Criterion 3.3.8

### 3. Reliability (Data Survivability)

- **NFR5 (Zero Data Loss):** 即使在录音过程中断电或 Crash，已录音频数据不得丢失
- **NFR6 (Offline Trigger):** 连续 **3次** 网络探测失败后，必须在 **2秒** 内切换至离线模式
- **NFR7 (Sync Integrity):** 上传的文件必须通过 MD5/Checksum 完整性校验

### 4. Privacy & Data (Compliance)

- **NFR12 (Zero Retention):** 禁止第三方服务保留音频数据用于训练。*(备注：必须使用 Enterprise/PaaS 级别 API 并配置 Zero Retention)*
- **NFR13 (Right to Erasure):** 用户删除账号时，必须在 **24小时** 内物理删除所有云端关联数据 (GDPR)
- **NFR14 (Local Encryption):** 本地数据库使用 **AES-256** 加密存储

---
