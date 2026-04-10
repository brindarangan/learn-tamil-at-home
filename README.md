# Learn Tamil at Home

A website-ready spoken Tamil prototype for English-dominant learners who do not read Tamil script, now including an open-licensed OpenSLR audio experiment on localhost.

## What is in this prototype

- one Chennai-style home-conversation lesson
- one OpenSLR native-audio experiment lesson
- transliteration-first phrase cards
- optional Tamil script toggle for builder review
- mini dialogue choices and recall practice
- lesson content moved into JSON files under `data/lessons/`
- hosted-audio hooks that expect MP3 files in `audio/lesson-01/`
- extracted OpenSLR WAV clips in `audio/openslr65/`
- static hosting config for Netlify, Vercel, and GitHub Pages

## Local run

From this folder:

```bash
python3 -m http.server 8000
```

Then open the OpenSLR experiment:

`http://localhost:8000`

Or open the original home-conversation lesson:

`http://localhost:8000/?lesson=lesson-01`

## Website hosting

This project is static, so you can host it on:

- Vercel
- Netlify
- GitHub Pages

No build step is required. The host just needs to serve the project root as static files.

## Audio workflow

This project now supports two audio paths:

1. Your own hosted lesson audio in `audio/lesson-01/`.
2. OpenSLR WAV clips extracted into `audio/openslr65/` for testing authentic native audio.

If you record your own clips:

1. Record one MP3 per phrase.
2. Put the files in `audio/lesson-01/`.
3. Keep the filenames listed in `audio/lesson-01/README.md`.
4. If you change filenames or move to a CDN, update `data/lessons/lesson-01.json`.

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
