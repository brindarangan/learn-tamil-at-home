# Learn Tamil at Home

A website-ready spoken Tamil prototype for English-dominant learners who do not read Tamil script, with three local ElevenLabs-backed practice lessons and one OpenSLR native-audio experiment kept alongside them.

## What is in this prototype

- three Chennai-leaning spoken Tamil lessons wired for local ElevenLabs audio
- one OpenSLR native-audio experiment lesson
- lesson tabs for moving across modules in the same app shell
- transliteration-first phrase cards with optional Tamil script toggle for builder review
- phrase detail panels with slow and normal playback plus word-by-word glosses
- mini dialogue choices and recall practice with per-lesson browser-side progress
- lesson content stored as JSON files under `data/lessons/`
- a local ElevenLabs proxy server in `serve.py`
- extracted OpenSLR WAV clips in `audio/openslr65/`
- static hosting config for Netlify, Vercel, and GitHub Pages

## Local run

From this folder:

```bash
python3 serve.py
```

No third-party Python packages are required for the local server.

Then open the main app:

`http://localhost:8000`

You can switch lessons from the in-app lesson tabs, or open them directly:

- `http://localhost:8000` for lesson 1
- `http://localhost:8000/?lesson=lesson-02` for lesson 2
- `http://localhost:8000/?lesson=lesson-03` for lesson 3
- `http://localhost:8000/?lesson=lesson-openslr` for the OpenSLR experiment

## Local audio setup

For ElevenLabs-backed lessons:

1. Copy `.env.example` to `.env.local` if you want a local-only config, or add the same variables to `.env`.
2. Set `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID`.
3. Run `python3 serve.py`.
4. Open lesson 1, 2, or 3 and click any phrase to generate and cache audio locally.

The server reads `.env.local` first and then `.env`. Generated audio is cached under `generated-audio/` and ignored by git.

For the OpenSLR experiment:

- No ElevenLabs credentials are required.
- The lesson uses hosted WAV files linked directly from `audio/openslr65/`.

## Current lesson set

- `lesson-01`: Coming home and talking to family
- `lesson-02`: Common family questions and replies
- `lesson-03`: Core verbs and sentence patterns
- `lesson-openslr`: Open-license native clip test

## Website hosting

This project can be hosted in two ways:

1. Static hosting for the frontend files.
2. Python server hosting when you want live ElevenLabs generation on a public URL.

Static hosting works on:

- Vercel
- Netlify
- GitHub Pages

No build step is required. The host just needs to serve the project root as static files.

Important limitation:

- Static hosting alone is enough for the OpenSLR lesson and general UI review.
- The ElevenLabs-backed lessons need `serve.py` because the frontend calls `/api/elevenlabs/status` and `/api/elevenlabs/tts`.

## Live hosting with ElevenLabs

If you want lessons 1 through 3 audio to work for other people on a public URL, deploy the Python server instead of only hosting the static files.

This repo is set up for a single-service Render deploy:

1. Push the repo to GitHub.
2. Create a new Blueprint service on Render from this repo.
3. Render will read `render.yaml`.
4. Enter `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` when prompted.
5. Deploy and share the resulting `onrender.com` URL.

Important deployment notes:

- The public app serves both the website and the `/api/elevenlabs/*` endpoints from `serve.py`.
- Changing the teacher voice is usually just an env-var change: update `ELEVENLABS_VOICE_ID` in Render and redeploy.
- Audio cache files are separated by voice ID, so a new voice generates a new cache tree automatically.
- By default, generated audio is stored inside the service filesystem. If you want cache files to survive redeploys, set `AUDIO_CACHE_DIR` to a persistent mounted path on your host.

## Audio workflow

This project currently supports two audio paths:

1. Local ElevenLabs generation for lessons 1 through 3.
2. OpenSLR WAV clips in `audio/openslr65/` for testing authentic native audio.

The frontend supports slow and normal playback for both modes.

## Content workflow

The lessons currently live in:

- `data/lessons/lesson-01.json`
- `data/lessons/lesson-02.json`
- `data/lessons/lesson-03.json`
- `data/lessons/lesson-openslr.json`

That makes it easier to:

- add more lessons
- swap in new audio URLs
- keep copy and practice flow changes out of the core app shell
- later connect a CMS or admin tool

## OpenSLR experiment notes

- The OpenSLR lesson uses real open-licensed Tamil corpus WAV files.
- The clips are more authentic than browser TTS, but they are not exact matches for the original family-home lesson flow.
- The app exposes source, license, attribution, and notes for the dataset-backed lesson.
- The source archive used locally is `dataset/openslr65/ta_in_female.zip`.

## Notes

- Open the site through a server or real website URL, not by double-clicking `index.html`, because the app fetches JSON lesson data.
- Progress is stored in `localStorage` per lesson on the current device and browser.
- This app is intentionally dependency-free so it is easy to host and share.
