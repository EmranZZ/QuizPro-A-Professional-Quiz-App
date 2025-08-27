/**
 * QuizPro - Professional Quiz Application
 * Industry-level JavaScript implementation with modern ES6+ features,
 * error handling, accessibility, and performance optimizations
 */

// Application Configuration
const CONFIG = {
  API_BASE_URL: 'https://opentdb.com/api.php',
  API_TIMEOUT: 10000,
  STORAGE_KEY: 'quizpro_data',
  VERSION: '2.0.0',
  PERFORMANCE_MESSAGES: {
    EXCELLENT: { min: 90, message: '🏆 Excellent! You\'re a quiz master!', class: 'success' },
    VERY_GOOD: { min: 80, message: '🎉 Very Good! Keep up the great work!', class: 'success' },
    GOOD: { min: 70, message: '👍 Good job! You\'re on the right track!', class: 'info' },
    FAIR: { min: 60, message: '📚 Fair performance. Practice makes perfect!', class: 'warning' },
    POOR: { min: 0, message: '💪 Don\'t give up! Learning is a journey!', class: 'error' }
  }
};

// Application State Management
class QuizState {
  constructor() {
    this.questions = [];
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.timeLeft = 0;
    this.timer = null;
    this.startTime = null;
    this.questionStartTime = null;
    this.questionTimes = [];
    this.userAnswers = [];
    this.settings = {
      numQuestions: 10,
      category: '',
      difficulty: 'medium',
      timePerQuestion: 20
    };
    this.isAnswered = false;
    this.isQuizActive = false;
  }

  reset() {
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.questionTimes = [];
    this.userAnswers = [];
    this.isAnswered = false;
    this.isQuizActive = false;
    this.clearTimer();
  }

  clearTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  incrementScore() {
    this.score++;
    this.streak++;
    this.bestStreak = Math.max(this.bestStreak, this.streak);
  }

  resetStreak() {
    this.streak = 0;
  }

  recordQuestionTime() {
    if (this.questionStartTime) {
      const timeSpent = this.settings.timePerQuestion - this.timeLeft;
      this.questionTimes.push(timeSpent);
    }
  }

  getAverageTime() {
    if (this.questionTimes.length === 0) return 0;
    const total = this.questionTimes.reduce((sum, time) => sum + time, 0);
    return Math.round(total / this.questionTimes.length);
  }

  getPerformanceMessage() {
    const percentage = (this.score / this.questions.length) * 100;
    for (const [key, config] of Object.entries(CONFIG.PERFORMANCE_MESSAGES)) {
      if (percentage >= config.min) {
        return config;
      }
    }
    return CONFIG.PERFORMANCE_MESSAGES.POOR;
  }
}

// Utility Functions
class Utils {
  static decodeHtml(html) {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  }

  static shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  static formatTime(seconds) {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  static animate(element, className, duration = 300) {
    return new Promise(resolve => {
      element.classList.add(className);
      setTimeout(() => {
        element.classList.remove(className);
        resolve();
      }, duration);
    });
  }

  static saveToStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  static loadFromStorage(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
      return null;
    }
  }
}

