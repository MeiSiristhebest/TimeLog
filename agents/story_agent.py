"""
TimeLog Story Agent - LiveKit Voice AI for Elderly Storytelling

This agent provides real-time AI-assisted voice recording for elderly users
sharing their life stories. It uses:
- Deepgram for STT/TTS (multi-language support)
- Google Gemini for conversation generation
- Silero VAD for voice activity detection (elderly-tuned)
"""

import os
import logging
import asyncio
from typing import Dict, List
from dotenv import load_dotenv

from livekit import rtc
from livekit.agents import (
    AutoSubscribe,
    JobContext,
    WorkerOptions,
    cli,
    llm,
)
from livekit.agents.voice_assistant import VoiceAssistant
from livekit.plugins import deepgram, silero
import google.generativeai as genai

from prompts import build_context_prompt, CONVERSATION_STARTERS

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Configuration from environment
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
USE_VERTEX_AI = os.getenv("USE_VERTEX_AI", "false").lower() == "true"
MIN_SILENCE_DURATION = float(os.getenv("AGENT_MIN_SILENCE_DURATION", "3.0"))
LANGUAGE = os.getenv("AGENT_LANGUAGE", "multi")
TTS_MODEL = os.getenv("AGENT_TTS_MODEL", "aura-asteria-en")

# Validate required environment variables
if not DEEPGRAM_API_KEY:
    raise ValueError("DEEPGRAM_API_KEY environment variable is required")

# Configure Gemini (Direct API or Vertex AI)
if USE_VERTEX_AI:
    # Vertex AI Configuration
    from vertexai.preview.generative_models import GenerativeModel
    import vertexai

    VERTEX_PROJECT_ID = os.getenv("VERTEX_PROJECT_ID")
    VERTEX_LOCATION = os.getenv("VERTEX_LOCATION", "us-central1")

    if not VERTEX_PROJECT_ID:
        raise ValueError("VERTEX_PROJECT_ID is required when USE_VERTEX_AI=true")

    # Initialize Vertex AI
    vertexai.init(project=VERTEX_PROJECT_ID, location=VERTEX_LOCATION)
    logger.info(
        f"Using Vertex AI: project={VERTEX_PROJECT_ID}, location={VERTEX_LOCATION}"
    )
else:
    # Direct Gemini API Configuration
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is required when USE_VERTEX_AI=false")

    genai.configure(api_key=GEMINI_API_KEY)
    logger.info("Using direct Gemini API")


class TimeLogStoryAgent:
    """
    AI Agent for assisting elderly users in recording life stories.

    Features:
    - Elderly-tuned VAD (3-5 second pause tolerance)
    - Multi-language support (Thai/English auto-detection)
    - Warm, patient conversation style
    - Context-aware follow-up questions
    """

    def __init__(self):
        self.conversation_history: List[Dict[str, str]] = []

        # Initialize Gemini model based on configuration
        if USE_VERTEX_AI:
            from vertexai.preview.generative_models import GenerativeModel

            self.gemini_model = GenerativeModel("gemini-2.0-flash-exp")
            logger.info("TimeLog Story Agent initialized with Vertex AI")
        else:
            self.gemini_model = genai.GenerativeModel("gemini-2.0-flash-exp")
            logger.info("TimeLog Story Agent initialized with direct Gemini API")

    async def entrypoint(self, ctx: JobContext):
        """
        Main entrypoint for the LiveKit agent.
        Called when a participant joins a room.
        """
        logger.info(f"Agent starting for room: {ctx.room.name}")

        # Wait for the first participant to join
        await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

        participant = await ctx.wait_for_participant()
        logger.info(f"Participant joined: {participant.identity}")

        # Configure Voice Activity Detection (VAD)
        # CRITICAL: Elderly-tuned settings (longer pause tolerance)
        vad = silero.VAD.load(
            min_speech_duration=0.3,  # Minimum 300ms of speech to start
            min_silence_duration=MIN_SILENCE_DURATION,  # 3-5 seconds for elderly
            padding_duration=0.2,  # 200ms padding
        )

        # Configure Speech-to-Text (STT)
        stt = deepgram.STT(
            api_key=DEEPGRAM_API_KEY,
            model="nova-2",  # Latest Deepgram model
            language=LANGUAGE,  # "multi" for auto-detect Thai/English
            smart_format=True,  # Auto-capitalize, punctuate
        )

        # Configure Text-to-Speech (TTS)
        tts = deepgram.TTS(
            api_key=DEEPGRAM_API_KEY,
            model=TTS_MODEL,  # Emotional voice model
            encoding="linear16",
            sample_rate=24000,
        )

        # Create LLM adapter for Gemini
        llm_adapter = GeminiLLMAdapter(
            model=self.gemini_model, conversation_history=self.conversation_history
        )

        # Create Voice Assistant
        assistant = VoiceAssistant(
            vad=vad,
            stt=stt,
            llm=llm_adapter,
            tts=tts,
            chat_ctx=llm.ChatContext(),  # Conversation context
        )

        # Start the assistant
        assistant.start(ctx.room, participant)

        # Send initial greeting
        await asyncio.sleep(1.0)  # Wait for connection to stabilize
        greeting = CONVERSATION_STARTERS[0]
        await assistant.say(greeting, allow_interruptions=True)
        logger.info(f"Sent greeting: {greeting}")

        # Keep the agent running
        await asyncio.sleep(float("inf"))


class GeminiLLMAdapter(llm.LLM):
    """
    Adapter to integrate Google Gemini with LiveKit's LLM interface.
    """

    def __init__(
        self, model: genai.GenerativeModel, conversation_history: List[Dict[str, str]]
    ):
        super().__init__()
        self.model = model
        self.conversation_history = conversation_history

    async def chat(
        self,
        chat_ctx: llm.ChatContext,
    ) -> llm.LLMStream:
        """
        Generate AI response based on user input.
        """
        # Get the latest user message
        user_message = chat_ctx.messages[-1].content if chat_ctx.messages else ""

        logger.info(f"User said: {user_message}")

        # Record user message in history
        self.conversation_history.append({"speaker": "user", "text": user_message})

        # Build context-aware prompt
        prompt = build_context_prompt(user_message, self.conversation_history)

        try:
            # Generate response from Gemini
            response = await asyncio.to_thread(self.model.generate_content, prompt)

            ai_response = response.text.strip()
            logger.info(f"AI response: {ai_response}")

            # Record AI response in history
            self.conversation_history.append({"speaker": "agent", "text": ai_response})

            # Return as LLM stream (required by LiveKit interface)
            return self._create_stream(ai_response)

        except Exception as e:
            logger.error(f"Error generating response: {e}")
            fallback = "ขอโทษค่ะ คิดไม่ออก ลองพูดอีกทีได้ไหมคะ? (Sorry, I couldn't think. Could you say that again?)"
            return self._create_stream(fallback)

    def _create_stream(self, text: str) -> llm.LLMStream:
        """
        Create a simple LLM stream with the given text.
        """

        # Create a simple stream that yields the text
        async def stream_generator():
            yield llm.ChatChunk(
                choices=[
                    llm.Choice(delta=llm.ChoiceDelta(content=text, role="assistant"))
                ]
            )

        return llm.LLMStream(chunks=stream_generator())


async def main():
    """
    Main function to start the LiveKit agent worker.
    """
    agent = TimeLogStoryAgent()

    # Run the agent worker
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=agent.entrypoint,
            request_fnc=None,  # No custom request handler needed
        )
    )


if __name__ == "__main__":
    asyncio.run(main())
