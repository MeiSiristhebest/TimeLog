---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments: ['TimeLog_Proposal_text.txt', 'technical-timelog-voice-pipeline-research-2026-01-09.md']
date: '2026-01-09'
author: 'Mei'
---

# Product Brief: TimeLog

## Executive Summary

**Time Log** 是一款面向 65 岁以上老年人的**语音优先移动应用**，旨在帮助他们通过对话式采访轻松录制和保存人生故事。核心创新是**离线优先架构 + AI 引导提示**，确保在任何网络条件下都能可靠运行，解决了云端语音助手的脆弱性问题。

---

## Core Vision

### Problem Statement

老年人希望为后代保存人生记忆，但面临三重障碍：

1. **数字鸿沟** - 复杂的应用界面令他们望而却步
2. **认知负担** - 被动录音机缺乏引导，难以开启讲述
3. **网络脆弱性** - 云端语音代理在信号弱时中断，导致数据丢失

### Problem Impact

| 影响维度 | 描述 |
|:---------|:-----|
| 心理需求 | Erik Erikson 的"代际传承"需求在晚年尤为强烈 |
| 家庭价值 | 人生故事是家族遗产，一旦失去无法弥补 |
| 技术鸿沟 | 现有解决方案假设稳定网络，不适合老年人使用场景 |

### Why Existing Solutions Fall Short

| 竞品 | 局限性 |
|:-----|:-------|
| **StoryWorth** | 纯文字，无语音；假设网络稳定 |
| **Remento** | 视频录制增加认知负担；云端依赖 |
| **HereAfter AI** | 实时 AI 对话，网络中断即失败 |

### Proposed Solution

**Time Log** 采用**双轨架构**：

- **LOCAL LOOP (On-Device)**: Silero VAD (语音检测) + SQLite (本地存储) + Offline Recording (永不丢失)
- **CLOUD LOOP**: Deepgram STT (语音转文字) + Gemini Flash (AI 引导提示) + Supabase (云端同步)

### Key Differentiators

| 差异化因素 | 说明 |
|:-----------|:-----|
| 🔴 **Zero Data Loss** | 本地优先，录音永不丢失 |
| 🟢 **Instant Startup** | < 2 秒启动，无需等待 |
| 🟡 **Graceful Degradation** | Sound Cue 提示离线模式 |
| 🔵 **Dual-Track Auth** | 长者隐式认证 + 家人 Email/Password (Magic Link Post-MVP) |

---

## Target Users

### Primary Users

#### 👴 陈伯伯 (Uncle Chen) - 68岁，退休教师

**背景:**
- 曾是鸿文中学语文教师，教书 30 年
- 两个孩子在北京工作，与老伴独居清迈
- 微信熟练程度有限，不习惯输入文字

**痛点:**
- 想把人生经历讲给孙辈听，但孩子们太忙
- 曾尝试录音机，但不知道该说什么
- 手机界面复杂，常因误触而"放弃"

**期望:**
- 像和老朋友聊天一样分享故事
- 不需要打字或复杂操作
- 孩子们能随时听到他的声音

**核心技术适配:**
- 语速 ≤120 wpm (Deepgram `eager_eot_threshold` 调优)
- 大按钮、高对比度 UI
- 设备绑定隐式登录 (无需记密码)

---

### Secondary Users

#### 👨‍👩‍👧 张女士 (Ms. Zhang) - 42岁，陈伯伯的女儿

**背景:**
- 北京互联网公司产品经理
- 常年出差，与父母面对面时间有限
- 担心父亲的记忆逐渐模糊

**痛点:**
- 想了解父亲的人生故事，但视频通话总是寒暄结束
- 希望有"引导式"方式帮父亲讲述

**期望:**
- 随时用手机听父亲的录音
- 能帮父亲整理和分类故事
- 与弟弟共同查看家族记忆

**核心交互:**
- Email/Password 登录 (主路径)
- Magic Link 登录 (Post-MVP)
- 家庭权限：查看 + 评论 + 删除 + 邀请成员

**技术能力变体:**
- **高技术能力**（如张女士）：主动管理、整理、邀请其他成员
- **低技术能力**（如陈伯伯的儿子）：主要播放和评论