// API Service
class ApiService {
  static async fetchQuestions(numQuestions, category, difficulty) {
    const params = new URLSearchParams({
      amount: numQuestions,
      type: 'multiple'
    });

    if (category) params.append('category', category);
    if (difficulty) params.append('difficulty', difficulty);

    const url = `${CONFIG.API_BASE_URL}?${params}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.response_code !== 0) {
        throw new Error(this.getApiErrorMessage(data.response_code));
      }

      return data.results.map(question => ({
        ...question,
        question: Utils.decodeHtml(question.question),
        correct_answer: Utils.decodeHtml(question.correct_answer),
        incorrect_answers: question.incorrect_answers.map(answer => Utils.decodeHtml(answer))
      }));

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your internet connection and try again.');
      }
      throw error;
    }
  }

  static getApiErrorMessage(responseCode) {
    const errorMessages = {
      1: 'No results found. Try different settings.',
      2: 'Invalid parameters. Please check your settings.',
      3: 'Token not found.',
      4: 'Token empty.',
      5: 'Rate limit exceeded. Please wait a moment and try again.'
    };
    return errorMessages[responseCode] || 'An unknown error occurred.';
  }
}

// UI Components
class UIComponents {
  static showLoading(message = 'Loading...') {
    const overlay = document.getElementById('loading-overlay');
    const text = overlay.querySelector('p');
    text.textContent = message;
    overlay.classList.remove('hide');
  }

  static hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.add('hide');
  }

  static showError(title, message) {
    const modal = document.getElementById('error-modal');
    const titleElement = document.getElementById('error-title');
    const messageElement = document.getElementById('error-message');

    titleElement.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${title}`;
    messageElement.textContent = message;
    modal.classList.remove('hide');

    // Focus management
    const closeButton = document.getElementById('error-close');
    closeButton.focus();
  }

  static hideError() {
    const modal = document.getElementById('error-modal');
    modal.classList.add('hide');
  }

  static showToast(title, message, type = 'info', duration = 5000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    toast.innerHTML = `
      <div class="toast-header">
        <div class="toast-title">
          <i class="fas fa-${this.getToastIcon(type)}"></i>
          ${title}
        </div>
        <button class="toast-close" aria-label="Close notification">&times;</button>
      </div>
      <div class="toast-body">${message}</div>
    `;

    container.appendChild(toast);

    // Auto remove
    const timeoutId = setTimeout(() => {
      toast.style.animation = 'toastSlideIn 0.3s ease-out reverse';
      setTimeout(() => toast.remove(), 300);
    }, duration);

    // Manual close
    const closeButton = toast.querySelector('.toast-close');
    closeButton.addEventListener('click', () => {
      clearTimeout(timeoutId);
      toast.style.animation = 'toastSlideIn 0.3s ease-out reverse';
      setTimeout(() => toast.remove(), 300);
    });
  }

  static getToastIcon(type) {
    const icons = {
      success: 'check-circle',
      error: 'exclamation-circle',
      warning: 'exclamation-triangle',
      info: 'info-circle'
    };
    return icons[type] || 'info-circle';
  }

  static updateProgressBar(percentage, timeLeft) {
    const progressBar = document.querySelector('.progress-bar');
    const progressText = document.querySelector('.progress-text');
    
    if (progressBar && progressText) {
      progressBar.style.width = `${percentage}%`;
      progressBar.setAttribute('aria-valuenow', percentage);
      progressText.textContent = timeLeft;
      
      // Add visual feedback for low time
      if (percentage < 20) {
        progressBar.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
      } else if (percentage < 50) {
        progressBar.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
      } else {
        progressBar.style.background = 'linear-gradient(135deg, var(--primary-color), var(--primary-light))';
      }
    }
  }

  static updateScore(score, streak) {
    const scoreElement = document.getElementById('current-score');
    const streakElement = document.getElementById('current-streak');
    
    if (scoreElement) scoreElement.textContent = score;
    if (streakElement) streakElement.textContent = streak;
  }

  static switchScreen(hideClass, showClass) {
    document.querySelectorAll('.start-screen, .quiz, .end-screen, .review-screen').forEach(screen => {
      screen.classList.add('hide');
    });
    
    const targetScreen = document.querySelector(`.${showClass}`);
    if (targetScreen) {
      targetScreen.classList.remove('hide');
      // Focus management
      const heading = targetScreen.querySelector('h1, .heading');
      if (heading) heading.focus();
    }
  }
}

