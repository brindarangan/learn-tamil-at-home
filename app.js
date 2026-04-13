const DEFAULT_LESSON = "lesson-00";
const LESSONS = {
  "lesson-00": "/data/lessons/lesson-00.json",
  "lesson-01": "/data/lessons/lesson-01.json",
  "lesson-02": "/data/lessons/lesson-02.json",
  "lesson-03": "/data/lessons/lesson-03.json",
  "lesson-openslr": "/data/lessons/lesson-openslr.json",
};
const LESSON_TAB_ITEMS = [
  {
    key: "lesson-00",
    label: "Lesson 0",
    summary: "Quick-start Tamil words",
  },
  {
    key: "lesson-01",
    label: "Lesson 1",
    summary: "Coming home and talking to family",
  },
  {
    key: "lesson-02",
    label: "Lesson 2",
    summary: "Common family questions and replies",
  },
  {
    key: "lesson-03",
    label: "Lesson 3",
    summary: "At the dinner table",
  },
];

const state = {
  lesson: null,
  lessonKey: DEFAULT_LESSON,
  activePhraseId: null,
  dialogueIndex: 0,
  dialogueLocked: false,
  dialogueScore: 0,
  recallIndex: 0,
  showScript: false,
  studied: [],
  recallRatings: [],
  audioStatus: null,
};

const SPEED_PRESETS = {
  slow: {
    mediaRate: 0.65,
    speechRate: 0.72,
    label: "slow",
  },
  normal: {
    mediaRate: 1,
    speechRate: 0.92,
    label: "normal",
  },
};

const playback = {
  audio: new Audio(),
  objectUrl: null,
};

let phraseDetailHighlightTimeout = null;
let phraseLayoutResizeFrame = null;

function resolveAppPath(path) {
  if (!path) {
    return path;
  }

  return new URL(path, window.location.origin).toString();
}

const heroEyebrow = document.getElementById("heroEyebrow");
const heroTitle = document.getElementById("heroTitle");
const heroText = document.getElementById("heroText");
const panelLabel = document.getElementById("panelLabel");
const panelList = document.getElementById("panelList");
const lessonKicker = document.getElementById("lessonKicker");
const lessonTitle = document.getElementById("lessonTitle");
const lessonDescription = document.getElementById("lessonDescription");
const sourceSection = document.getElementById("sourceSection");
const sourceTitle = document.getElementById("sourceTitle");
const sourceSummary = document.getElementById("sourceSummary");
const sourceLicense = document.getElementById("sourceLicense");
const sourceAttribution = document.getElementById("sourceAttribution");
const sourceNotes = document.getElementById("sourceNotes");
const studySection = document.getElementById("studySection");
const studyKicker = document.getElementById("studyKicker");
const studyTitle = document.getElementById("studyTitle");
const studyDescription = document.getElementById("studyDescription");
const phraseGrid = document.getElementById("phraseGrid");
const phraseDetail = document.getElementById("phraseDetail");
const dialogueSection = document.getElementById("dialogueSection");
const dialogueKicker = document.getElementById("dialogueKicker");
const dialogueTitle = document.getElementById("dialogueTitle");
const dialogueDescription = document.getElementById("dialogueDescription");
const statusCard = document.getElementById("statusCard");
const audioNote = document.getElementById("audioNote");
const lessonTabs = document.getElementById("lessonTabs");
const scriptToggle = document.getElementById("scriptToggle");
const startLessonButton = document.getElementById("startLessonButton");

const dialogueStepLabel = document.getElementById("dialogueStepLabel");
const dialogueScoreLabel = document.getElementById("dialogueScoreLabel");
const dialoguePrompt = document.getElementById("dialoguePrompt");
const dialogueContext = document.getElementById("dialogueContext");
const dialogueAnswers = document.getElementById("dialogueAnswers");
const dialogueFeedback = document.getElementById("dialogueFeedback");
const nextDialogueButton = document.getElementById("nextDialogueButton");

