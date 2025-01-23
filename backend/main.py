from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
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

# Mount static directories properly
app.mount("/static/video", StaticFiles(directory="static/video"), name="video")
app.mount("/static/audio", StaticFiles(directory="static/audio"), name="audio")
app.mount("/static", StaticFiles(directory="frontend_build/static"), name="static")

# Ensure base_url is set correctly
base_url = ""

# Update video directory path
video_dir = os.path.join(os.path.dirname(__file__), "static/video")
if not os.path.exists(video_dir):
    os.makedirs(video_dir, exist_ok=True)

# Create audio directory if it doesn't exist
audio_dir = os.path.join(os.path.dirname(__file__), "static/audio")
if not os.path.exists(audio_dir):
    os.makedirs(audio_dir, exist_ok=True)

VIDEOS = []

for file in os.listdir(video_dir):
    if file.endswith(('.mp4', '.webm', '.mov')):
        VIDEOS.append(f"/static/video/{file}")

# Get LLM API key
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")

@app.get("/next-content")
def get_next_content():
    video_url = select_random_video()
    title, text, article_url = get_random_wikipedia_article()
    summary = gpt4_summarize(text)
    chunks = chunk_text(summary)
    audio_files = []
    
    for chunk in chunks:
        audio_url = generate_tts_for_chunk(chunk)
        # Ensure URLs start with /static/
        if not audio_url.startswith('/static/'):
            audio_url = f'/static/{audio_url}'
        audio_files.append(audio_url)

    # Ensure video URL starts with /static/
    if not video_url.startswith('/static/'):
        video_url = f'/static/{video_url}'

    response = {
        "videoUrl": video_url,
        "articleUrl": article_url,
        "title": title,
        "chunks": [
            {"text": chunk, "audioUrl": audio_url}
            for chunk, audio_url in zip(chunks, audio_files)
        ],
    }

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

            try:
                page = wikipedia.page(pageid=id)
                title = page.title
                text = page.content
                article_url = page.url
                # article_url = f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}"
                print(f"Selected article: {title}")
                print(f"Article URL: {article_url}")
                # print(f"Text: {text}")
            except Exception as e:
                print(f"DisambiguationError")
                return get_random_wikipedia_article()

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
    return summary.strip().replace("*", "")


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
        chunk.replace("&", "&amp;").replace("<", "&lt;").replace(">", "").replace("*", "")
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

        # Save audio to static directory with unique filename
        filename = f"static/audio/tts_{uuid.uuid4()}.mp3"
        with open(filename, "wb") as out:
            out.write(response.audio_content)

        return f"/{filename}"

    except Exception as e:
        print(f"TTS Error: {str(e)}")
        raise


@app.get("/{full_path:path}")
async def serve_react(full_path: str):
    if full_path == "":
        return FileResponse("frontend_build/index.html")
    elif os.path.exists(f"frontend_build/{full_path}"):
        return FileResponse(f"frontend_build/{full_path}")
    return FileResponse("frontend_build/index.html")

@app.get("/debug/static-files")
async def debug_static_files():
    """Debug endpoint to check static file paths"""
    video_files = os.listdir(video_dir)
    audio_files = os.listdir(audio_dir)
    return {
        "video_dir": video_dir,
        "audio_dir": audio_dir,
        "videos": video_files,
        "audio": audio_files,
        "working_dir": os.getcwd(),
    }

# def test(id = 5289531):
    
#     wikipedia.set_lang("en")
#     print("Starting...")
#     try:
#         page = wikipedia.page(pageid=id)
#         title = page.title
#         text = page.content

#         article_url = f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}"
#         print(f"Selected article: {title}")
#         print(f"Article URL: {article_url}")
#         print(f"Text: {text}")
#     except wikipedia.exceptions.DisambiguationError as e:
#         print(f"DisambiguationError: {e}")
#         test(id=18630637)

# test()