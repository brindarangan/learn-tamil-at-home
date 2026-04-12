#!/usr/bin/env python3

import hashlib
import json
import mimetypes
import os
import pathlib
import urllib.error
import urllib.parse
import urllib.request
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


ROOT = pathlib.Path(__file__).resolve().parent
LESSONS_DIR = ROOT / "data" / "lessons"


def load_env_files():
    for name in (".env.local", ".env"):
        path = ROOT / name
        if not path.exists():
            continue
        for raw_line in path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            os.environ.setdefault(key, value)


def float_env(name, default):
    try:
        return float(os.getenv(name, default))
    except ValueError:
        return float(default)


def bool_env(name, default):
    value = os.getenv(name)
    if value is None:
        return default
    return value.lower() in {"1", "true", "yes", "on"}


def elevenlabs_settings():
    api_key = os.getenv("ELEVENLABS_API_KEY", "").strip()
    voice_id = os.getenv("ELEVENLABS_VOICE_ID", "").strip()
    return {
        "configured": bool(api_key and voice_id),
        "api_key": api_key,
        "voice_id": voice_id,
        "model_id": os.getenv("ELEVENLABS_MODEL_ID", "eleven_multilingual_v2").strip(),
        "language_code": os.getenv("ELEVENLABS_LANGUAGE_CODE", "ta").strip(),
        "stability": float_env("ELEVENLABS_STABILITY", 0.42),
        "similarity_boost": float_env("ELEVENLABS_SIMILARITY_BOOST", 0.82),
        "style": float_env("ELEVENLABS_STYLE", 0.12),
        "use_speaker_boost": bool_env("ELEVENLABS_USE_SPEAKER_BOOST", True),
    }


def lesson_index():
    index = {}
    for path in LESSONS_DIR.glob("*.json"):
      data = json.loads(path.read_text(encoding="utf-8"))
      index[data["id"]] = data
    return index


def phrase_for_ids(lesson_id, phrase_id):
    lesson = lesson_index().get(lesson_id)
    if not lesson:
        return None, None
    for phrase in lesson.get("phrases", []):
        if phrase.get("id") == phrase_id:
            return lesson, phrase
    return lesson, None


def text_hash(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:12]


def audio_cache_dir():
    configured = os.getenv("AUDIO_CACHE_DIR", "").strip()
    if configured:
        return pathlib.Path(configured).expanduser()
    return ROOT / "generated-audio" / "elevenlabs"


def cache_path(lesson_id, phrase_id, voice_id, text):
    voice_slug = "".join(ch if ch.isalnum() or ch in {"-", "_"} else "-" for ch in voice_id)
    return audio_cache_dir() / voice_slug / lesson_id / f"{phrase_id}-{text_hash(text)}.mp3"


def deterministic_seed(lesson_id, phrase_id):
    digest = hashlib.sha256(f"{lesson_id}:{phrase_id}".encode("utf-8")).digest()
    return int.from_bytes(digest[:4], byteorder="big", signed=False)


def synthesize_phrase(lesson_id, phrase_id):
    settings = elevenlabs_settings()
    if not settings["configured"]:
        return None, HTTPStatus.SERVICE_UNAVAILABLE, {
            "error": "ElevenLabs is not configured",
            "missing": [
                name
                for name, value in (
                    ("ELEVENLABS_API_KEY", settings["api_key"]),
                    ("ELEVENLABS_VOICE_ID", settings["voice_id"]),
                )
                if not value
            ],
        }

    lesson, phrase = phrase_for_ids(lesson_id, phrase_id)
    if not lesson:
        return None, HTTPStatus.NOT_FOUND, {"error": f"Unknown lesson_id: {lesson_id}"}
    if not phrase:
        return None, HTTPStatus.NOT_FOUND, {"error": f"Unknown phrase_id: {phrase_id}"}

    phrase_text = (
        phrase.get("ttsText")
        or phrase.get("script")
        or phrase.get("transliteration")
    )
    cached = cache_path(lesson_id, phrase_id, settings["voice_id"], phrase_text)
    if cached.exists():
        return cached.read_bytes(), HTTPStatus.OK, {"cached": True}

    payload = {
        "text": phrase_text,
        "model_id": settings["model_id"],
        "language_code": settings["language_code"],
        "seed": deterministic_seed(lesson_id, phrase_id),
        "voice_settings": {
            "stability": settings["stability"],
            "similarity_boost": settings["similarity_boost"],
            "style": settings["style"],
            "use_speaker_boost": settings["use_speaker_boost"],
        },
    }

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{settings['voice_id']}?output_format=mp3_44100_128"
    body = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
            "xi-api-key": settings["api_key"],
        },
    )

    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            audio = response.read()
    except urllib.error.HTTPError as error:
        details = error.read().decode("utf-8", errors="replace")
        return None, HTTPStatus.BAD_GATEWAY, {
            "error": "ElevenLabs request failed",
            "status": error.code,
            "details": details[:800],
        }
    except urllib.error.URLError as error:
        return None, HTTPStatus.BAD_GATEWAY, {
            "error": "Could not reach ElevenLabs",
            "details": str(error),
        }

    cached.parent.mkdir(parents=True, exist_ok=True)
    cached.write_bytes(audio)
    return audio, HTTPStatus.OK, {"cached": False}


class AppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def json_response(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_binary(self, status, body, content_type):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def head_only_response(self, status, content_type, content_length=0):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(content_length))
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)

        if parsed.path == "/healthz":
            return self.json_response(HTTPStatus.OK, {"ok": True})

        if parsed.path == "/api/elevenlabs/status":
            settings = elevenlabs_settings()
            payload = {
                "configured": settings["configured"],
                "voice_id": settings["voice_id"],
                "model_id": settings["model_id"],
                "language_code": settings["language_code"],
                "missing": [
                    name
                    for name, value in (
                        ("ELEVENLABS_API_KEY", settings["api_key"]),
                        ("ELEVENLABS_VOICE_ID", settings["voice_id"]),
                    )
                    if not value
                ],
            }
            return self.json_response(HTTPStatus.OK, payload)

        if parsed.path == "/api/elevenlabs/tts":
            query = urllib.parse.parse_qs(parsed.query)
            lesson_id = query.get("lesson_id", [""])[0]
            phrase_id = query.get("phrase_id", [""])[0]
            audio, status, details = synthesize_phrase(lesson_id, phrase_id)
            if audio is None:
                return self.json_response(status, details)
            return self.send_binary(status, audio, "audio/mpeg")

        return super().do_GET()

    def do_HEAD(self):
        parsed = urllib.parse.urlparse(self.path)

        if parsed.path == "/healthz":
            return self.head_only_response(HTTPStatus.OK, "application/json; charset=utf-8")

        return super().do_HEAD()

    def guess_type(self, path):
        if path.endswith(".json"):
            return "application/json"
        return mimetypes.guess_type(path)[0] or "application/octet-stream"


def main():
    load_env_files()
    host = os.getenv("HOST", "0.0.0.0" if os.getenv("PORT") else "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    server = ThreadingHTTPServer((host, port), AppHandler)
    display_host = "127.0.0.1" if host == "0.0.0.0" else host
    print(f"Serving Learn Tamil app on http://{display_host}:{port}")
    print(f"Listening on {host}:{port}")
    print("Lesson data and static files are served from the project root.")
    server.serve_forever()


if __name__ == "__main__":
    main()
