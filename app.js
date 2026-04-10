const DEFAULT_LESSON = "lesson-openslr";
const LESSONS = {
  "lesson-01": "./data/lessons/lesson-01.json",
  "lesson-openslr": "./data/lessons/lesson-openslr.json",
};

const state = {
  lesson: null,
  activePhraseId: null,
  dialogueIndex: 0,
  dialogueLocked: false,
  dialogueScore: 0,
  recallIndex: 0,
  showScript: false,
  studied: [],
  recallRatings: [],
};

const playback = {
  audio: new Audio(),
};

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
const phraseGrid = document.getElementById("phraseGrid");
const phraseDetail = document.getElementById("phraseDetail");
const statusCard = document.getElementById("statusCard");
const audioNote = document.getElementById("audioNote");
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
const revealRecallButton = document.getElementById("revealRecallButton");
const playRecallButton = document.getElementById("playRecallButton");
const ratingRow = document.getElementById("ratingRow");

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
  const lessonPath = LESSONS[lessonKey] || LESSONS[DEFAULT_LESSON];
  const response = await fetch(lessonPath);

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
  statusCard.innerHTML = `
    <strong>${studiedCount}/${state.lesson.phrases.length}</strong>
    <p>phrases explored</p>
    <p>${state.dialogueScore}/${state.lesson.dialogues.length} dialogue choices correct this round</p>
    <p>${recallCount} recall cards rated on this device</p>
  `;
}

function renderAudioNote(customMessage) {
  if (customMessage) {
    audioNote.textContent = customMessage;
    return;
  }

  const audioConfig = state.lesson.audio || {};
  audioNote.textContent = audioConfig.note || "Add hosted audio clips for a consistent website experience.";
}

function renderPhraseGrid() {
  phraseGrid.innerHTML = "";

  state.lesson.phrases.forEach((phrase, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `phrase-card ${phrase.id === state.activePhraseId ? "is-active" : ""}`;
    button.innerHTML = `
      <span class="phrase-index">Phrase ${String(index + 1).padStart(2, "0")}</span>
      <span class="phrase-transliteration">${phrase.transliteration}</span>
      <span class="phrase-meaning">${phrase.meaning}</span>
      <span class="tag">${phrase.tone}</span>
    `;

    button.addEventListener("click", () => {
      state.activePhraseId = phrase.id;
      markStudied(phrase.id);
      renderPhraseGrid();
      renderPhraseDetail();
    });

    phraseGrid.appendChild(button);
  });
}

function renderPhraseDetail() {
  const phrase = getActivePhrase();
  const hasAudio = Boolean(phrase.audioSrc);

  phraseDetail.innerHTML = `
    <div class="detail-header">
      <p class="section-kicker">Focus phrase</p>
      <h3>${phrase.transliteration}</h3>
      <p class="detail-script builder-only">${phrase.script}</p>
      <p>${phrase.meaning}</p>
    </div>
    <div class="button-row">
      <button class="sound-button" type="button" data-action="slow" ${hasAudio ? "" : "disabled"}>Play slow</button>
      <button class="sound-button" type="button" data-action="normal" ${hasAudio ? "" : "disabled"}>Play normal</button>
      <button class="ghost-button" type="button" data-action="studied">Mark practiced</button>
    </div>
    <div class="meta-grid">
      <div class="meta-chip">
        <strong>Tone</strong>
        <span>${phrase.tone}</span>
      </div>
      <div class="meta-chip">
        <strong>When to use it</strong>
        <span>${phrase.useCase}</span>
      </div>
      <div class="meta-chip">
        <strong>Audio</strong>
        <span>${hasAudio ? "Hosted MP3 expected" : "No clip linked yet"}</span>
      </div>
    </div>
    <p class="detail-note">${phrase.note}</p>
  `;

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
}

function playHostedAudio(src, playbackRate = 1) {
  return new Promise((resolve, reject) => {
    stopPlayback();
    playback.audio.src = src;
    playback.audio.playbackRate = playbackRate;
    playback.audio.onended = () => resolve();
    playback.audio.onerror = () => reject(new Error(`Audio file could not be loaded: ${src}`));
    playback.audio.play().catch(reject);
  });
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
  const playbackRate = speed === "slow" ? 0.82 : 1;

  if (phrase.audioSrc) {
    try {
      await playHostedAudio(phrase.audioSrc, playbackRate);
      renderAudioNote(`Playing hosted lesson audio for "${phrase.transliteration}".`);
      return;
    } catch (error) {
      const allowTtsFallback = Boolean(state.lesson.audio?.ttsFallback);
      if (!allowTtsFallback) {
        renderAudioNote(`Hosted audio is expected at ${phrase.audioSrc}, but the file is not there yet. Add that MP3 before publishing this lesson.`);
        return;
      }
    }
  }

  const usedFallback = speakPhraseFallback(phrase, speed === "slow" ? 0.76 : 0.92);

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

nextDialogueButton.addEventListener("click", advanceDialogue);

revealRecallButton.addEventListener("click", async () => {
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
    initializeLessonState();
    renderLessonChrome();
    renderStatus();
    renderAudioNote();
    renderPhraseGrid();
    renderPhraseDetail();
    renderDialogue();
    renderRecall();
  } catch (error) {
    renderErrorState("The website could not load its lesson data. Serve it through a web host or local server so ./data/lessons/lesson-01.json can be fetched.");
  }
}

window.addEventListener("load", init);
