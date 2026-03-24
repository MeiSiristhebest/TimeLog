"""TimeLog Story Agent on LiveKit Agents 1.x."""

import logging
import os
import asyncio
import json
from typing import Any

from dotenv import load_dotenv
from livekit import agents
from livekit.agents import Agent, AgentServer, AgentSession
from livekit.plugins import deepgram, google, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

from prompts import CONVERSATION_STARTERS, SYSTEM_PROMPT

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
USE_VERTEX_AI = os.getenv("USE_VERTEX_AI", "false").lower() in ("1", "true", "yes")
VERTEX_PROJECT_ID = os.getenv("VERTEX_PROJECT_ID") or os.getenv("GOOGLE_CLOUD_PROJECT")
VERTEX_LOCATION = os.getenv("VERTEX_LOCATION") or os.getenv("GOOGLE_CLOUD_LOCATION", "global")
MIN_SILENCE_DURATION = float(os.getenv("AGENT_MIN_SILENCE_DURATION", "3.0"))
LANGUAGE = os.getenv("AGENT_LANGUAGE", "multi")
TTS_MODEL = os.getenv("AGENT_TTS_MODEL", "aura-2-asteria-en")
LLM_MODEL = os.getenv("AGENT_LLM_MODEL", "gemini-2.5-flash")
STT_MODEL = os.getenv("AGENT_STT_MODEL", "nova-3")


def validate_environment() -> None:
    if not DEEPGRAM_API_KEY:
        raise ValueError("DEEPGRAM_API_KEY environment variable is required")
    if USE_VERTEX_AI and not VERTEX_PROJECT_ID:
        raise ValueError(
            "VERTEX_PROJECT_ID (or GOOGLE_CLOUD_PROJECT) environment variable is required when USE_VERTEX_AI=true"
        )
    if not USE_VERTEX_AI and not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY environment variable is required")


def get_required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise ValueError(f"{name} environment variable is required")
    return value


class TimeLogStoryAgent(Agent):
    def __init__(self, story_id: str, topic_text: str, language: str) -> None:
        self._story_id = story_id
        self._topic_text = topic_text
        self._language = language

        session_context = (
            "\n<session_context>\n"
            f"storyId: {story_id}\n"
            f"currentTopic: {topic_text}\n"
            f"userLanguage: {language}\n"
            "</session_context>\n"
            "Always anchor follow-up questions to currentTopic."
        )

        super().__init__(instructions=f"{SYSTEM_PROMPT}{session_context}")

    async def on_enter(self) -> None:
        greeting = CONVERSATION_STARTERS[0]
        await self.session.generate_reply(
            instructions=(
                "Greet the user warmly and briefly. "
                f"The current topic is: {self._topic_text}. "
                f"Default to this language unless user switches: {self._language}. "
                "Use this opening intent and keep it on topic: "
                f"{greeting}."
            )
        )


server = AgentServer()


@server.rtc_session()
async def story_agent_session(ctx: agents.JobContext) -> None:
    logger.info("Agent starting for room: %s", ctx.room.name)
    try:
        await ctx.connect()
    except Exception as error:
        logger.warning("Failed to connect room; skipping job: %s", error)
        ctx.shutdown(reason="room_connect_failed")
        return

    deepgram_api_key = get_required_env("DEEPGRAM_API_KEY")

    if USE_VERTEX_AI:
        llm = google.LLM(
            model=LLM_MODEL,
            vertexai=True,
            project=VERTEX_PROJECT_ID,
            location=VERTEX_LOCATION,
        )
        logger.info(
            "Using Vertex AI for LLM (project=%s, location=%s, model=%s)",
            VERTEX_PROJECT_ID,
            VERTEX_LOCATION,
            LLM_MODEL,
        )
    else:
        gemini_api_key = get_required_env("GEMINI_API_KEY")
        llm = google.LLM(
            model=LLM_MODEL,
            api_key=gemini_api_key,
        )
        logger.info("Using Gemini API key for LLM (model=%s)", LLM_MODEL)

    story_id = ctx.room.name.replace("story_", "", 1)
    topic_text = "Tell me about this memory."
    language = "en"

    try:
        participant = await ctx.wait_for_participant()
    except RuntimeError as error:
        # Mobile clients may disconnect before participant attachment is finalized.
        # Treat as a no-op job instead of crashing the worker process.
        if "room is not connected" in str(error).lower():
            logger.warning("Room disconnected before participant joined; skipping job")
            ctx.shutdown(reason="room_disconnected_before_participant")
            return
        raise
    attrs = getattr(participant, "attributes", {}) or {}
    story_id = attrs.get("storyId") or story_id
    topic_text = attrs.get("topicText") or topic_text
    language = attrs.get("language") or language

    metadata = getattr(participant, "metadata", None)
    if metadata:
        try:
            parsed = json.loads(metadata)
            if isinstance(parsed, dict):
                story_id = parsed.get("storyId", story_id)
                topic_text = parsed.get("topicText", topic_text)
                language = parsed.get("language", language)
        except json.JSONDecodeError:
            logger.debug("Ignoring non-JSON participant metadata")

    logger.info(
        "Agent session context storyId=%s language=%s topicText=%s",
        story_id,
        language,
        topic_text,
    )

    session = AgentSession(
        stt=deepgram.STT(
            api_key=deepgram_api_key,
            model=STT_MODEL,
            language=LANGUAGE,
            smart_format=True,
        ),
        llm=llm,
        tts=deepgram.TTS(
            api_key=deepgram_api_key,
            model=TTS_MODEL,
            encoding="linear16",
            sample_rate=24000,
        ),
        vad=silero.VAD.load(
            min_speech_duration=0.3,
            min_silence_duration=MIN_SILENCE_DURATION,
            prefix_padding_duration=0.2,
        ),
        turn_detection=MultilingualModel(),
    )

    llm_quota_warned = False

    def on_session_error(event: Any) -> None:
        nonlocal llm_quota_warned
        if llm_quota_warned:
            return

        message = str(getattr(event, "error", event))
        if (
            "RESOURCE_EXHAUSTED" in message
            or "Too Many Requests" in message
            or "status_code=429" in message
        ):
            llm_quota_warned = True
            logger.error(
                "Gemini API quota exhausted (429 RESOURCE_EXHAUSTED). "
                "AI follow-up cannot respond until billing/quota is restored."
            )

    session.on("error", on_session_error)

    await session.start(
        room=ctx.room,
        agent=TimeLogStoryAgent(
            story_id=story_id,
            topic_text=topic_text,
            language=language,
        ),
    )


if __name__ == "__main__":
    validate_environment()
    asyncio.set_event_loop(asyncio.new_event_loop())
    agents.cli.run_app(server)