// Event Handlers
class EventHandlers {
  constructor(quizApp) {
    this.quizApp = quizApp;
    this.boundHandlers = {};
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    // Form submission
    this.addEventListenerSafe('quiz-settings', 'submit', this.handleStartQuiz.bind(this));
    
    // Button clicks
    this.addEventListenerSafe('start-btn', 'click', this.handleStartQuiz.bind(this));
    this.addEventListenerSafe('submit-btn', 'click', this.handleSubmitAnswer.bind(this));
    this.addEventListenerSafe('next-btn', 'click', this.handleNextQuestion.bind(this));
    this.addEventListenerSafe('skip-btn', 'click', this.handleSkipQuestion.bind(this));
    this.addEventListenerSafe('quit-btn', 'click', this.handleQuitQuiz.bind(this));
    this.addEventListenerSafe('restart-btn', 'click', this.handleRestartQuiz.bind(this));
    this.addEventListenerSafe('review-btn', 'click', this.handleShowReview.bind(this));
    this.addEventListenerSafe('back-to-results', 'click', this.handleBackToResults.bind(this));
    this.addEventListenerSafe('share-btn', 'click', this.handleShareResults.bind(this));
    
    // Modal events
    this.addEventListenerSafe('error-close', 'click', UIComponents.hideError);
    this.addEventListenerSafe('error-modal', 'click', (e) => {
      if (e.target.id === 'error-modal') UIComponents.hideError();
    });

    // Keyboard navigation
    document.addEventListener('keydown', this.handleKeyboard.bind(this));
    
    // Window events
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    window.addEventListener('online', () => UIComponents.showToast('Connection', 'You are back online!', 'success'));
    window.addEventListener('offline', () => UIComponents.showToast('Connection', 'You are offline. Some features may not work.', 'warning'));
  }

  addEventListenerSafe(id, event, handler) {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener(event, handler);
      this.boundHandlers[id] = this.boundHandlers[id] || {};
      this.boundHandlers[id][event] = handler;
    }
  }

  handleStartQuiz(e) {
    e.preventDefault();
    this.quizApp.startQuiz();
  }

  handleSubmitAnswer() {
    this.quizApp.submitAnswer();
  }

  handleNextQuestion() {
    this.quizApp.nextQuestion();
  }

  handleSkipQuestion() {
    this.quizApp.skipQuestion();
  }

  handleQuitQuiz() {
    if (confirm('Are you sure you want to quit the quiz? Your progress will be lost.')) {
      this.quizApp.quitQuiz();
    }
  }

  handleRestartQuiz() {
    this.quizApp.restartQuiz();
  }

  handleShowReview() {
    this.quizApp.showReview();
  }

  handleBackToResults() {
    this.quizApp.showResults();
  }

  handleShareResults() {
    this.quizApp.shareResults();
  }

  handleKeyboard(e) {
    // Global keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'Enter':
          if (this.quizApp.state.isQuizActive && !this.quizApp.state.isAnswered) {
            e.preventDefault();
            this.handleSubmitAnswer();
          }
          break;
        case 'n':
          if (this.quizApp.state.isAnswered) {
            e.preventDefault();
            this.handleNextQuestion();
          }
          break;
      }
    }

    // Escape key
    if (e.key === 'Escape') {
      const modal = document.querySelector('.modal:not(.hide)');
      if (modal) {
        UIComponents.hideError();
      }
    }

    // Number keys for answers (1-4)
    if (this.quizApp.state.isQuizActive && !this.quizApp.state.isAnswered) {
      const num = parseInt(e.key);
      if (num >= 1 && num <= 4) {
        const answers = document.querySelectorAll('.answer');
        if (answers[num - 1]) {
          answers[num - 1].click();
        }
      }
    }
  }

  handleBeforeUnload(e) {
    if (this.quizApp.state.isQuizActive && this.quizApp.state.currentQuestionIndex > 0) {
      e.preventDefault();
      e.returnValue = 'You have an active quiz. Are you sure you want to leave?';
      return e.returnValue;
    }
  }
}

// Main Quiz Application Class
class QuizApp {
  constructor() {
    this.state = new QuizState();
    this.eventHandlers = new EventHandlers(this);
    this.init();
  }

