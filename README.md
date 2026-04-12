# Learn Tamil at Home

A website-ready spoken Tamil prototype for English-dominant learners who do not read Tamil script, with a local ElevenLabs audio path for the main lesson and an OpenSLR experiment kept alongside it.

## What is in this prototype

- one Chennai-style home-conversation lesson wired for local ElevenLabs audio
- one OpenSLR native-audio experiment lesson
- transliteration-first phrase cards
- optional Tamil script toggle for builder review
- mini dialogue choices and recall practice
- lesson content moved into JSON files under `data/lessons/`
- a local ElevenLabs proxy server in `serve.py`
- extracted OpenSLR WAV clips in `audio/openslr65/`
- static hosting config for Netlify, Vercel, and GitHub Pages

## Local run

From this folder:

```bash
python3 serve.py
```

Then open the main ElevenLabs-backed lesson:

`http://localhost:8000`

Or open the OpenSLR experiment:

`http://localhost:8000/?lesson=lesson-openslr`

## Website hosting

This project is static, so you can host it on:

- Vercel
- Netlify
- GitHub Pages

No build step is required. The host just needs to serve the project root as static files.

## Live hosting with ElevenLabs

If you want the lesson audio to work for other people on a public URL, deploy the Python server instead of only hosting the static files.

This repo is now set up for a single-service Render deploy:

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

This project now supports two audio paths:

1. Local ElevenLabs generation for the main home lesson.
2. OpenSLR WAV clips extracted into `audio/openslr65/` for testing authentic native audio.

For ElevenLabs local generation:

1. Create `.env.local` in the project root.
2. Add the variables listed in `.env.example`.
3. Set `ELEVENLABS_API_KEY` and a conversational Tamil-friendly `ELEVENLABS_VOICE_ID`.
4. Run `python3 serve.py`.
5. Click a phrase in lesson 01 to generate and cache its MP3 locally.

Generated audio is cached under `generated-audio/` and ignored by git.

## Content workflow

The lessons now live in:

- `data/lessons/lesson-01.json`
- `data/lessons/lesson-openslr.json`

That makes it easier to:

- add more lessons
- swap in new audio URLs
- later connect a CMS or admin tool

## OpenSLR experiment notes

- The OpenSLR lesson uses real open-licensed Tamil corpus WAV files.
- The clips are more authentic than browser TTS, but they are not exact matches for the original family-home lesson.
- The source archive used locally is `dataset/openslr65/ta_in_female.zip`.

## Notes

- Open the site through a server or real website URL, not by double-clicking `index.html`, because the app fetches JSON lesson data.
- This app is intentionally dependency-free so it is easy to host and share.
