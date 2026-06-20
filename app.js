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
  };

  const QUIZ_TOTAL = 25;

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
    cardArab: $('cardArab'),
    cardBadgeFront: $('cardBadgeFront'),
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
  function renderCard() {
    if (state.filteredData.length === 0) {
      dom.cardArab.textContent = '—';
      dom.cardBadgeFront.textContent = '';
      dom.cardBadgeBack.textContent = '';
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
    dom.cardBadgeFront.textContent = item.jenis_kata || '';

    // Back side
    dom.cardBadgeBack.textContent = item.jenis_kata || '';
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
    state.isFlipped = !state.isFlipped;
    dom.flashcard.classList.toggle('card--flipped');
  }

  function nextCard() {
    if (state.filteredData.length === 0) return;
    state.currentIndex = (state.currentIndex + 1) % state.filteredData.length;
    renderCard();
  }

  function prevCard() {
    if (state.filteredData.length === 0) return;
    state.currentIndex =
      (state.currentIndex - 1 + state.filteredData.length) % state.filteredData.length;
    renderCard();
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

    // Search
    if (state.searchQuery) {
      data = data.filter((item) => {
        const searchable = [
          item.kata_arab,
          item.transliterasi,
          item.arti,
          item.arti_en,
        ]
          .join(' ')
          .toLowerCase();
        return searchable.includes(state.searchQuery);
      });
    }

    state.filteredData = data;
    state.currentIndex = 0;
    renderCard();
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

    const totalQuestions = Math.min(QUIZ_TOTAL, pool.length);

    // Shuffle and pick questions
    const shuffled = shuffleArray(pool);
    state.quizQuestions = shuffled.slice(0, totalQuestions).map((item) => ({
      item: item,
      options: generateOptions(item, pool),
      answered: false,
      correct: false,
    }));

    state.quizCurrentIndex = 0;
    state.quizScore = 0;
    state.quizAnswered = false;

    dom.quizStart.classList.add('hidden');
    dom.quizResult.classList.add('hidden');
    dom.quizPlay.classList.remove('hidden');

    renderQuizQuestion();
  }

  function generateOptions(correctItem, pool) {
    const options = [correctItem.arti];

    // Get distractors
    const others = pool.filter((p) => p.arti !== correctItem.arti);
    const shuffledOthers = shuffleArray(others);

    for (let i = 0; i < 3 && i < shuffledOthers.length; i++) {
      options.push(shuffledOthers[i].arti);
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
    dom.quizArab.textContent = q.item.kata_arab;

    // Options
    const optionBtns = dom.quizOptions.querySelectorAll('.quiz-option');
    optionBtns.forEach((btn, idx) => {
      btn.textContent = q.options[idx] || '';
      btn.className = 'quiz-option';
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
    const isCorrect = selected === q.item.arti;

    q.answered = true;
    q.correct = isCorrect;

    if (isCorrect) state.quizScore++;

    // Visual feedback on buttons
    const optionBtns = dom.quizOptions.querySelectorAll('.quiz-option');
    optionBtns.forEach((btn, idx) => {
      btn.disabled = true;
      if (q.options[idx] === q.item.arti) {
        btn.classList.add('quiz-option--correct');
      } else if (idx === selectedIdx && !isCorrect) {
        btn.classList.add('quiz-option--wrong');
      }
    });

    // Feedback message
    dom.quizFeedback.classList.remove('hidden');
    if (isCorrect) {
      dom.quizFeedback.className = 'quiz-feedback quiz-feedback--correct';
      dom.quizFeedbackIcon.textContent = '✅';
      dom.quizFeedbackText.textContent = 'Benar! Masya Allah!';
    } else {
      dom.quizFeedback.className = 'quiz-feedback quiz-feedback--wrong';
      dom.quizFeedbackIcon.textContent = '❌';
      dom.quizFeedbackText.textContent = `Jawaban yang benar: ${q.item.arti}`;
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
      dom.resultEmoji.textContent = '🌟';
      dom.resultMessage.textContent =
        'Masya Allah, luar biasa! Anda sangat menguasai kosakata ini! Terus pertahankan!';
    } else if (pct >= 60) {
      dom.resultEmoji.textContent = '💪';
      dom.resultMessage.textContent =
        'Bagus! Pemahaman Anda sudah baik. Terus berlatih untuk hasil yang lebih sempurna!';
    } else {
      dom.resultEmoji.textContent = '📖';
      dom.resultMessage.textContent =
        'Jangan menyerah! Ulangi flashcard dan coba lagi kuis ini. Setiap pengulangan menambah pemahaman!';
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

    // Quiz
    dom.startQuizBtn.addEventListener('click', startQuiz);
    dom.retryQuizBtn.addEventListener('click', startQuiz);
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
