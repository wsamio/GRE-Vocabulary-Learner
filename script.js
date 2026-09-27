(() => {
  "use strict";

  const STORAGE = {
    state: "vocabularyLearner.state.v1",
    ui: "vocabularyLearner.ui.v1"
  };

  const state = {
    days: [],
    currentDayIndex: 0,
    currentWordIndex: 0,
    datasetKey: "",
    cardStates: {},
    isFlipped: false,
    touchStartX: null,
    touchStartY: null
  };

  const el = {
    learningView: document.getElementById("learning-view"),
    datasetMeta: document.getElementById("dataset-meta"),
    daySelect: document.getElementById("day-select"),
    prevDay: document.getElementById("prev-day"),
    nextDay: document.getElementById("next-day"),
    cardStage: document.getElementById("card-stage"),
    card: document.getElementById("card"),
    wordFront: document.getElementById("word-front"),
    statusBadge: document.getElementById("status-badge"),
    noteInput: document.getElementById("note-input"),
    noteStatus: document.getElementById("note-status"),
    wordPosition: document.getElementById("word-position"),
    dayProgress: document.getElementById("day-progress"),
    prevWord: document.getElementById("prev-word"),
    nextWord: document.getElementById("next-word"),
    wordDots: document.getElementById("word-dots"),
    toast: document.getElementById("toast"),
    helpButton: document.getElementById("help-button"),
    helpDialog: document.getElementById("help-dialog"),
    closeHelp: document.getElementById("close-help")
  };

  function safeGet(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  function showToast(message) {
    if (!el.toast) return;

    el.toast.textContent = message;
    el.toast.classList.add("is-visible");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
      el.toast.classList.remove("is-visible");
    }, 1800);
  }

  // CSV parser supporting:
  // - commas inside quoted cells
  // - escaped quotes
  // - CRLF and LF line endings
  function parseCSV(text) {
    const rows = [];
    let row = [];
    let cell = "";
    let quoted = false;

    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];

      if (quoted) {
        if (char === '"') {
          if (text[i + 1] === '"') {
            cell += '"';
            i += 1;
          } else {
            quoted = false;
          }
        } else {
          cell += char;
        }

        continue;
      }

      if (char === '"') {
        quoted = true;
      } else if (char === ",") {
        row.push(cell);
        cell = "";
      } else if (char === "\n") {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
      } else if (char === "\r") {
        if (text[i + 1] !== "\n") {
          row.push(cell);
          rows.push(row);
          row = [];
          cell = "";
        }
      } else {
        cell += char;
      }
    }

    if (cell !== "" || row.length > 0) {
      row.push(cell);
      rows.push(row);
    }

    return rows;
  }

  function cleanCell(value) {
    return String(value ?? "")
      .replace(/^\uFEFF/, "")
      .trim();
  }

  function normalizeCSV(rows) {
    if (!rows.length) {
      return [];
    }

    const headers = rows[0].map(cleanCell);

    const validColumns = headers
      .map((header, index) => ({
        header,
        index
      }))
      .filter(item => item.header !== "");

    return validColumns
      .map(({ header, index }) => {
        const words = rows
          .slice(1)
          .map(row => cleanCell(row[index]))
          .filter(Boolean);

        return {
          id: header,
          words
        };
      })
      .filter(day => day.words.length > 0);
  }

  function simpleHash(text) {
    let hash = 2166136261;

    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    return (hash >>> 0).toString(16);
  }

  function datasetKeyFor(days) {
    return simpleHash(JSON.stringify(days));
  }

  function cardKey(dayIndex, wordIndex) {
    const day = state.days[dayIndex];

    return `${state.datasetKey}:${day.id}:${wordIndex}`;
  }

  function currentWord() {
    return (
      state.days[state.currentDayIndex]?.words[
      state.currentWordIndex
      ] ?? ""
    );
  }

  function currentCardState() {
    return (
      state.cardStates[
      cardKey(
        state.currentDayIndex,
        state.currentWordIndex
      )
      ] || {
        status: "",
        note: ""
      }
    );
  }

  function saveState() {
    safeSet(
      STORAGE.state,
      state.cardStates
    );

    safeSet(STORAGE.ui, {
      datasetKey: state.datasetKey,
      dayIndex: state.currentDayIndex,
      wordIndex: state.currentWordIndex
    });
  }

  function loadDataset(
    days,
    preferredDay = 0,
    preferredWord = 0
  ) {
    state.days = days;
    state.datasetKey =
      datasetKeyFor(days);

    const storedStates =
      safeGet(STORAGE.state, {});

    state.cardStates =
      storedStates &&
        typeof storedStates === "object"
        ? storedStates
        : {};

    if (!days.length) {
      return;
    }

    state.currentDayIndex =
      Math.max(
        0,
        Math.min(
          preferredDay,
          days.length - 1
        )
      );

    const wordCount =
      days[state.currentDayIndex].words.length;

    state.currentWordIndex =
      Math.max(
        0,
        Math.min(
          preferredWord,
          wordCount - 1
        )
      );

    state.isFlipped = false;

    renderDaySelect();
    render();
    saveState();
  }

  function renderDaySelect() {
    if (!el.daySelect) return;

    const fragment =
      document.createDocumentFragment();

    state.days.forEach((day, index) => {
      const option =
        document.createElement("option");

      option.value = String(index);
      option.textContent =
        `Day ${day.id}`;

      fragment.appendChild(option);
    });

    el.daySelect.replaceChildren(fragment);

    el.daySelect.value =
      String(state.currentDayIndex);
  }

  function renderStatus() {
    const cardState =
      currentCardState();

    el.card.classList.toggle(
      "status-red",
      cardState.status === "red"
    );

    el.card.classList.toggle(
      "status-green",
      cardState.status === "green"
    );

    if (cardState.status === "red") {
      el.statusBadge.textContent =
        "review";
    } else if (
      cardState.status === "green"
    ) {
      el.statusBadge.textContent =
        "learned";
    } else {
      el.statusBadge.textContent = "";
    }

    el.noteInput.value =
      cardState.note || "";
  }

  function renderDots() {
    const words =
      state.days[
        state.currentDayIndex
      ]?.words || [];

    const fragment =
      document.createDocumentFragment();

    words.forEach((_, index) => {
      const dot =
        document.createElement("button");

      dot.type = "button";
      dot.className = "word-dot";

      dot.setAttribute(
        "aria-label",
        `Go to word ${index + 1}`
      );

      dot.addEventListener(
        "click",
        event => {
          event.stopPropagation();

          state.currentWordIndex =
            index;

          state.isFlipped = false;

          render();
          saveState();
        }
      );

      const status =
        state.cardStates[
          cardKey(
            state.currentDayIndex,
            index
          )
        ]?.status;

      if (status === "red") {
        dot.classList.add(
          "status-red"
        );
      }

      if (status === "green") {
        dot.classList.add(
          "status-green"
        );
      }

      if (
        index ===
        state.currentWordIndex
      ) {
        dot.classList.add(
          "is-current"
        );
      }

      fragment.appendChild(dot);
    });

    el.wordDots.replaceChildren(
      fragment
    );
  }

  function render() {
    const day =
      state.days[
      state.currentDayIndex
      ];

    if (!day) return;

    const words = day.words;

    el.learningView.hidden = false;

    el.datasetMeta.textContent =
      `${state.days.length} days · ${words.length} words today`;

    el.daySelect.value =
      String(state.currentDayIndex);

    el.wordFront.textContent =
      currentWord();

    el.wordPosition.textContent =
      `${state.currentWordIndex + 1} / ${words.length}`;

    const learned =
      words.reduce(
        (count, _, index) => {
          const status =
            state.cardStates[
              cardKey(
                state.currentDayIndex,
                index
              )
            ]?.status;

          return (
            count +
            (status === "green"
              ? 1
              : 0)
          );
        },
        0
      );

    el.dayProgress.textContent =
      `${learned} learned`;

    el.prevDay.disabled =
      state.currentDayIndex === 0;

    el.nextDay.disabled =
      state.currentDayIndex ===
      state.days.length - 1;

    el.prevWord.disabled =
      state.currentWordIndex === 0;

    el.nextWord.disabled =
      state.currentWordIndex ===
      words.length - 1;

    el.card.classList.toggle(
      "is-flipped",
      state.isFlipped
    );

    renderStatus();
    renderDots();
  }

  function setWord(index) {
    const wordCount =
      state.days[
        state.currentDayIndex
      ]?.words.length || 0;

    if (!wordCount) return;

    state.currentWordIndex =
      Math.max(
        0,
        Math.min(
          index,
          wordCount - 1
        )
      );

    state.isFlipped = false;

    render();
    saveState();
  }

  function setDay(index) {
    if (!state.days.length) return;

    state.currentDayIndex =
      Math.max(
        0,
        Math.min(
          index,
          state.days.length - 1
        )
      );

    state.currentWordIndex = 0;
    state.isFlipped = false;

    render();
    saveState();
  }

  function moveDay(delta) {
    setDay(
      state.currentDayIndex + delta
    );
  }

  function moveWord(delta) {
    const nextIndex =
      state.currentWordIndex + delta;

    const words =
      state.days[
        state.currentDayIndex
      ]?.words || [];

    if (
      nextIndex < 0 ||
      nextIndex >= words.length
    ) {
      return;
    }

    setWord(nextIndex);
  }

  function toggleFlip() {
    state.isFlipped =
      !state.isFlipped;

    el.card.classList.toggle(
      "is-flipped",
      state.isFlipped
    );
  }

  function setStatus(status) {
    const key =
      cardKey(
        state.currentDayIndex,
        state.currentWordIndex
      );

    const previous =
      state.cardStates[key] || {
        status: "",
        note: ""
      };

    state.cardStates[key] = {
      ...previous,
      status
    };

    render();
    saveState();

    if (status === "red") {
      showToast(
        "Marked for review"
      );
    } else if (status === "green") {
      showToast(
        "Marked as learned"
      );
    } else {
      showToast(
        "Color reset"
      );
    }
  }

  function openNote() {
    state.isFlipped = true;

    el.card.classList.add(
      "is-flipped"
    );

    requestAnimationFrame(() => {
      el.noteInput.focus({
        preventScroll: true
      });

      el.noteInput.setSelectionRange(
        el.noteInput.value.length,
        el.noteInput.value.length
      );
    });
  }

  function saveNote(value) {
    const key =
      cardKey(
        state.currentDayIndex,
        state.currentWordIndex
      );

    const previous =
      state.cardStates[key] || {
        status: "",
        note: ""
      };

    state.cardStates[key] = {
      ...previous,
      note: value
    };

    if (el.noteStatus) {
      el.noteStatus.textContent =
        "Saved locally";
    }

    saveState();
  }

  function handleKeydown(event) {
    const tag =
      document.activeElement?.tagName?.toLowerCase();

    const typing =
      tag === "textarea" ||
      tag === "input" ||
      tag === "select";

    const key =
      event.key.toLowerCase();

    if (typing) {
      if (
        event.key === "Escape"
      ) {
        document.activeElement.blur();

        state.isFlipped = false;

        render();
      }

      return;
    }

    if (
      event.key === "ArrowLeft"
    ) {
      event.preventDefault();
      moveWord(-1);

    } else if (
      event.key === "ArrowRight"
    ) {
      event.preventDefault();
      moveWord(1);

    } else if (key === "r") {
      event.preventDefault();
      setStatus("red");

    } else if (key === "g") {
      event.preventDefault();
      setStatus("green");

    } else if (key === "w") {
      event.preventDefault();
      setStatus("");

    } else if (key === "n") {
      event.preventDefault();
      openNote();

    } else if (
      event.code === "Space"
    ) {
      event.preventDefault();
      toggleFlip();

    } else if (
      event.key === "Escape"
    ) {
      state.isFlipped = false;
      render();
    }
  }

  function handleTouchStart(event) {
    const touch =
      event.changedTouches[0];

    state.touchStartX =
      touch.clientX;

    state.touchStartY =
      touch.clientY;
  }

  function handleTouchEnd(event) {
    if (
      state.touchStartX === null ||
      state.touchStartY === null
    ) {
      return;
    }

    const touch =
      event.changedTouches[0];

    const dx =
      touch.clientX -
      state.touchStartX;

    const dy =
      touch.clientY -
      state.touchStartY;

    state.touchStartX = null;
    state.touchStartY = null;

    if (
      Math.abs(dx) < 55 ||
      Math.abs(dx) <
      Math.abs(dy) * 1.25
    ) {
      return;
    }

    if (dx < 0) {
      moveWord(1);
    } else {
      moveWord(-1);
    }
  }

  async function loadVocabulary() {
    try {
      const response =
        await fetch(
          "vocabulary.csv",
          {
            cache: "no-store"
          }
        );

      if (!response.ok) {
        return;
      }

      const text =
        await response.text();

      const rows =
        parseCSV(text);

      const days =
        normalizeCSV(rows);

      if (!days.length) {
        return;
      }

      const ui =
        safeGet(STORAGE.ui, {});

      const newDatasetKey =
        datasetKeyFor(days);

      const sameDataset =
        ui.datasetKey ===
        newDatasetKey;

      loadDataset(
        days,
        sameDataset
          ? Number(ui.dayIndex) || 0
          : 0,
        sameDataset
          ? Number(ui.wordIndex) || 0
          : 0
      );
    } catch {
      // Intentionally do nothing.
      // There is no error screen.
      // If vocabulary.csv is unavailable,
      // no vocabulary is displayed.
    }
  }

  function boot() {
    if (!el.card) return;

    el.daySelect.addEventListener(
      "change",
      () =>
        setDay(
          Number(
            el.daySelect.value
          )
        )
    );

    el.prevDay.addEventListener(
      "click",
      () => moveDay(-1)
    );

    el.nextDay.addEventListener(
      "click",
      () => moveDay(1)
    );

    el.prevWord.addEventListener(
      "click",
      () => moveWord(-1)
    );

    el.nextWord.addEventListener(
      "click",
      () => moveWord(1)
    );

    el.card.addEventListener(
      "click",
      event => {
        if (
          event.target ===
          el.noteInput
        ) {
          return;
        }

        toggleFlip();
      }
    );

    el.card.addEventListener(
      "keydown",
      event => {
        if (
          event.key === "Enter"
        ) {
          event.preventDefault();
          toggleFlip();

        } else if (
          event.code === "Space"
        ) {
          event.preventDefault();
          event.stopPropagation();
          toggleFlip();
        }
      }
    );

    el.noteInput.addEventListener(
      "click",
      event =>
        event.stopPropagation()
    );

    el.noteInput.addEventListener(
      "keydown",
      event =>
        event.stopPropagation()
    );

    el.noteInput.addEventListener(
      "keyup",
      event =>
        event.stopPropagation()
    );

    el.noteInput.addEventListener(
      "input",
      event =>
        saveNote(
          event.target.value
        )
    );

    el.cardStage.addEventListener(
      "touchstart",
      handleTouchStart,
      { passive: true }
    );

    el.cardStage.addEventListener(
      "touchend",
      handleTouchEnd,
      { passive: true }
    );

    document.addEventListener(
      "keydown",
      handleKeydown
    );

    el.helpButton.addEventListener(
      "click",
      () => {
        if (
          typeof el.helpDialog.showModal ===
          "function"
        ) {
          el.helpDialog.showModal();
        } else {
          el.helpDialog.setAttribute(
            "open",
            ""
          );
        }
      }
    );

    el.closeHelp.addEventListener(
      "click",
      () =>
        el.helpDialog.close()
    );

    el.helpDialog.addEventListener(
      "click",
      event => {
        if (
          event.target ===
          el.helpDialog
        ) {
          el.helpDialog.close();
        }
      }
    );

    window.addEventListener(
      "beforeunload",
      saveState
    );

    // Load the fixed CSV automatically.
    loadVocabulary();
  }

  boot();
})();