---

### User Journey (with Risk Points)

| 阶段 | 描述 | 风险点 |
|:-----|:-----|:-------|
| Discovery | 女儿在公众号看到 TimeLog | - |
| Onboarding | 女儿帮父亲安装 | ⚠️ 设备码绑定/权限弹窗 |
| First Use | 父亲点击麦克风，AI 引导 | ⚠️ 问题过于抽象/VAD 误判 |
| Aha Moment | 父亲讲述，女儿收到通知 | ⚠️ 需 Pilot 验证时长 |
| Habit Loop | 每晚录音，通勤时听 | - |

---

### Notes for Downstream Phases

| 阶段 | 关注点 |
|:-----|:-------|
| **UX Design** | 触摸面积 ≥44dp、色调对比、设备码绑定优化 |
| **Architecture** | Session-level VAD Config (长者 vs 家人) |
| **AI/Prompt** | 具象问题优于抽象问题 |
| **Test/QA** | Pilot 验证：Onboarding <30s, 首次录音时长 |

---

## Success Metrics

### User Success Metrics

| 指标 | 定义 | 目标 |
|:-----|:-----|:-----|
| 首次录音完成率 | 完成首次引导式录音的用户比例 | ≥80% |
| 录音频率 | 每周录音次数 (活跃用户) | ≥2次/周 |
| 录音时长分布 | 单次录音平均时长 | P50: ≥3分钟 |
| 家人收听率 | 收听父母录音的家人比例 | ≥60%/周 |
| Aha Moment | 首次录音引发家人互动的时间 | ≤24小时 |

---

### Business Objectives

| 时间框架 | 目标 | 可衡量指标 |
|:---------|:-----|:-----------|
| MVP (17周) | 完成功能验证 | 5名真实老年用户 Pilot |
| 3个月 | 验证产品市场契合 | NPS ≥40 |
| 6个月 | 有机增长启动 | 30%用户邀请家人入驻 |

---

### Key Performance Indicators (KPIs)

| 类别 | KPI | 目标 |
|:-----|:----|:-----|
| 可靠性 | 离线录音成功率 | 100% |
| 延迟 | 语音响应延迟 (P95) | ≤2000ms |
| 留存 | 7日/30日留存 | ≥40%/25% |
| 质量 | 语音识别准确率 (老年语音) | ≥85% |
| 参与 | 家庭内周互动数 | ≥3次/周 |

---

## MVP Scope

### Core Features (Must-Have)

| Feature | 描述 |
|:--------|:-----|
| **Guided Interview** | AI 引导式录音采访 (长者端) |
| **Story Gallery** | 故事列表和回放 (长者端) |
| **Family Listener** | 快速切换视图、评论 (家人端) |
| **Topic Library** | 预设主题卡片 (长者端) |
| **Dual-Track Auth** | 长者隐式认证 + 家人 Email/Password (Magic Link Post-MVP) |
| **Recovery Controls** | 恢复码 + 可信联系人备用恢复 |
| **Offline Recording** | 本地优先 + 后台同步 |

---

### Out of Scope for MVP

| 明确排除 | 原因 |
|:---------|:-----|
| 实时情感分析 | 技术风险高 |
| 照片记忆唤起 (CV) | 增加复杂度 |
| RAG 个性化推荐 | 需要大量数据 |
| 多语言支持 | MVP 聚焦单一市场 |
| 社交分享 | 隐私考虑 |
| 可信联系人恢复 | 需额外验证流程 |

---

### MVP Success Criteria

| 标准 | 目标 |
|:-----|:-----|
| Pilot 用户数 | 5 名老年用户 |
| SUS 可用性评分 | ≥70 |
| 离线录音成功率 | 100% |
| 语音响应延迟 (P95) | ≤2s |
| 首次录音完成率 | ≥80% |

---

### Future Vision

| 阶段 | 特性 |
|:-----|:-----|
| v1.1 | 时间线视图、AI 故事续接 |
| v1.2 | 家庭成员管理完善 |
| v2.0 | 照片记忆、多模态 AI |

---