  init() {
    // Load saved settings
    this.loadSettings();
    
    // Initialize UI
    this.initializeUI();
    
    // Check online status
    if (!navigator.onLine) {
      UIComponents.showToast('Connection', 'You are offline. Please connect to the internet to load new questions.', 'warning', 8000);
    }

    console.log(`QuizPro v${CONFIG.VERSION} initialized successfully`);
  }

  loadSettings() {
    const savedData = Utils.loadFromStorage(CONFIG.STORAGE_KEY);
    if (savedData && savedData.settings) {
      this.state.settings = { ...this.state.settings, ...savedData.settings };
      this.applySettingsToUI();
    }
  }

  saveSettings() {
    const dataToSave = {
      settings: this.state.settings,
      timestamp: Date.now()
    };
    Utils.saveToStorage(CONFIG.STORAGE_KEY, dataToSave);
  }

  applySettingsToUI() {
    document.getElementById('num-questions').value = this.state.settings.numQuestions;
    document.getElementById('category').value = this.state.settings.category;
    document.getElementById('difficulty').value = this.state.settings.difficulty;
    document.getElementById('time').value = this.state.settings.timePerQuestion;
  }

  initializeUI() {
    // Set initial focus
    const startBtn = document.getElementById('start-btn');
    if (startBtn) startBtn.focus();
  }

  async startQuiz() {
    try {
      // Collect settings
      this.collectSettings();
      this.saveSettings();
      
      // Validate settings
      if (!this.validateSettings()) return;

      // Show loading
      UIComponents.showLoading('Fetching questions...');
      
      // Fetch questions
      this.state.questions = await ApiService.fetchQuestions(
        this.state.settings.numQuestions,
        this.state.settings.category,
        this.state.settings.difficulty
      );

      if (this.state.questions.length === 0) {
        throw new Error('No questions received from the server');
      }

      // Initialize quiz
      this.state.reset();
      this.state.isQuizActive = true;
      this.state.startTime = Date.now();
      
      // Hide loading and switch to quiz
      UIComponents.hideLoading();
      UIComponents.switchScreen('start-screen', 'quiz');
      
      // Show first question
      this.showQuestion(0);
      
      UIComponents.showToast('Quiz Started', `Good luck with your ${this.state.questions.length} questions!`, 'success');

    } catch (error) {
      UIComponents.hideLoading();
      UIComponents.showError('Failed to Start Quiz', error.message);
      console.error('Quiz start error:', error);
    }
  }

  collectSettings() {
    this.state.settings = {
      numQuestions: parseInt(document.getElementById('num-questions').value),
      category: document.getElementById('category').value,
      difficulty: document.getElementById('difficulty').value,
      timePerQuestion: parseInt(document.getElementById('time').value)
    };
  }

  validateSettings() {
    const { numQuestions, timePerQuestion } = this.state.settings;
    
    if (numQuestions < 1 || numQuestions > 50) {
      UIComponents.showError('Invalid Settings', 'Number of questions must be between 1 and 50');
      return false;
    }
    
    if (timePerQuestion < 5 || timePerQuestion > 300) {
      UIComponents.showError('Invalid Settings', 'Time per question must be between 5 and 300 seconds');
      return false;
    }
    
    return true;
  }

  showQuestion(index) {
    if (index >= this.state.questions.length) {
      this.endQuiz();
      return;
    }

    const question = this.state.questions[index];
    this.state.currentQuestionIndex = index;
    this.state.isAnswered = false;
    this.state.questionStartTime = Date.now();

    // Update question number and progress
    document.querySelector('.current').textContent = index + 1;
    document.querySelector('.total').textContent = `/${this.state.questions.length}`;

    // Set question text
    const questionElement = document.getElementById('question-text');
    questionElement.textContent = question.question;

    // Set category
    const categoryElement = document.getElementById('question-category');
    if (categoryElement) {
      categoryElement.textContent = question.category;
    }

    // Generate answers
    this.generateAnswers(question);

    // Update UI state
    this.updateButtonStates();
    UIComponents.updateScore(this.state.score, this.state.streak);

    // Start timer
    this.startTimer();

    // Announce to screen readers
    this.announceQuestion(index + 1, this.state.questions.length);
  }

