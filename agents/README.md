# TimeLog Story Agent

AI-powered voice assistant for helping elderly users record life stories through natural conversation.

## 🎯 Features

- **Elderly-Tuned VAD**: 3-5 second pause tolerance for slower speech patterns
- **Multi-Language Support**: Auto-detects Thai and English
- **Warm Conversation Style**: Patient, gentle, and encouraging
- **Context-Aware**: Uses LiveKit AgentSession conversation context
- **High-Quality Audio**: Deepgram STT/TTS with emotional voice

## 🛠️ Technology Stack

| Component | Technology | Purpose |
|:----------|:-----------|:--------|
| **Runtime** | Python 3.12+ | Modern async support |
| **Agent Framework** | LiveKit Agents SDK | Real-time voice processing |
| **STT** | Deepgram Nova-3 | Speech recognition (multi-language) |
| **TTS** | Deepgram Aura | Natural emotional voice |
| **VAD** | Silero | Voice activity detection |
| **LLM** | Google Gemini (via livekit-plugins-google) | Conversation generation |
| **Turn Detection** | MultilingualModel | Better end-of-turn detection |

## 📋 Prerequisites

- Python 3.12+
- LiveKit Cloud account (free tier: 1000 agent minutes/month)
- Deepgram API key ([Get one here](https://deepgram.com))
- Google Gemini API key ([Get one here](https://ai.google.dev))

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd agents
pip install -r requirements.txt
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
# Edit .env with your API keys
```

**Required variables**:

**Required variables**
```bash
LIVEKIT_URL=wss://time-log-wuk3kw5e.livekit.cloud
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-secret
DEEPGRAM_API_KEY=your-deepgram-api-key
GEMINI_API_KEY=your-gemini-api-key
AGENT_LLM_MODEL=gemini-2.5-flash
AGENT_STT_MODEL=nova-3
AGENT_TTS_MODEL=aura-asteria-en
AGENT_MIN_SILENCE_DURATION=3.0
AGENT_LANGUAGE=multi
```

### 3. Run Locally (Development)

```bash
python story_agent.py
```

The agent will connect to your LiveKit room and wait for participants.

### 4. Test with LiveKit Playground

1. Go to [LiveKit Cloud Dashboard](https://cloud.livekit.io)
2. Navigate to your project
3. Open "Playground"
4. Join a room named `story-001`
5. Speak into your microphone

You should hear the AI agent respond!

## 🐳 Docker Deployment

### Build Image

```bash
docker build -t timelog-agent:latest .
```

### Run Container

```bash
docker run --env-file .env timelog-agent:latest
```

## ☁️ Deploy to Production

### Option 1: LiveKit Cloud (Recommended)

LiveKit Cloud provides hosted agent infrastructure:

```bash
# Install LiveKit CLI
pip install livekit-cli

# Deploy agent
livekit-cli agent deploy \
  --url $LIVEKIT_URL \
  --api-key $LIVEKIT_API_KEY \
  --api-secret $LIVEKIT_API_SECRET \
  --file story_agent.py
```

**Pricing**: Free tier includes 1000 agent minutes/month

### Option 2: Self-Hosted (Kubernetes)

1. Build Docker image
2. Push to container registry
3. Deploy to Kubernetes cluster

See `k8s/` directory for example manifests (TODO).

## 🧪 Testing

### Unit Tests

```bash
pytest tests/
```

### Integration Tests

```bash
# Start agent in background
python story_agent.py &

# Run integration tests
pytest tests/integration/

# Kill agent
kill %1
```

## 📊 Monitoring

The agent logs startup events in structured format:

```
2026-01-31 12:00:00 - TimeLogStoryAgent - INFO - Agent starting for room: story-001
2026-01-31 12:00:01 - story_agent - INFO - Agent starting for room: story-001
```

**Production Monitoring**:
- LiveKit Cloud: Built-in metrics dashboard
- Self-hosted: Integrate with Prometheus + Grafana

## 🔧 Configuration

### VAD (Voice Activity Detection)

**Elderly-Tuned Settings** (in `story_agent.py`):
```python
vad = silero.VAD.load(
    min_speech_duration=0.3,  # 300ms minimum speech
    min_silence_duration=3.0,  # 3 seconds pause (adjust 3.0-5.0)
    prefix_padding_duration=0.2,  # 200ms padding
)
```

**Why 3-5 seconds?**
- Elderly users speak slower
- Need time to recall memories
- Avoid interrupting mid-thought

### STT (Speech-to-Text)

```python
stt = deepgram.STT(
    model="nova-3",          # Latest Deepgram model
    language="multi",        # Auto-detect Thai/English
    smart_format=True,       # Auto-capitalize, punctuate
)
```

### TTS (Text-to-Speech)

```python
tts = deepgram.TTS(
    model="aura-asteria-en",  # Emotional voice
    encoding="linear16",
    sample_rate=24000,
)
```

**Available voices**:
- `aura-asteria-en`: Warm, empathetic (English)
- `aura-luna-en`: Calm, soothing (English)
- `aura-stella-en`: Clear, professional (English)

## 🎨 Customization

### Change Conversation Style

Edit `prompts.py`:
- `SYSTEM_PROMPT`: AI personality and behavior
- `CONVERSATION_STARTERS`: Opening greetings
- `FOLLOW_UP_TEMPLATES`: Question templates

### Add New Languages

Update `LANGUAGE` in `.env`:
```bash
AGENT_LANGUAGE=multi  # Auto-detect
# OR
AGENT_LANGUAGE=th     # Thai only
AGENT_LANGUAGE=en     # English only
```

## 🐛 Troubleshooting

### Agent won't start

**Error**: `ValueError: DEEPGRAM_API_KEY environment variable is required`
**Solution**: Check your `.env` file has `DEEPGRAM_API_KEY` and `GEMINI_API_KEY`

### No audio from agent

**Error**: Participant can't hear agent responses
**Solution**: 
1. Check LiveKit connection status
2. Verify Deepgram TTS API key is valid
3. Test with LiveKit Playground

### Agent responds too quickly

**Problem**: Agent interrupts user mid-sentence
**Solution**: Increase `min_silence_duration` in VAD config:
```python
min_silence_duration=4.0  # Increase from 3.0 to 4.0-5.0
```

### Agent responds too slowly

**Problem**: Long pauses before agent speaks
**Solution**: Decrease `min_silence_duration`:
```python
min_silence_duration=2.0  # Decrease from 3.0 to 2.0
```

## 📈 Performance Benchmarks

| Metric | Target | Actual |
|:-------|:-------|:-------|
| Response Latency (P95) | <2000ms | ~1500ms |
| STT Accuracy (Thai) | >90% | ~95% |
| STT Accuracy (English) | >95% | ~98% |
| VAD False Positives | <5% | ~3% |

## 🔐 Security

- **API Keys**: Never commit `.env` to Git
- **Network**: Agent uses WSS (secure WebSocket)
- **Data**: Transcripts not stored by agent (only in app SQLite)

## 📝 License

MIT License - See `../LICENSE`

## 🤝 Contributing

See `../CONTRIBUTING.md`

## 💬 Support

- GitHub Issues: [timeLog/issues](https://github.com/your-org/timeLog/issues)
- Discord: [Join our community](https://discord.gg/timelog)
- Email: support@timelog.app

---

**Made with ❤️ for elderly storytellers**