const recallPrompt = document.getElementById("recallPrompt");
const recallAnswer = document.getElementById("recallAnswer");
const recallTransliteration = document.getElementById("recallTransliteration");
const recallScript = document.getElementById("recallScript");
const recallNote = document.getElementById("recallNote");
const recallSection = document.getElementById("recallSection");
const recallKicker = document.getElementById("recallKicker");
const recallTitle = document.getElementById("recallTitle");
const recallDescription = document.getElementById("recallDescription");
const revealRecallButton = document.getElementById("revealRecallButton");
const playRecallButton = document.getElementById("playRecallButton");
const ratingRow = document.getElementById("ratingRow");

function isWordCardsLesson() {
  return state.lesson?.format === "word-cards";
}

function lessonHasDialogues() {
  return Array.isArray(state.lesson?.dialogues) && state.lesson.dialogues.length > 0;
}

function lessonHasRecalls() {
  return Array.isArray(state.lesson?.recalls) && state.lesson.recalls.length > 0;
}

function studyItemLabel(count = 1) {
  if (isWordCardsLesson()) {
    return count === 1 ? "word" : "words";
  }

  return count === 1 ? "phrase" : "phrases";
}

function lessonStorageKey(name) {
  const lessonId = state.lesson ? state.lesson.id : "default";
  return `learn-tamil-${lessonId}-${name}`;
}

function loadState(key, fallback) {
  try {
    const raw = window.localStorage.getItem(lessonStorageKey(key));
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

function saveState(key, value) {
  try {
    window.localStorage.setItem(lessonStorageKey(key), JSON.stringify(value));
  } catch (error) {
    // Ignore storage issues and keep the app usable.
  }
}

async function loadLesson() {
  const lessonKey = new URLSearchParams(window.location.search).get("lesson") || DEFAULT_LESSON;
  state.lessonKey = lessonKey;
  const lessonPath = LESSONS[lessonKey] || LESSONS[DEFAULT_LESSON];
  const response = await fetch(resolveAppPath(lessonPath));

  if (!response.ok) {
    throw new Error(`Lesson request failed with ${response.status}`);
  }

  return response.json();
}

function initializeLessonState() {
  state.activePhraseId = state.lesson.phrases[0]?.id || null;
  state.dialogueIndex = 0;
  state.dialogueLocked = false;
  state.dialogueScore = 0;
  state.recallIndex = 0;
  state.studied = loadState("studied", []);
  state.recallRatings = loadState("recallRatings", []);
}

function renderLoadingState() {
  statusCard.innerHTML = "<strong>Loading</strong><p>Preparing the lesson and audio settings...</p>";
  audioNote.textContent = "Loading website lesson data...";
  phraseDetail.innerHTML = "<p>Loading lesson content...</p>";
}

function renderErrorState(message) {
  statusCard.innerHTML = "<strong>Unavailable</strong><p>The lesson could not be loaded.</p>";
  audioNote.textContent = message;
  phraseGrid.innerHTML = "";
  phraseDetail.innerHTML = `
    <p>The lesson JSON did not load. If you opened this file directly, use a local web server or a hosted website URL instead.</p>
  `;
}

function renderLessonChrome() {
  heroEyebrow.textContent = state.lesson.eyebrow;
  heroTitle.textContent = state.lesson.heroTitle;
  heroText.textContent = state.lesson.heroText;
  panelLabel.textContent = state.lesson.panelLabel;
  lessonKicker.textContent = state.lesson.lessonNumber;
  lessonTitle.textContent = state.lesson.title;
  lessonDescription.textContent = state.lesson.description;

  panelList.innerHTML = "";
  state.lesson.panelList.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    panelList.appendChild(li);
  });

  renderSourceSection();
  renderSectionChrome();
}

