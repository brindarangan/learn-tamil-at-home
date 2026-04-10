# Conversational Tamil App Product Brief

## 1. Product vision

Build a Tamil-learning app for people who want to **speak and understand everyday Tamil** without needing to read Tamil script.

This is not a traditional language-learning app. It is a **spoken Tamil coach** for English-dominant learners, especially people born and raised in the United States who may have family or cultural ties to Tamil but never became comfortable speaking it.

## 2. Core learner

### Primary user

- Born and brought up in the United States
- English is their main language
- May understand a few Tamil words from home, movies, or relatives
- Cannot read Tamil script
- Feels embarrassed or hesitant when trying to speak Tamil
- Wants practical conversation, not formal literary Tamil

### What this learner is trying to do

- Talk to parents, grandparents, cousins, or in-laws
- Handle common home situations
- Understand casual spoken Tamil
- Respond naturally instead of translating word-by-word
- Build confidence quickly

### What frustrates this learner today

- Tamil resources often assume script knowledge
- Romanization is inconsistent and confusing
- Textbook Tamil sounds unnatural in family conversation
- Grammar-heavy lessons feel intimidating
- They do not know which phrase is respectful, casual, or awkward

## 3. Product principles

1. Speech first, script optional
The app should teach through audio, transliteration, and meaning. Tamil script can exist as a builder/content-authoring tool, but it should not be required for learners.

2. Real conversation over academic coverage
Teach what people actually say at home and in everyday life, not just grammatically neat sentences.

3. Confidence before correctness
The learner should feel successful early. Imperfect but usable speech matters more than technical perfection in the first phase.

4. Context beats vocabulary lists
Lessons should be built around situations like greeting family, answering questions, eating, visiting, and making plans.

5. English-friendly explanation
Pronunciation, grammar, and usage notes should be written for English speakers with zero Tamil background.

6. Respect register and relationship
Tamil changes based on age, familiarity, and respect. The app should explain this simply and consistently.

## 4. Learning approach

Each lesson should follow a repeating loop:

1. Listen
The learner hears a short Tamil phrase in a realistic voice.

2. Understand
They see an English meaning and a simple pronunciation guide.

3. Repeat
They speak it aloud and compare against a model.

4. Use
They choose the right phrase in a mini scenario.

5. Remix
They swap one word or intent to create their own response.

6. Recall
The app brings the phrase back later with spaced repetition.

## 5. What the learner sees

For each phrase, show:

- Tamil audio
- Friendly transliteration tuned for English speakers
- Plain English meaning
- Tone label such as `casual`, `respectful`, or `home/family`
- When to use it
- Common mistake warning

Example:

- Phrase: `saptiya?`
- Meaning: `Did you eat?`
- Use: Common family/home check-in, often means “Have you eaten?” and also signals care
- Tone: Casual/warm
- Note: This is not always a literal food question; sometimes it is a caring greeting in context

## 6. Strong MVP scope

The MVP should focus on 8 to 12 high-value conversation clusters:

1. Greetings and checking in
2. Respectful family talk
3. Eating and home routines
4. Yes/no and short responses
5. Asking for things politely
6. Understanding common questions from relatives
7. Talking about work, school, and day-to-day life
8. Visiting family or attending gatherings
9. Expressing likes, dislikes, and preferences
10. Clarifying when you did not understand

Each cluster should contain:

- 10 to 20 core phrases
- 2 to 3 micro-dialogues
- 1 pronunciation drill
- 1 listening quiz
- 1 roleplay exercise

## 7. What to avoid in V1

- Tamil script as a requirement
- Literary or overly formal Tamil
- Large grammar tables
- Dictionary-style word memorization without context
- Too many transliteration systems
- Long lessons

## 8. Transliteration guidance

Romanization should be **consistent, pronounceable, and forgiving**. The goal is helping an English speaker say something usable, not linguistic perfection.

Suggested rules:

- Prefer readable spellings over academic transliteration
- Use doubled vowels only when it clearly helps pronunciation
- Keep one canonical app spelling per phrase
- Offer a slower “sound it out” mode for difficult lines

Example style:

- `enna pannre?` instead of a more technical transliteration
- `konjam slow-a sollunga` for practical speech support

You can keep the Tamil script internally for authoring and QA, but the learner-facing default should be audio + English-friendly transliteration.

## 9. Pronunciation strategy

Tamil sounds can be difficult for English speakers, especially:

- retroflex sounds
- doubled consonants
- short vs long vowels
- endings that are softened in casual speech

The app should not overwhelm learners with phonetics. Instead:

- isolate one sound challenge at a time
- compare with approximate English mouth positions
- use slow audio and normal-speed audio
- let learners replay specific syllables

## 10. Tone and dialect strategy

You will need to choose a lane. For a conversational app, the safest direction is:

- modern spoken Tamil
- family-usable
- warm and natural
- clear about when something is Chennai-leaning, home-style, or broadly understandable

Important: do not present one phrase as the only correct Tamil if variants are common. Instead label them clearly, such as:

- `Most common`
- `More respectful`
- `What you may hear at home`

## 11. UX principles

- Audio should lead every lesson
- The learner should be able to finish a lesson in 3 to 7 minutes
- Every screen should answer “What do I say here?”
- English explanations must be short and non-academic
- Progress should be framed as real-world ability, not only streaks or points

Good progress labels:

- `I can greet relatives`
- `I can answer basic family questions`
- `I can ask for food politely`

## 12. Example lesson template

### Lesson: Talking to your mom or dad when you come home

Goals:

- understand a common home greeting
- answer a simple question
- ask for food or water

Core phrases:

- `vandhutiya?` - `You came? / You're back?`
- `aama, ippo thaan vandhen` - `Yeah, I just came`
- `sapadu irukka?` - `Is there food?`
- `konjam tanni kudunga` - `Please give me some water`

Exercises:

- listen and match phrase to meaning
- repeat after speaker
- choose the best reply to a parent
- fill the missing audio response in a mini dialogue

Culture note:

- Direct English translations can sound odd. The important thing is recognizing how Tamil expresses warmth and routine naturally.

## 13. MVP feature set

### Must have

- audio-first lessons
- transliteration + English meaning
- phrase playback controls
- simple speaking practice
- listening checks
- spaced repetition for phrases
- scenario-based modules

### Nice to have later

- AI conversation partner
- family mode by relationship (mom, dad, paati, thatha, cousin, in-laws)
- dialect packs
- script reveal toggle
- builder dashboard for authoring Tamil content from script into learner-friendly output

## 14. Builder advantage

Because you can read and write Tamil, your advantage is not just content creation. It is **translation of real Tamil into usable spoken learning experiences**.

That means your system can internally store:

- Tamil script
- transliteration
- literal gloss
- natural English meaning
- tone/register
- usage notes
- audio

This gives you a strong content pipeline while keeping the learner experience script-free.

## 15. A sharp product positioning statement

`Learn the Tamil you can actually say at home. No script required.`

Alternative:

`A spoken Tamil app for English-dominant learners who want real family conversation.`

## 16. Best first prototype

If you want to validate the idea quickly, do not build a full course first.

Build one polished module:

- `Talking to family at home`

Include:

- 15 to 20 phrases
- 5 mini dialogues
- audio at slow and normal speed
- transliteration
- short culture/tone notes
- one simple speaking practice loop

If users finish that module and say “I can actually use this,” you have the right foundation.
