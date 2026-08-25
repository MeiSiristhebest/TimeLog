# 🎙️ TimeLog 移动端架构设计文档 (Architecture Guide)

<p align="center">
  <b><a href="./ARCHITECTURE.md">English</a> | 简体中文</b>
</p>

本文档阐述 **TimeLog** 本地优先流式语音活动检测 (VAD)、离线 SQLite 存储与多端云同步架构设计。

```mermaid
graph TD
    Mic[麦克风音频采集] -->|音频流| VAD[Silero VAD (流式语音活动检测)]
    
    subgraph "本地优先语音处理引擎"
        VAD -->|智能语音分段| AudioRecord[本地音频持久化]
        VAD -->|实时流式分片| Whisper[本地 / 云端 Whisper ASR 转写]
    end

    subgraph "本地离线持久化"
        Whisper --> SQLite[(本地 SQLite 数据库)]
        AudioRecord --> SQLite
    end

    subgraph "云端同步管道"
        SQLite --> SyncWorker[后台差量同步 Worker]
        SyncWorker -->|行级安全控制 RLS| Supabase[(Supabase 云端数据库与存储)]
    end
```

---

## 🎙️ 1. 流式语音活动检测 (Silero VAD)
- 实时分析麦克风音频流，自动过滤静音与环境杂音，按自然停顿智能切分录音。
- 大幅降低手机功耗与无效音频体积。

---

## 📦 2. 本地优先 (Local-First) 离线架构
- 支持无网络环境下 100% 完整的录音、本地转写与日记浏览。
- 网络恢复后自动通过差量同步机制将数据无冲突推送到 Supabase 云端。

---

<sub>© 2026 TimeLog. Licensed under the MIT License.</sub>
