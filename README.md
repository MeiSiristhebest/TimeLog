# 🕒 TimeLog

> **Voice-first life logging for meaningful family connections.**

TimeLog is a modern mobile application designed to bridge the gap between elderly family members and their loved ones through seamless, voice-driven storytelling and life recording.

![TimeLog Banner](https://via.placeholder.com/1200x400.png?text=TimeLog+Project+Banner)

## 🌟 Key Features

### 👤 Dual-Track Authentication
- **Family Users**: Standard email/password login.
- **Elderly Users**: Hassle-free **Device Code** login (via QR code) to remove technical barriers.

### 🎙️ Intelligent Voice Recording
- **High Fidelity**: 16kHz WAV recording optimized for transcription.
- **VAD (Voice Activity Detection)**: Smart silence detection (4s threshold) designed for slower elderly speech patterns.
- **Offline First**: Metadata and audio stored locally before syncing.

### 👨‍👩‍👧‍👦 Family Invite System
- **Deep Linking**: Join family accounts via shared links.
- **TaoKouLing**: Automatic clipboard detection for invite tokens.

---

## 🛠️ Tech Stack

- **Core**: [Expo SDK 54](https://expo.dev/) (React Native 0.81.5)
- **Styling**: [NativeWind v4](https://www.nativewind.dev/) (Tailwind CSS v3)
- **Database**: [Drizzle ORM](https://orm.drizzle.team/) + [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- **Backend**: [Supabase](https://supabase.com/) (Auth, Storage, Database)
- **State**: [Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction)
- **Monitoring**: [Sentry](https://sentry.io/)

### Voice Agent (Python)

- **Runtime**: Python 3.12+
- **Framework**: LiveKit Agents 1.x (`livekit-agents==1.4.1`)
- **RTC SDK**: LiveKit Python SDK (`livekit==1.0.25`)
- **STT/TTS**: Deepgram plugins (`livekit-plugins-deepgram==1.4.1`)
- **VAD**: Silero plugin (`livekit-plugins-silero==1.4.1`)
- **LLM**: Google Gemini plugin (`livekit-plugins-google==1.4.1`)
- **Turn Detection**: Multilingual model (`livekit-plugins-turn-detector==1.4.1`)

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm or bun
- Expo Go (on your mobile device) or a Dev Build

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/timelog.git
   cd timelog
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Copy `.env.example` to `.env` and fill in your Supabase credentials.
   ```bash
   cp .env.example .env
   ```

4. **Start the project**
   ```bash
   npx expo start
   ```

### Voice Agent Setup (Optional)

If you want to run the Python voice agent locally, see `agents/README.md`.

### Running Tests

```bash
npm test
```

---

## 🏗️ Project Structure

```text
├── _bmad/               # BMAD Workflows (BMM, BMB, Core)
├── app/                 # Expo Router (Routing & Pages)
├── src/
│   ├── components/      # UI Components (Design System)
│   ├── features/        # Feature-based modules (Auth, Recorder)
│   ├── lib/             # Shared libraries (Supabase, Logger)
│   ├── db/              # Drizzle Schema & Client
│   └── hooks/           # Custom React hooks
├── drizzle/             # Database migrations
├── agents/              # Python LiveKit voice agent (1.x)
└── tests/               # Integration tests
```

---

## 📜 Professional Standard Checklist

Working towards a "Production Ready" state, the following items are now present in the project:

| Item | Status | Purpose |
|:-----|:-------|:--------|
| `README.md` | ✅ Added | Project entry point and guide. |
| `LICENSE` | ✅ Added | Legal permissions (MIT). |
| `CONTRIBUTING.md` | ✅ Added | Guidelines for new contributors. |
| `CHANGELOG.md` | ✅ Added | Tracking version history. |
| `.github/` | ✅ Added | CI/CD (GitHub Actions), PR templates. |
| `SECURITY.md` | ✅ Added | Vulnerability reporting procedure. |

---

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

*Made with ❤️ for the Senior Project.*