function renderSectionChrome() {
  const studyCopy = state.lesson.studySection || {};
  studyKicker.textContent = studyCopy.kicker || (isWordCardsLesson() ? "Word Cards" : "Phrase Studio");
  studyTitle.textContent = studyCopy.title || (isWordCardsLesson() ? "Learn the words you keep hearing" : "Build your core phrases");
  studyDescription.textContent =
    studyCopy.description ||
    (isWordCardsLesson()
      ? "Tap a word card to hear it, see what it means, and get comfortable recognizing it before full conversations."
      : "Tap a card to open its practice panel right in the flow. Use slow audio first, then normal speed.");

  const dialogueCopy = state.lesson.dialogueSection || {};
  dialogueKicker.textContent = dialogueCopy.kicker || "Use It";
  dialogueTitle.textContent = dialogueCopy.title || "Choose the reply that fits the moment";
  dialogueDescription.textContent =
    dialogueCopy.description ||
    "These mini-scenes focus on the kind of Tamil learners hear from family, not textbook conversations.";
  dialogueSection.hidden = !lessonHasDialogues();

  const recallCopy = state.lesson.recallSection || {};
  recallKicker.textContent = recallCopy.kicker || "Recall";
  recallTitle.textContent = recallCopy.title || "Can you say it without help?";
  recallDescription.textContent =
    recallCopy.description ||
    "Read the English cue first. Say your answer out loud before you reveal the Tamil.";
  recallSection.hidden = !lessonHasRecalls();
}

function urlForLesson(key) {
  const url = new URL(window.location.href);
  if (key === DEFAULT_LESSON) {
    url.searchParams.delete("lesson");
  } else {
    url.searchParams.set("lesson", key);
  }
  return url.toString();
}

function renderLessonTabs() {
  if (!lessonTabs) {
    return;
  }

  lessonTabs.innerHTML = "";
  LESSON_TAB_ITEMS.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `lesson-tab ${state.lessonKey === item.key ? "is-active" : ""}`;
    button.innerHTML = `
      <strong>${item.label}</strong>
      <span>${item.summary}</span>
    `;
    button.addEventListener("click", () => {
      window.location.href = urlForLesson(item.key);
    });
    lessonTabs.appendChild(button);
  });
}

function renderSourceSection() {
  if (!state.lesson.source) {
    sourceSection.hidden = true;
    return;
  }

  sourceSection.hidden = false;
  sourceTitle.textContent = state.lesson.source.title || "Lesson audio source";
  sourceSummary.textContent = state.lesson.source.summary || "";
  sourceLicense.textContent = state.lesson.source.license || "";
  sourceAttribution.textContent = state.lesson.source.attribution || "";
  sourceNotes.textContent = state.lesson.source.notes || "";
}

function getActivePhrase() {
  return state.lesson.phrases.find((item) => item.id === state.activePhraseId);
}

function getPhraseById(id) {
  return state.lesson.phrases.find((item) => item.id === id);
}

function markStudied(id) {
  if (!state.studied.includes(id)) {
    state.studied.push(id);
    saveState("studied", state.studied);
    renderStatus();
  }
}

function renderStatus() {
  const studiedCount = state.studied.length;
  const recallCount = state.recallRatings.length;
  const lines = [
    `<strong>${studiedCount}/${state.lesson.phrases.length}</strong>`,
    `<p>${studyItemLabel(2)} explored</p>`,
  ];

  if (lessonHasDialogues()) {
    lines.push(`<p>${state.dialogueScore}/${state.lesson.dialogues.length} dialogue choices correct this round</p>`);
  }

  if (lessonHasRecalls()) {
    lines.push(`<p>${recallCount} recall cards rated on this device</p>`);
  }

  statusCard.innerHTML = lines.join("");
}

function renderAudioNote(customMessage) {
  if (customMessage) {
    audioNote.textContent = customMessage;
    return;
  }

  const audioConfig = state.lesson.audio || {};
  if (audioConfig.mode === "elevenlabs-local") {
    if (!state.audioStatus) {
      audioNote.textContent = "Checking local ElevenLabs setup...";
      return;
    }

    if (!state.audioStatus.configured) {
      const missing = (state.audioStatus.missing || []).join(", ");
      audioNote.textContent = `Local ElevenLabs audio is not configured yet. Missing: ${missing}. Add them in .env.local and run serve.py.`;
      return;
    }

    audioNote.textContent = "Local ElevenLabs audio is ready.";
    return;
  }

  audioNote.textContent = audioConfig.note || "Add hosted audio clips for a consistent website experience.";
}

