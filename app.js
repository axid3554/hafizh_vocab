/* ============================================================
   HAFIZH VOCAB — Main Application Logic
   Flashcard engine, quiz engine, CSV parser
   ============================================================ */

(function () {
  'use strict';

  // ==================== STATE ====================
  const state = {
    allData: [],
    filteredData: [],
    currentIndex: 0,
    isFlipped: false,
    currentFilter: 'Semua',
    searchQuery: '',
    // Quiz
    quizQuestions: [],
    quizCurrentIndex: 0,
    quizScore: 0,
    quizAnswered: false,
    quizMode: false,
    // Touch
    touchStartX: 0,
    touchEndX: 0,
    quizTotal: 25,
  };

  // ==================== DOM ELEMENTS ====================
  const $ = (id) => document.getElementById(id);

  const dom = {
    loadingState: $('loadingState'),
    errorState: $('errorState'),
    errorMessage: $('errorMessage'),
    mainContent: $('mainContent'),
    // Nav
    navFlashcard: $('navFlashcard'),
    navQuiz: $('navQuiz'),
    // Flashcard
    flashcardSection: $('flashcardSection'),
    flashcard: $('flashcard'),
    cardContainer: $('cardContainer'),
    cardLoader: $('cardLoader'),
    cardArab: $('cardArab'),
    cardBadgeBack: $('cardBadgeBack'),
    cardTransliterasi: $('cardTransliterasi'),
    cardArti: $('cardArti'),
    cardFreq: $('cardFreq'),
    cardAyatArab: $('cardAyatArab'),
    cardAyatArti: $('cardAyatArti'),
    cardAyatRef: $('cardAyatRef'),
    cardAyatRow: $('cardAyatRow'),
    // Stats
    statsCount: $('statsCount'),
    statsCurrent: $('statsCurrent'),
    // Search
    searchInput: $('searchInput'),
    searchClear: $('searchClear'),
    // Nav buttons
    prevBtn: $('prevBtn'),
    nextBtn: $('nextBtn'),
    // Quiz
    quizSection: $('quizSection'),
    quizStart: $('quizStart'),
    quizQuestionCountOptions: document.querySelectorAll('.quiz-settings__btn'),
    quizStartCountText: $('quizStartCountText'),
    quizPlay: $('quizPlay'),
    quizResult: $('quizResult'),
    startQuizBtn: $('startQuizBtn'),
    quizProgressFill: $('quizProgressFill'),
    quizProgressText: $('quizProgressText'),
    quizScoreLive: $('quizScoreLive'),
    quizArab: $('quizArab'),
    quizOptions: $('quizOptions'),
    quizFeedback: $('quizFeedback'),
    quizFeedbackIcon: $('quizFeedbackIcon'),
    quizFeedbackText: $('quizFeedbackText'),
    // Result
    resultEmoji: $('resultEmoji'),
    resultScore: $('resultScore'),
    resultPercentage: $('resultPercentage'),
    resultMessage: $('resultMessage'),
    retryQuizBtn: $('retryQuizBtn'),
    backToFlashcardBtn: $('backToFlashcardBtn'),
  };

  // ==================== CSV PARSER ====================
  /**
   * Parse CSV text into array of objects.
   * Skips first 2 rows (template description), uses row 3 as header.
   */
  function parseCSV(text) {
    const lines = text.split('\n').filter((l) => l.trim() !== '');
    if (lines.length < 4) return [];

    // Row 3 (index 2) = header names
    const headers = parseCSVLine(lines[2]);

    // Map header names to clean keys
    const keyMap = {
      'ID *': 'id',
      'Kata Arab *': 'kata_arab',
      'Transliterasi *': 'transliterasi',
      'Arti (ID) *': 'arti',
      'Arti (EN)': 'arti_en',
      'Jenis Kata *': 'jenis_kata',
      'Frekuensi': 'frekuensi',
      'Contoh Ayat (Arab)': 'contoh_ayat_ar',
      'Contoh Ayat (ID)': 'contoh_ayat_id',
      'Nama Surat': 'nama_surat',
      'No. Ayat': 'nomor_ayat',
      'Status *': 'status_verifikasi',
    };

    const keys = headers.map((h) => keyMap[h.trim()] || h.trim().toLowerCase().replace(/\s+/g, '_'));

    const data = [];
    for (let i = 3; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (!values[0] || !values[1]) continue; // skip empty rows

      const obj = {};
      keys.forEach((key, idx) => {
        obj[key] = (values[idx] || '').trim();
      });
      data.push(obj);
    }
    return data;
  }

  /**
   * Parse a single CSV line, handling quoted fields with commas.
   */
  function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          result.push(current);
          current = '';
        } else {
          current += ch;
        }
      }
    }
    result.push(current);
    return result;
  }

  // ==================== DATA LOADING ====================
  async function loadData() {
    try {
      const response = await fetch('kosakata.csv');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      state.allData = parseCSV(text);

      if (state.allData.length === 0) {
        throw new Error('Data kosakata kosong atau format CSV tidak sesuai.');
      }

      state.filteredData = [...state.allData];
      state.currentIndex = 0;

      dom.loadingState.classList.add('hidden');
      dom.mainContent.classList.remove('hidden');

      renderCard();
      updateStats();
    } catch (err) {
      dom.loadingState.classList.add('hidden');
      dom.errorState.classList.remove('hidden');
      dom.errorMessage.textContent = err.message || 'Pastikan file kosakata.csv tersedia.';
      console.error('Gagal memuat data:', err);
    }
  }

  // ==================== FLASHCARD ====================
  let rotateOutTimeout;
  let rotateInTimeout;
  let cleanupTimeout;

  function updateCardWithLoader(actionFn, direction = 'next') {
    if (actionFn) actionFn();

    clearTimeout(rotateOutTimeout);
    clearTimeout(rotateInTimeout);
    clearTimeout(cleanupTimeout);

    dom.cardLoader.classList.add('card-loader--active');

    if (direction === 'none') {
      dom.cardLoader.classList.add('card-loader--solid');

      rotateOutTimeout = setTimeout(() => {
        dom.flashcard.style.transition = 'none';
        renderCard();
        void dom.flashcard.offsetWidth;
        dom.flashcard.style.transition = '';

        rotateInTimeout = setTimeout(() => {
          dom.cardLoader.classList.remove('card-loader--active');
          cleanupTimeout = setTimeout(() => {
            dom.cardLoader.classList.remove('card-loader--solid');
          }, 200); // Wait for fade out
        }, 150);
      }, 200);
      return;
    }

    // For rotate animations, ensure solid class is removed
    dom.cardLoader.classList.remove('card-loader--solid');

    // Determine angles based on direction and flipped state
    const currentAngle = state.isFlipped ? 180 : 0;
    let outAngle, inAngle;

    if (direction === 'next') {
      outAngle = currentAngle - 90;
      inAngle = 90;
    } else {
      outAngle = currentAngle + 90;
      inAngle = -90;
    }

    // Start rotate out
    dom.flashcard.style.transition = 'transform 0.2s ease-in';
    dom.flashcard.style.transform = `rotateY(${outAngle}deg) scale(0.9)`;

    rotateOutTimeout = setTimeout(() => {
      // Card is edge-on, invisible. Update text and snap to inAngle.
      dom.flashcard.style.transition = 'none';
      dom.flashcard.style.transform = `rotateY(${inAngle}deg) scale(0.9)`;

      renderCard();
      void dom.flashcard.offsetWidth; // Force reflow

      // Pause to show spinner loader
      rotateInTimeout = setTimeout(() => {
        // Rotate in to 0deg (front face)
        dom.flashcard.style.transition = 'transform 0.2s ease-out';
        dom.flashcard.style.transform = 'rotateY(0deg) scale(1)';

        dom.cardLoader.classList.remove('card-loader--active');

        // Clean up inline styles after animation finishes
        cleanupTimeout = setTimeout(() => {
          dom.flashcard.style.transition = '';
          dom.flashcard.style.transform = '';
        }, 200);
      }, 150);
    }, 200);
  }

  function renderCard() {
    if (state.filteredData.length === 0) {
      dom.cardArab.textContent = '—';
      dom.cardBadgeBack.textContent = '';
      dom.cardBadgeBack.className = 'card__badge';
      dom.cardTransliterasi.textContent = 'Tidak ada data';
      dom.cardArti.textContent = 'Coba ubah filter atau kata kunci pencarian';
      dom.cardFreq.textContent = '-';
      dom.cardAyatArab.textContent = '';
      dom.cardAyatArti.textContent = '';
      dom.cardAyatRef.textContent = '';
      updateStats();
      return;
    }

    const item = state.filteredData[state.currentIndex];

    // Front side
    dom.cardArab.textContent = item.kata_arab || '—';

    // Back side
    dom.cardBadgeBack.textContent = item.jenis_kata || '';
    dom.cardBadgeBack.className = 'card__badge';
    
    // Apply dynamic color class based on jenis_kata
    if (item.jenis_kata) {
      const type = item.jenis_kata.toLowerCase();
      if (type === 'isim') {
        dom.cardBadgeBack.classList.add('card__badge--isim');
      } else if (type === "fi'il") {
        dom.cardBadgeBack.classList.add('card__badge--fiil');
      } else if (type === 'huruf') {
        dom.cardBadgeBack.classList.add('card__badge--huruf');
      }
    }
    dom.cardTransliterasi.textContent = item.transliterasi || '';
    dom.cardArti.textContent = item.arti || '—';
    dom.cardFreq.textContent = item.frekuensi ? `${item.frekuensi}×` : '-';

    // Contoh ayat
    if (item.contoh_ayat_ar) {
      dom.cardAyatRow.style.display = '';
      dom.cardAyatArab.textContent = item.contoh_ayat_ar;
      dom.cardAyatArti.textContent = item.contoh_ayat_id || '';
      dom.cardAyatRef.textContent =
        item.nama_surat && item.nomor_ayat
          ? `(${item.nama_surat} : ${item.nomor_ayat})`
          : '';
    } else {
      dom.cardAyatRow.style.display = 'none';
    }

    // Reset flip
    if (state.isFlipped) {
      state.isFlipped = false;
      dom.flashcard.classList.remove('card--flipped');
    }

    updateStats();
  }

  function flipCard() {
    if (dom.cardLoader.classList.contains('card-loader--active')) return;
    state.isFlipped = !state.isFlipped;
    dom.flashcard.classList.toggle('card--flipped');
  }

  function nextCard() {
    if (state.filteredData.length === 0) return;
    updateCardWithLoader(() => {
      state.currentIndex = (state.currentIndex + 1) % state.filteredData.length;
    }, 'next');
  }

  function prevCard() {
    if (state.filteredData.length === 0) return;
    updateCardWithLoader(() => {
      state.currentIndex =
        (state.currentIndex - 1 + state.filteredData.length) % state.filteredData.length;
    }, 'prev');
  }

  function updateStats() {
    const total = state.filteredData.length;
    dom.statsCount.textContent = `${total} kosakata`;
    dom.statsCurrent.textContent =
      total > 0 ? `Kartu ${state.currentIndex + 1} dari ${total}` : 'Tidak ada kartu';
  }

  // ==================== FILTER ====================
  function applyFilter(type) {
    state.currentFilter = type;

    // Update button styles
    document.querySelectorAll('.filter-btn').forEach((btn) => {
      btn.classList.toggle('filter-btn--active', btn.dataset.filter === type);
    });

    applyFilterAndSearch();
  }

  // ==================== SEARCH ====================
  function applySearch(query) {
    state.searchQuery = query.toLowerCase().trim();
    dom.searchClear.classList.toggle('hidden', !state.searchQuery);
    applyFilterAndSearch();
  }

  function clearSearch() {
    dom.searchInput.value = '';
    state.searchQuery = '';
    dom.searchClear.classList.add('hidden');
    applyFilterAndSearch();
  }

  /**
   * Combined filter + search
   */
  function applyFilterAndSearch() {
    let data = [...state.allData];

    // Filter by jenis_kata
    if (state.currentFilter !== 'Semua') {
      data = data.filter((item) => item.jenis_kata === state.currentFilter);
    }

    // Search (Arabic-aware: strips harakat before comparing)
    if (state.searchQuery) {
      const normalizedQuery = normalizeArabic(state.searchQuery).toLowerCase();
      data = data.filter((item) => {
        const searchable = [
          normalizeArabic(item.kata_arab || ''),
          normalizeArabic(item.contoh_ayat_ar || ''),
          item.transliterasi,
          item.arti,
          item.arti_en,
        ]
          .join(' ')
          .toLowerCase();
        return searchable.includes(normalizedQuery);
      });
    }

    updateCardWithLoader(() => {
      state.filteredData = data;
      state.currentIndex = 0;
    }, 'none');
  }

  // ==================== MODE SWITCHING ====================
  function switchMode(mode) {
    // Update nav buttons
    dom.navFlashcard.classList.toggle('nav-btn--active', mode === 'flashcard');
    dom.navQuiz.classList.toggle('nav-btn--active', mode === 'quiz');

    if (mode === 'flashcard') {
      dom.flashcardSection.classList.remove('hidden');
      dom.quizSection.classList.add('hidden');
      state.quizMode = false;
    } else {
      dom.flashcardSection.classList.add('hidden');
      dom.quizSection.classList.remove('hidden');
      state.quizMode = true;
      resetQuizUI();
    }
  }

  function resetQuizUI() {
    dom.quizStart.classList.remove('hidden');
    dom.quizPlay.classList.add('hidden');
    dom.quizResult.classList.add('hidden');
  }

  // ==================== QUIZ ENGINE ====================
  function startQuiz() {
    // Use all data for quiz (ignore flashcard filter)
    const pool = [...state.allData];
    if (pool.length < 4) {
      alert('Minimal 4 kosakata diperlukan untuk memulai kuis.');
      return;
    }

    const totalQuestions = Math.min(state.quizTotal, pool.length);

    // Shuffle and pick questions
    const shuffled = shuffleArray(pool);
    state.quizQuestions = shuffled.slice(0, totalQuestions).map((item) => {
      const type = Math.random() > 0.5 ? 'arab_to_id' : 'id_to_arab';
      return {
        item: item,
        type: type,
        options: generateOptions(item, pool, type),
        answered: false,
        correct: false,
      };
    });

    state.quizCurrentIndex = 0;
    state.quizScore = 0;
    state.quizAnswered = false;

    dom.quizStart.classList.add('hidden');
    dom.quizResult.classList.add('hidden');
    dom.quizPlay.classList.remove('hidden');

    renderQuizQuestion();
  }

  function generateOptions(correctItem, pool, type) {
    const isArabToId = type === 'arab_to_id';
    const correctAnswer = isArabToId ? correctItem.arti : correctItem.kata_arab;
    const options = [correctAnswer];

    // Get distractors
    const others = pool.filter((p) => (isArabToId ? p.arti : p.kata_arab) !== correctAnswer);
    const shuffledOthers = shuffleArray(others);

    for (let i = 0; i < 3 && i < shuffledOthers.length; i++) {
      options.push(isArabToId ? shuffledOthers[i].arti : shuffledOthers[i].kata_arab);
    }

    return shuffleArray(options);
  }

  function renderQuizQuestion() {
    const q = state.quizQuestions[state.quizCurrentIndex];
    const total = state.quizQuestions.length;

    // Progress
    const progress = ((state.quizCurrentIndex) / total) * 100;
    dom.quizProgressFill.style.width = progress + '%';
    dom.quizProgressText.textContent = `Soal ${state.quizCurrentIndex + 1} / ${total}`;
    dom.quizScoreLive.textContent = `Skor: ${state.quizScore}`;

    // Question
    if (q.type === 'arab_to_id') {
      dom.quizArab.textContent = q.item.kata_arab;
      dom.quizArab.className = 'quiz-question__arab';
    } else {
      dom.quizArab.textContent = q.item.arti;
      dom.quizArab.className = 'quiz-question__id';
    }

    // Options
    const optionBtns = dom.quizOptions.querySelectorAll('.quiz-option');
    optionBtns.forEach((btn, idx) => {
      btn.textContent = q.options[idx] || '';
      btn.className = 'quiz-option';
      if (q.type === 'id_to_arab') {
        btn.classList.add('quiz-option--arab');
      }
      btn.disabled = false;
      btn.onclick = () => checkAnswer(idx);
    });

    // Hide feedback
    dom.quizFeedback.classList.add('hidden');
    dom.quizFeedback.className = 'quiz-feedback hidden';
    state.quizAnswered = false;
  }

  function checkAnswer(selectedIdx) {
    if (state.quizAnswered) return;
    state.quizAnswered = true;

    const q = state.quizQuestions[state.quizCurrentIndex];
    const selected = q.options[selectedIdx];
    const correctAnswer = q.type === 'arab_to_id' ? q.item.arti : q.item.kata_arab;
    const isCorrect = selected === correctAnswer;

    q.answered = true;
    q.correct = isCorrect;

    if (isCorrect) state.quizScore++;

    // Visual feedback on buttons
    const optionBtns = dom.quizOptions.querySelectorAll('.quiz-option');
    optionBtns.forEach((btn, idx) => {
      btn.disabled = true;
      if (q.options[idx] === correctAnswer) {
        btn.classList.add('quiz-option--correct');
      } else if (idx === selectedIdx && !isCorrect) {
        btn.classList.add('quiz-option--wrong');
      }
    });

    // Feedback message
    dom.quizFeedback.classList.remove('hidden');
    if (isCorrect) {
      dom.quizFeedback.className = 'quiz-feedback quiz-feedback--correct';
      dom.quizFeedbackIcon.innerHTML = '<svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>';
      dom.quizFeedbackText.textContent = 'Benar! Masya Allah!';
    } else {
      dom.quizFeedback.className = 'quiz-feedback quiz-feedback--wrong';
      dom.quizFeedbackIcon.innerHTML = '<svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';

      const answerDisplay = q.type === 'id_to_arab'
        ? `<span dir="rtl" style="font-family: var(--font-arab); font-size: 1.5rem;">${correctAnswer}</span>`
        : correctAnswer;
      dom.quizFeedbackText.innerHTML = `Jawaban yang benar: <br>${answerDisplay}`;
    }

    // Auto advance after delay
    setTimeout(() => {
      if (state.quizCurrentIndex < state.quizQuestions.length - 1) {
        state.quizCurrentIndex++;
        renderQuizQuestion();
      } else {
        showQuizResult();
      }
    }, 1500);
  }

  function showQuizResult() {
    dom.quizPlay.classList.add('hidden');
    dom.quizResult.classList.remove('hidden');

    const total = state.quizQuestions.length;
    const score = state.quizScore;
    const pct = Math.round((score / total) * 100);

    // Animate score counter
    animateCounter(dom.resultScore, 0, score, 800);

    dom.resultPercentage.textContent = `${pct}%`;

    // Update progress bar to 100%
    dom.quizProgressFill.style.width = '100%';

    // Message based on score
    if (pct >= 80) {
      dom.resultEmoji.innerHTML = '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="#10B981" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
      dom.resultMessage.textContent =
        'Masya Allah, luar biasa! Anda sangat menguasainya, terus tingkatkan hafalan anda, dan jangan lupa untuk meluruskan niat karena Allah agar berpahala. Barakallahu fiikum';
      dom.resultScore.style.color = '#10B981';
      dom.resultPercentage.style.color = '#10B981';
    } else if (pct >= 60) {
      dom.resultEmoji.innerHTML = '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg>';
      dom.resultMessage.textContent =
        'Masya Allah, bagus! Hafalan Anda sudah baik. Terus berlatih untuk hasil yang lebih optimal, dan jangan lupa untuk meluruskan niat karena Allah agar berpahala. Barakallahu fiikum';
      dom.resultScore.style.color = '#3b82f6';
      dom.resultPercentage.style.color = '#3b82f6';
    } else {
      dom.resultEmoji.innerHTML = '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>';
      dom.resultMessage.textContent =
        'Jangan menyerah! Ulangi flashcard dan coba lagi kuis ini. Setiap pengulangan insyaAllah meningkatkan hafalan anda, dan jangan lupa untuk meluruskan niat karena Allah agar berpahala. Barakallahu fiikum';
      dom.resultScore.style.color = '#ef4444';
      dom.resultPercentage.style.color = '#ef4444';
    }
  }

  function animateCounter(el, from, to, duration) {
    const start = performance.now();
    function step(timestamp) {
      const progress = Math.min((timestamp - start) / duration, 1);
      const value = Math.round(from + (to - from) * easeOutCubic(progress));
      el.textContent = value;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  // ==================== TOUCH SWIPE ====================
  function handleTouchStart(e) {
    state.touchStartX = e.changedTouches[0].screenX;
  }

  function handleTouchEnd(e) {
    state.touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }

  function handleSwipe() {
    const diff = state.touchStartX - state.touchEndX;
    const threshold = 50;

    if (Math.abs(diff) < threshold) return;

    if (diff > 0) {
      // Swipe left → next
      nextCard();
    } else {
      // Swipe right → prev
      prevCard();
    }
  }

  // ==================== UTILITIES ====================

  /**
   * Normalize Arabic text for search:
   * - Strip harakat/diacritics (fathah, kasrah, dammah, shadda, sukun, tanwin, etc.)
   * - Normalize alef variants (ٱ أ إ آ → ا)
   * - Normalize taa marbuta (ة → ه)
   * - Normalize alef maqsura (ى → ي)
   */
  function normalizeArabic(text) {
    return text
      // Remove Arabic diacritical marks (harakat): U+064B to U+065F, U+0670
      .replace(/[\u064B-\u065F\u0670]/g, '')
      // Remove tatweel (kashida)
      .replace(/\u0640/g, '')
      // Remove Quranic annotation signs (small high/low letters, etc.)
      .replace(/[\u06D6-\u06ED]/g, '')
      // Remove zero-width characters
      .replace(/[\u200B-\u200F\u202A-\u202E\uFEFF]/g, '')
      // Normalize alef variants to plain alef
      .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627') // آ أ إ ٱ → ا
      // Normalize taa marbuta to haa
      .replace(/\u0629/g, '\u0647') // ة → ه
      // Normalize alef maqsura to yaa
      .replace(/\u0649/g, '\u064A') // ى → ي
      .trim();
  }

  function shuffleArray(arr) {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // ==================== EVENT LISTENERS ====================
  function initEventListeners() {
    // Card flip
    dom.cardContainer.addEventListener('click', flipCard);

    // Navigation
    dom.prevBtn.addEventListener('click', prevCard);
    dom.nextBtn.addEventListener('click', nextCard);

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (state.quizMode) return;
      if (e.target.tagName === 'INPUT') return;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          nextCard();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          prevCard();
          break;
        case ' ':
          e.preventDefault();
          flipCard();
          break;
      }
    });

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => applyFilter(btn.dataset.filter));
    });

    // Search
    dom.searchInput.addEventListener('input', (e) => applySearch(e.target.value));
    dom.searchClear.addEventListener('click', clearSearch);

    // Mode switching
    dom.navFlashcard.addEventListener('click', () => switchMode('flashcard'));
    dom.navQuiz.addEventListener('click', () => switchMode('quiz'));

    // Quiz Options Listener
    if (dom.quizQuestionCountOptions && dom.quizQuestionCountOptions.length > 0) {
      dom.quizQuestionCountOptions.forEach(btn => {
        btn.addEventListener('click', () => {
          // Remove active class from all
          dom.quizQuestionCountOptions.forEach(b => b.classList.remove('quiz-settings__btn--active'));
          // Add active class to clicked
          btn.classList.add('quiz-settings__btn--active');
          // Update state
          state.quizTotal = parseInt(btn.dataset.count);
          // Update info text
          if (dom.quizStartCountText) {
            dom.quizStartCountText.textContent = `${state.quizTotal} Soal Acak`;
          }
        });
      });
    }

    // Quiz
    dom.startQuizBtn.addEventListener('click', startQuiz);
    dom.retryQuizBtn.addEventListener('click', resetQuizUI);
    dom.backToFlashcardBtn.addEventListener('click', () => switchMode('flashcard'));

    // Touch swipe on card
    dom.cardContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
    dom.cardContainer.addEventListener('touchend', handleTouchEnd, { passive: true });
  }

  // ==================== INIT ====================
  function init() {
    initEventListeners();
    loadData();
  }

  // Start app when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