  generateAnswers(question) {
    const answerWrapper = document.querySelector('.answer-wrapper');
    const allAnswers = [...question.incorrect_answers, question.correct_answer];
    const shuffledAnswers = Utils.shuffleArray(allAnswers);

    answerWrapper.innerHTML = '';

    shuffledAnswers.forEach((answer, index) => {
      const answerElement = document.createElement('div');
      answerElement.className = 'answer';
      answerElement.setAttribute('role', 'radio');
      answerElement.setAttribute('aria-checked', 'false');
      answerElement.setAttribute('tabindex', '0');
      
      answerElement.innerHTML = `
        <span class="text">${answer}</span>
        <span class="checkbox">
          <i class="fas fa-check"></i>
        </span>
      `;

      answerElement.addEventListener('click', () => this.selectAnswer(answerElement));
      answerElement.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.selectAnswer(answerElement);
        }
      });

      answerWrapper.appendChild(answerElement);
    });
  }

  selectAnswer(selectedElement) {
    if (this.state.isAnswered) return;

    // Remove previous selection
    document.querySelectorAll('.answer').forEach(answer => {
      answer.classList.remove('selected');
      answer.setAttribute('aria-checked', 'false');
    });

    // Select new answer
    selectedElement.classList.add('selected');
    selectedElement.setAttribute('aria-checked', 'true');

    // Enable submit button
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.focus();
    }
  }

  submitAnswer() {
    if (this.state.isAnswered) return;

    this.state.isAnswered = true;
    this.state.clearTimer();
    this.state.recordQuestionTime();

    const selectedAnswer = document.querySelector('.answer.selected');
    const question = this.state.questions[this.state.currentQuestionIndex];

    if (selectedAnswer) {
      const answer = selectedAnswer.querySelector('.text').textContent;
      const isCorrect = answer === question.correct_answer;

      // Record user answer
      this.state.userAnswers.push({
        question: question.question,
        userAnswer: answer,
        correctAnswer: question.correct_answer,
        isCorrect: isCorrect,
        timeSpent: this.state.settings.timePerQuestion - this.state.timeLeft
      });

      if (isCorrect) {
        this.state.incrementScore();
        selectedAnswer.classList.add('correct');
        UIComponents.showToast('Correct!', 'Well done!', 'success', 2000);
      } else {
        this.state.resetStreak();
        selectedAnswer.classList.add('wrong');
        UIComponents.showToast('Incorrect', `The correct answer was: ${question.correct_answer}`, 'error', 3000);
      }
    } else {
      // No answer selected
      this.state.resetStreak();
      this.state.userAnswers.push({
        question: question.question,
        userAnswer: null,
        correctAnswer: question.correct_answer,
        isCorrect: false,
        timeSpent: this.state.settings.timePerQuestion
      });
    }

    // Highlight correct answer
    this.highlightCorrectAnswer(question.correct_answer);

    // Disable all answers
    document.querySelectorAll('.answer').forEach(answer => {
      answer.classList.add('checked');
      answer.style.pointerEvents = 'none';
    });

    // Update button states
    this.updateButtonStates();
    UIComponents.updateScore(this.state.score, this.state.streak);
  }

  highlightCorrectAnswer(correctAnswer) {
    document.querySelectorAll('.answer').forEach(answer => {
      const text = answer.querySelector('.text').textContent;
      if (text === correctAnswer && !answer.classList.contains('correct')) {
        answer.classList.add('correct');
      }
    });
  }

  nextQuestion() {
    const nextIndex = this.state.currentQuestionIndex + 1;
    if (nextIndex < this.state.questions.length) {
      this.showQuestion(nextIndex);
    } else {
      this.endQuiz();
    }
  }

  skipQuestion() {
    if (this.state.isAnswered) return;

    this.state.isAnswered = true;
    this.state.clearTimer();
    this.state.resetStreak();

    const question = this.state.questions[this.state.currentQuestionIndex];
    
    // Record skipped question
    this.state.userAnswers.push({
      question: question.question,
      userAnswer: 'Skipped',
      correctAnswer: question.correct_answer,
      isCorrect: false,
      timeSpent: 0
    });

    // Highlight correct answer
    this.highlightCorrectAnswer(question.correct_answer);

    // Update UI
    this.updateButtonStates();
    UIComponents.showToast('Question Skipped', `The correct answer was: ${question.correct_answer}`, 'warning', 3000);
  }

  startTimer() {
    this.state.timeLeft = this.state.settings.timePerQuestion;
    UIComponents.updateProgressBar(100, this.state.timeLeft);

    this.state.timer = setInterval(() => {
      this.state.timeLeft--;
      const percentage = (this.state.timeLeft / this.state.settings.timePerQuestion) * 100;
      UIComponents.updateProgressBar(percentage, this.state.timeLeft);

      // Warning at 5 seconds
      if (this.state.timeLeft === 5) {
        UIComponents.showToast('Time Warning', '5 seconds remaining!', 'warning', 2000);
      }

      // Time up
      if (this.state.timeLeft <= 0) {
        this.handleTimeUp();
      }
    }, 1000);
  }

  handleTimeUp() {
    if (this.state.isAnswered) return;

    this.state.clearTimer();
    UIComponents.showToast('Time\'s Up!', 'Moving to next question...', 'error', 2000);
    
    // Auto-submit (which will be recorded as incorrect)
    this.submitAnswer();
    
    // Auto-advance after a short delay
    setTimeout(() => {
      if (this.state.currentQuestionIndex < this.state.questions.length - 1) {
        this.nextQuestion();
      } else {
        this.endQuiz();
      }
    }, 2000);
  }

  updateButtonStates() {
    const submitBtn = document.getElementById('submit-btn');
    const nextBtn = document.getElementById('next-btn');
    const skipBtn = document.getElementById('skip-btn');

    if (this.state.isAnswered) {
      submitBtn.classList.add('hide');
      nextBtn.classList.remove('hide');
      skipBtn.classList.add('hide');
      nextBtn.focus();
    } else {
      submitBtn.classList.remove('hide');
      nextBtn.classList.add('hide');
      skipBtn.classList.remove('hide');
      submitBtn.disabled = !document.querySelector('.answer.selected');
    }
  }

  endQuiz() {
    this.state.isQuizActive = false;
    this.state.clearTimer();
    this.showResults();
  }

  showResults() {
    UIComponents.switchScreen('quiz', 'end-screen');
    
    const totalQuestions = this.state.questions.length;
    const percentage = Math.round((this.state.score / totalQuestions) * 100);
    const incorrectCount = totalQuestions - this.state.score;
    const avgTime = this.state.getAverageTime();
    const performanceData = this.state.getPerformanceMessage();

    // Update score display
    document.querySelector('.final-score').textContent = this.state.score;
    document.querySelector('.total-score').textContent = `/${totalQuestions}`;
    document.querySelector('.score-percentage').textContent = `${percentage}%`;

    // Update statistics
    document.getElementById('correct-count').textContent = this.state.score;
    document.getElementById('incorrect-count').textContent = incorrectCount;
    document.getElementById('avg-time').textContent = `${avgTime}s`;
    document.getElementById('best-streak').textContent = this.state.bestStreak;

    // Show performance message
    const messageElement = document.getElementById('performance-message');
    messageElement.innerHTML = `
      <div class="performance-indicator ${performanceData.class}">
        <p>${performanceData.message}</p>
        <small>You scored ${this.state.score} out of ${totalQuestions} questions correctly (${percentage}%)</small>
      </div>
    `;

    UIComponents.showToast('Quiz Complete!', `You scored ${percentage}%`, 'success', 5000);
  }

  showReview() {
    UIComponents.switchScreen('end-screen', 'review-screen');
    
    const reviewContent = document.getElementById('review-content');
    reviewContent.innerHTML = '';

    this.state.userAnswers.forEach((answer, index) => {
      const reviewItem = document.createElement('div');
      reviewItem.className = 'review-item';
      
      const statusIcon = answer.isCorrect ? 
        '<i class="fas fa-check-circle" style="color: var(--success-color);"></i>' :
        '<i class="fas fa-times-circle" style="color: var(--error-color);"></i>';

      reviewItem.innerHTML = `
        <div class="review-header">
          ${statusIcon}
          <strong>Question ${index + 1}</strong>
        </div>
        <div class="review-question">${answer.question}</div>
        <div class="review-answers">
          ${answer.userAnswer ? 
            `<div class="review-answer user">Your answer: ${answer.userAnswer}</div>` :
            '<div class="review-answer user">No answer provided</div>'
          }
          <div class="review-answer correct">Correct answer: ${answer.correctAnswer}</div>
        </div>
        <div class="review-time">Time spent: ${answer.timeSpent}s</div>
      `;

      reviewContent.appendChild(reviewItem);
    });
  }

  quitQuiz() {
    this.state.reset();
    UIComponents.switchScreen('quiz', 'start-screen');
    UIComponents.showToast('Quiz Quit', 'You can start a new quiz anytime!', 'info');
  }

  restartQuiz() {
    this.state.reset();
    UIComponents.switchScreen('end-screen', 'start-screen');
    
    // Focus on start button
    const startBtn = document.getElementById('start-btn');
    if (startBtn) startBtn.focus();
  }

  shareResults() {
    const totalQuestions = this.state.questions.length;
    const percentage = Math.round((this.state.score / totalQuestions) * 100);
    const shareText = `I just scored ${this.state.score}/${totalQuestions} (${percentage}%) on QuizPro! 🧠✨`;

    if (navigator.share) {
      // Use native sharing if available
      navigator.share({
        title: 'QuizPro Results',
        text: shareText,
        url: window.location.href
      }).catch(console.error);
    } else if (navigator.clipboard) {
      // Fallback to clipboard
      navigator.clipboard.writeText(shareText).then(() => {
        UIComponents.showToast('Copied!', 'Results copied to clipboard', 'success');
      }).catch(() => {
        this.fallbackShare(shareText);
      });
    } else {
      this.fallbackShare(shareText);
    }
  }

  fallbackShare(text) {
    // Create temporary textarea for fallback copy
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
      document.execCommand('copy');
      UIComponents.showToast('Copied!', 'Results copied to clipboard', 'success');
    } catch (error) {
      UIComponents.showToast('Share Failed', 'Unable to copy results', 'error');
    }
    
    document.body.removeChild(textarea);
  }

  announceQuestion(current, total) {
    // Create announcement for screen readers
    const announcement = `Question ${current} of ${total}`;
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'visually-hidden';
    announcer.textContent = announcement;
    
    document.body.appendChild(announcer);
    setTimeout(() => document.body.removeChild(announcer), 1000);
  }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Check for required browser features
  if (!window.fetch || !window.Promise) {
    alert('Your browser is not supported. Please use a modern browser.');
    return;
  }

  // Initialize the quiz application
  window.quizApp = new QuizApp();
  
  // Global error handling
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    UIComponents.showError('Application Error', 'An unexpected error occurred. Please refresh the page and try again.');
  });

  // Unhandled promise rejection handling
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    UIComponents.showError('Network Error', 'A network error occurred. Please check your connection and try again.');
    event.preventDefault();
  });
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QuizApp, QuizState, Utils, ApiService, UIComponents };
}