function phraseHasPlayableAudio(phrase) {
  const audioConfig = state.lesson.audio || {};
  if (audioConfig.mode === "elevenlabs-local") {
    return true;
  }
  return Boolean(phrase.audioSrc);
}

function renderPhraseGrid() {
  phraseGrid.innerHTML = "";
  const cardLabel = studyItemLabel(1);

  state.lesson.phrases.forEach((phrase, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `phrase-card ${phrase.id === state.activePhraseId ? "is-active" : ""}`;
    button.setAttribute("aria-expanded", phrase.id === state.activePhraseId ? "true" : "false");
    button.setAttribute("aria-controls", "phraseDetail");
    button.innerHTML = `
      <span class="phrase-index">${cardLabel.charAt(0).toUpperCase() + cardLabel.slice(1)} ${String(index + 1).padStart(2, "0")}</span>
      <span class="phrase-transliteration">${phrase.transliteration}</span>
      <span class="phrase-meaning">${phrase.meaning}</span>
      <span class="tag">${phrase.tone}</span>
    `;

    button.addEventListener("click", () => {
      focusPhrase(phrase.id);
    });

    phraseGrid.appendChild(button);
  });
}

function getPhraseGridColumnCount() {
  const template = window.getComputedStyle(phraseGrid).gridTemplateColumns;
  if (!template || template === "none") {
    return 1;
  }

  return template.split(" ").filter(Boolean).length || 1;
}

function placePhraseDetail() {
  const activeIndex = state.lesson.phrases.findIndex((item) => item.id === state.activePhraseId);
  if (activeIndex === -1) {
    phraseGrid.appendChild(phraseDetail);
    return;
  }

  const columnCount = getPhraseGridColumnCount();
  const insertionIndex = Math.min(
    phraseGrid.children.length,
    Math.floor(activeIndex / columnCount) * columnCount + columnCount,
  );
  const nextSibling = phraseGrid.children[insertionIndex];

  if (nextSibling) {
    phraseGrid.insertBefore(phraseDetail, nextSibling);
    return;
  }

  phraseGrid.appendChild(phraseDetail);
}

function syncPhraseDetailFeedback() {
  phraseDetail.classList.remove("is-refreshing");
  void phraseDetail.offsetWidth;
  phraseDetail.classList.add("is-refreshing");

  window.clearTimeout(phraseDetailHighlightTimeout);
  phraseDetailHighlightTimeout = window.setTimeout(() => {
    phraseDetail.classList.remove("is-refreshing");
  }, 520);

  window.requestAnimationFrame(() => {
    const detailBounds = phraseDetail.getBoundingClientRect();
    const detailFullyVisible = detailBounds.top >= 16 && detailBounds.bottom <= window.innerHeight - 16;
    if (!detailFullyVisible) {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      phraseDetail.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "nearest",
      });
    }
  });
}

function focusPhrase(phraseId, options = {}) {
  state.activePhraseId = phraseId;
  markStudied(phraseId);
  renderPhraseGrid();
  renderPhraseDetail();

  if (!options.skipDetailFocus) {
    syncPhraseDetailFeedback();
  }
}

