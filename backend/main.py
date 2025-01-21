from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import openai
import requests
import uuid
from google.cloud import texttospeech
from dotenv import load_dotenv
import os
import random
import wikipedia
from prompt import PROMPT
load_dotenv()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://wiktok-398449484807.us-central1.run.app"],
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

app.mount("/static", StaticFiles(directory="static"), name="static")

# Base URL for static files
base_url = "http://localhost:8000"

VIDEOS = []
video_dir = "static/video"

for file in os.listdir(video_dir):
    if file.endswith(('.mp4', '.webm', '.mov')):
        VIDEOS.append(f"/static/video/{file}")

# Get LLM API key
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")

@app.get("/next-content")
def get_next_content():
    # 1) Pick a random video
    video_url = select_random_video()

    # 2) Fetch random Wikipedia article
    title, text, article_url = get_random_wikipedia_article()

    # 3) Summarize with GPT-4
    summary = gpt4_summarize(text)

    # 4) Split into sentence chunks and generate audio for each
    chunks = chunk_text(summary)
    audio_files = []
    for chunk in chunks:
        audio_url = generate_tts_for_chunk(chunk)
        audio_files.append(audio_url)

    # 5) Return data for front-end
    response = {
        "videoUrl": base_url + video_url,
        "articleUrl": article_url,
        "title": title,
        "chunks": [
            {"text": chunk, "audioUrl": base_url + audio_url}
            for chunk, audio_url in zip(chunks, audio_files)
        ],
    }

    print(response)
    return response

def select_random_video():
    return random.choice(VIDEOS)


def get_random_wikipedia_article():
    try:

        url = "https://en.wikipedia.org/w/api.php"
        params = {
            "action": "query",
            "format": "json",
            "list": "random",
            "rnnamespace": 0,  # Main namespace
            "rnlimit": 1,  # Get one random page
        }
        response = requests.get(url, params=params)
        data = response.json()
        if "query" in data and "random" in data["query"]:
            random_page = data["query"]["random"][0]
            id = random_page["id"]
            print(id)

            wikipedia.set_lang("en")
            page = wikipedia.page(pageid=id)
            title = page.title
            text = page.content
            # print(title)
            # print(text)

            article_url = f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}"
            print(f"Selected article: {title}")
            print(f"Article URL: {article_url}")

            return title, text, article_url
        else:
            get_random_wikipedia_article()

    except Exception as e:
        return {"error": str(e)}, 500


def gpt4_summarize(full_text):
    prompt = f"Text to summarize:\n{full_text}"
    # (Truncate to fit token limits if needed)
    client = openai.OpenAI(api_key=DEEPSEEK_API_KEY, base_url="https://api.deepseek.com")

    resp = client.chat.completions.create(
        model="deepseek-chat", 
        messages=[
            {"role": "system", "content": PROMPT},
            {"role": "user", "content": prompt}
            ], 
        temperature=0.7
    )
    summary = resp.choices[0].message.content
    print(summary)
    return summary.strip()


def chunk_text(text):
    # Split text into individual sentences
    import re

    sentences = re.split(r"(?<=[.!?]) +", text)
    return [s.strip() for s in sentences if s.strip()]


def generate_tts_for_chunk(chunk):
    """Generate TTS audio for a single chunk of text"""
    client = texttospeech.TextToSpeechClient()

    # Escape special characters for SSML
    escaped_chunk = (
        chunk.replace("&", "&amp;").replace("<", "&lt;").replace(">", "")
    )
    ssml = f"<speak>{escaped_chunk}</speak>"

    synthesis_input = texttospeech.SynthesisInput(ssml=ssml)

    voice = texttospeech.VoiceSelectionParams(
        language_code="en-US",
        name="en-US-Standard-A",
        ssml_gender=texttospeech.SsmlVoiceGender.MALE,
    )

    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3,
        speaking_rate=1.3,
        pitch=0.0,
        volume_gain_db=0.0,
        sample_rate_hertz=24000,
        effects_profile_id=["telephony-class-application"],
    )

    try:
        response = client.synthesize_speech(
            input=synthesis_input, voice=voice, audio_config=audio_config
        )

        # Create a static directory for audio files if it doesn't exist
        os.makedirs("static/audio", exist_ok=True)

        # Save audio to static directory with unique filename
        filename = f"static/audio/tts_{uuid.uuid4()}.mp3"
        with open(filename, "wb") as out:
            out.write(response.audio_content)

        return f"/{filename}"

    except Exception as e:
        print(f"TTS Error: {str(e)}")
        raise


@app.get("/api/test-tts")
def test_tts():
    test_text = "Hello! This is a test of the text-to-speech system. How does it sound?"
    chunks = chunk_text(test_text)
    try:
        audio_files = []
        for chunk in chunks:
            audio_url = generate_tts_for_chunk(chunk)
            audio_files.append(audio_url)

        return {
            "message": "TTS audio generated successfully",
            "chunks": [
                {"text": chunk, "audioUrl": audio_url}
                for chunk, audio_url in zip(chunks, audio_files)
            ],
        }
    except Exception as e:
        return {"error": str(e)}, 500


@app.get("/api/test-request")
def test_request():
    try:

        url = "https://en.wikipedia.org/w/api.php"
        params = {
            "action": "query",
            "format": "json",
            "list": "random",
            "rnnamespace": 0,  # Main namespace
            "rnlimit": 1,  # Get one random page
        }
        response = requests.get(url, params=params)
        data = response.json()
        if "query" in data and "random" in data["query"]:
            random_page = data["query"]["random"][0]
            id = random_page["id"]
            print(id)

            wikipedia.set_lang("en")
            page = wikipedia.page(pageid=id)
            title = page.title
            text = page.content
            print(title)
            print(text)
            return title, text
        else:
            get_random_wikipedia_article()

    except Exception as e:
        return {"error": str(e)}, 500
