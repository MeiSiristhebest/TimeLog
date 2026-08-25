# 🎙️ TimeLog Mobile Architecture Blueprint

<p align="center">
  <b>English | <a href="./ARCHITECTURE_zh.md">简体中文</a></b>
</p>

This document details the local-first streaming voice activity detection, SQLite offline storage, and cloud synchronization architecture powering **TimeLog**.

```mermaid
graph TD
    Mic[Microphone Input] -->|Audio Stream| VAD[Silero VAD (Voice Activity Detector)]
    
    subgraph "Local-First Audio Engine"
        VAD -->|Voice Segmentation| AudioRecord[Local Audio Storage]
        VAD -->|Real-Time Chunking| Whisper[Local / Cloud Whisper ASR]
    end

    subgraph "Local Persistence"
        Whisper --> SQLite[(Local SQLite Database)]
        AudioRecord --> SQLite
    end

    subgraph "Cloud Sync Engine"
        SQLite --> SyncWorker[Background Sync Worker]
        SyncWorker -->|Row-Level Security| Supabase[(Supabase Cloud Storage & Auth)]
    end
```

---

## 🎙️ 1. Streaming Voice Activity Detection (VAD)
- Integrates Silero VAD to automatically split long voice recordings into conversational fragments with zero manual clipping.
- Preserves battery and storage by filtering out background silence and noise.

---

## 📦 2. Local-First SQLite Synchronization
- Guarantees 100% full offline recording and transcription capability.
- Automatically pushes local changes to Supabase cloud with conflict-free delta replication when internet connectivity resumes.

---

<sub>© 2026 TimeLog. Licensed under the MIT License.</sub>