function renderPhraseDetail() {
  const phrase = getActivePhrase();
  const hasAudio = phraseHasPlayableAudio(phrase);
  const wordBreakdown = Array.isArray(phrase.wordBreakdown) ? phrase.wordBreakdown : [];
  const detailLabel = isWordCardsLesson() ? "Focus word" : "Focus phrase";
  const breakdownTitle = isWordCardsLesson() ? "Word meaning" : "Word by word";
  const breakdownSubtitle = isWordCardsLesson()
    ? "Quick reference for what this word is doing"
    : "Quick gloss for the phrase pieces";
  const usageLabel = isWordCardsLesson() ? "Where you'll hear it" : "When to use it";
  const audioLabel = (state.lesson.audio || {}).mode === "elevenlabs-local"
    ? "Generated locally via ElevenLabs"
    : hasAudio
      ? "Hosted audio file"
      : "No clip linked yet";
  const wordBreakdownMarkup = wordBreakdown.length
    ? `
      <div class="word-breakdown">
        <div class="word-breakdown-header">
          <strong>${breakdownTitle}</strong>
          <span>${breakdownSubtitle}</span>
        </div>
        <div class="word-breakdown-grid">
          ${wordBreakdown
            .map(
              (item) => `
                <div class="word-chip">
                  <span class="word-term">${item.word}</span>
                  <span class="word-meaning">${item.meaning}</span>
                </div>
              `,
            )
            .join("")}
        </div>
      </div>
    `
    : "";

  phraseDetail.innerHTML = `
    <div class="detail-header">
      <p class="section-kicker">${detailLabel}</p>
      <h3>${phrase.transliteration}</h3>
      <p class="detail-script builder-only">${phrase.script}</p>
      <p>${phrase.meaning}</p>
    </div>
    <div class="button-row">
      <button class="sound-button" type="button" data-action="slow" ${hasAudio ? "" : "disabled"}>Play slow</button>
      <button class="sound-button" type="button" data-action="normal" ${hasAudio ? "" : "disabled"}>Play normal</button>
      <button class="ghost-button" type="button" data-action="studied">Mark practiced</button>
    </div>
    ${wordBreakdownMarkup}
    <div class="meta-grid">
      <div class="meta-chip">
        <strong>Tone</strong>
        <span>${phrase.tone}</span>
      </div>
      <div class="meta-chip">
        <strong>${usageLabel}</strong>
        <span>${phrase.useCase}</span>
      </div>
      <div class="meta-chip">
        <strong>Audio</strong>
        <span>${audioLabel}</span>
      </div>
    </div>
    <p class="detail-note">${phrase.note}</p>
  `;

  placePhraseDetail();

  phraseDetail.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", async () => {
      const action = button.dataset.action;

      if (action === "slow") {
        await playPhrase(phrase, "slow");
      }

      if (action === "normal") {
        await playPhrase(phrase, "normal");
      }

      if (action === "studied") {
        markStudied(phrase.id);
      }
    });
  });
}

function renderDialogue() {
  const scene = state.lesson.dialogues[state.dialogueIndex];

  dialogueStepLabel.textContent = `Scene ${state.dialogueIndex + 1} of ${state.lesson.dialogues.length}`;
  dialogueScoreLabel.textContent = `Score: ${state.dialogueScore}`;
  dialoguePrompt.textContent = scene.prompt;
  dialogueContext.textContent = scene.context;
  dialogueFeedback.className = "feedback-card";
  dialogueFeedback.textContent = "Choose the phrase that fits the situation best.";
  nextDialogueButton.hidden = true;
  nextDialogueButton.textContent =
    state.dialogueIndex === state.lesson.dialogues.length - 1 ? "Restart scenes" : "Next scene";

  dialogueAnswers.innerHTML = "";
  state.dialogueLocked = false;

  scene.answers.forEach((answer, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer-button";
    button.textContent = answer;

    button.addEventListener("click", () => {
      if (state.dialogueLocked) {
        return;
      }

      state.dialogueLocked = true;
      const isCorrect = index === scene.correctIndex;

      if (isCorrect) {
        state.dialogueScore += 1;
        button.classList.add("is-correct");
        dialogueFeedback.classList.add("is-correct");
        dialogueFeedback.textContent = `Nice. ${scene.explanation}`;
      } else {
        button.classList.add("is-wrong");
        dialogueFeedback.classList.add("is-wrong");
        dialogueFeedback.textContent = `Not quite. ${scene.explanation}`;
      }

      [...dialogueAnswers.children].forEach((answerButton, answerIndex) => {
        answerButton.disabled = true;
        if (answerIndex === scene.correctIndex) {
          answerButton.classList.add("is-correct");
        }
      });

      renderStatus();
      nextDialogueButton.hidden = false;
      dialogueScoreLabel.textContent = `Score: ${state.dialogueScore}`;
    });

    dialogueAnswers.appendChild(button);
  });
}

function advanceDialogue() {
  if (!lessonHasDialogues()) {
    return;
  }

  if (state.dialogueIndex === state.lesson.dialogues.length - 1) {
    state.dialogueIndex = 0;
    state.dialogueScore = 0;
  } else {
    state.dialogueIndex += 1;
  }

  renderDialogue();
  renderStatus();
}

function renderRecall() {
  if (!lessonHasRecalls()) {
    return;
  }

  const item = state.lesson.recalls[state.recallIndex];

  recallPrompt.textContent = item.prompt;
  recallTransliteration.textContent = item.transliteration;
  recallScript.textContent = item.script;
  recallNote.textContent = item.note;
  recallAnswer.hidden = true;
  ratingRow.hidden = true;
  revealRecallButton.textContent = "Reveal answer";
}

function advanceRecall(rating) {
  if (!lessonHasRecalls()) {
    return;
  }

  const current = state.lesson.recalls[state.recallIndex];
  state.recallRatings.push({ id: current.phraseId, rating });
  saveState("recallRatings", state.recallRatings);
  state.recallIndex = (state.recallIndex + 1) % state.lesson.recalls.length;
  renderRecall();
  renderStatus();
}

function stopPlayback() {
  playback.audio.pause();
  playback.audio.currentTime = 0;
  playback.audio.onended = null;
  playback.audio.onerror = null;
  playback.audio.onloadedmetadata = null;
  if (playback.objectUrl) {
    URL.revokeObjectURL(playback.objectUrl);
    playback.objectUrl = null;
  }
}

function applyPlaybackRate(audio, playbackRate = 1) {
  audio.defaultPlaybackRate = playbackRate;
  audio.playbackRate = playbackRate;
}

function playMediaAudio(src, playbackRate = 1, options = {}) {
  return new Promise((resolve, reject) => {
    if (!options.skipStopPlayback) {
      stopPlayback();
    }
    playback.audio.src = resolveAppPath(src);
    applyPlaybackRate(playback.audio, playbackRate);

    playback.audio.onloadedmetadata = () => {
      applyPlaybackRate(playback.audio, playbackRate);
    };
    playback.audio.onended = () => resolve();
    playback.audio.onerror = () => reject(new Error(`Audio file could not be loaded: ${src}`));
    playback.audio.load();
    playback.audio.play().catch(reject);
  });
}

function playBlobAudio(blob, playbackRate = 1) {
  stopPlayback();
  playback.objectUrl = URL.createObjectURL(blob);
  return playMediaAudio(playback.objectUrl, playbackRate, { skipStopPlayback: true });
}

function getTamilVoice() {
  if (!("speechSynthesis" in window)) {
    return null;
  }

  return window.speechSynthesis
    .getVoices()
    .find((voice) => voice.lang && voice.lang.toLowerCase().startsWith("ta"));
}

function speakPhraseFallback(phrase, rate = 0.92) {
  if (!("speechSynthesis" in window)) {
    return false;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(phrase.script || phrase.transliteration);
  utterance.lang = "ta-IN";
  utterance.rate = rate;
  utterance.pitch = 1;

  const tamilVoice = getTamilVoice();
  if (tamilVoice) {
    utterance.voice = tamilVoice;
  }

  window.speechSynthesis.speak(utterance);
  return true;
}

async function playPhrase(phrase, speed = "normal") {
  const speedPreset = SPEED_PRESETS[speed] || SPEED_PRESETS.normal;
  const audioConfig = state.lesson.audio || {};

  if (audioConfig.mode === "elevenlabs-local") {
    if (!state.audioStatus?.configured) {
      renderAudioNote("Local ElevenLabs audio is not configured yet. Add your API key and voice ID in .env.local.");
      return;
    }

    const endpoint = new URL(audioConfig.ttsEndpoint || "/api/elevenlabs/tts", window.location.origin);
    endpoint.searchParams.set("lesson_id", state.lesson.id);
    endpoint.searchParams.set("phrase_id", phrase.id);

    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        const errorText = await response.text();
        renderAudioNote(`ElevenLabs generation failed for "${phrase.transliteration}". ${errorText.slice(0, 180)}`);
        return;
      }
      const blob = await response.blob();
      await playBlobAudio(blob, speedPreset.mediaRate);
      renderAudioNote(`Playing ${speedPreset.label} local ElevenLabs audio for "${phrase.transliteration}".`);
      return;
    } catch (error) {
      renderAudioNote(`Could not reach the local ElevenLabs endpoint. Make sure serve.py is running. ${error.message}`);
      return;
    }
  }

  if (phrase.audioSrc) {
    try {
      await playMediaAudio(phrase.audioSrc, speedPreset.mediaRate);
      renderAudioNote(`Playing ${speedPreset.label} hosted lesson audio for "${phrase.transliteration}".`);
      return;
    } catch (error) {
      const allowTtsFallback = Boolean(state.lesson.audio?.ttsFallback);
      if (!allowTtsFallback) {
        renderAudioNote(`Hosted audio is expected at ${resolveAppPath(phrase.audioSrc)}, but the file is not there yet. Add that MP3 before publishing this lesson.`);
        return;
      }
    }
  }

  const usedFallback = speakPhraseFallback(phrase, speedPreset.speechRate);

  if (usedFallback) {
    renderAudioNote("Using browser text-to-speech as a temporary fallback. Replace it with hosted MP3s before sharing the website.");
    return;
  }

  renderAudioNote("No hosted audio clip is available for this phrase yet, and browser text-to-speech is unavailable.");
}

scriptToggle.addEventListener("change", (event) => {
  state.showScript = event.target.checked;
  document.body.classList.toggle("show-script", state.showScript);
});

startLessonButton.addEventListener("click", () => {
  document.getElementById("lessonAnchor").scrollIntoView({ behavior: "smooth" });
});

window.addEventListener("resize", () => {
  if (!state.lesson || !phraseGrid.contains(phraseDetail)) {
    return;
  }

  if (phraseLayoutResizeFrame) {
    window.cancelAnimationFrame(phraseLayoutResizeFrame);
  }

  phraseLayoutResizeFrame = window.requestAnimationFrame(() => {
    placePhraseDetail();
    phraseLayoutResizeFrame = null;
  });
});

nextDialogueButton.addEventListener("click", advanceDialogue);

revealRecallButton.addEventListener("click", async () => {
  if (!lessonHasRecalls()) {
    return;
  }

  recallAnswer.hidden = false;
  ratingRow.hidden = false;
  revealRecallButton.textContent = "Answer shown";
  const current = state.lesson.recalls[state.recallIndex];
  const phrase = getPhraseById(current.phraseId);
  if (phrase) {
    await playPhrase(phrase, "normal");
  }
});

playRecallButton.addEventListener("click", async () => {
  if (!lessonHasRecalls()) {
    return;
  }

  const current = state.lesson.recalls[state.recallIndex];
  const phrase = getPhraseById(current.phraseId);
  if (phrase) {
    await playPhrase(phrase, "normal");
  }
});

ratingRow.querySelectorAll("button").forEach((button) => {
  button.addEventListener("click", () => advanceRecall(button.dataset.rating));
});

async function init() {
  renderLoadingState();

  try {
    state.lesson = await loadLesson();
    const audioConfig = state.lesson.audio || {};
    if (audioConfig.statusEndpoint) {
      try {
        const response = await fetch(resolveAppPath(audioConfig.statusEndpoint));
        if (response.ok) {
          state.audioStatus = await response.json();
        } else {
          state.audioStatus = { configured: false, missing: ["serve.py endpoint unavailable"] };
        }
      } catch (error) {
        state.audioStatus = { configured: false, missing: ["serve.py endpoint unreachable"] };
      }
    }
    initializeLessonState();
    renderLessonTabs();
    renderLessonChrome();
    renderStatus();
    renderAudioNote();
    renderPhraseGrid();
    renderPhraseDetail();
    if (lessonHasDialogues()) {
      renderDialogue();
    }
    if (lessonHasRecalls()) {
      renderRecall();
    }
  } catch (error) {
    renderErrorState("The website could not load its lesson data. Serve it through a web host or local server so ./data/lessons/lesson-01.json can be fetched.");
  }
}

window.addEventListener("load", init);
