/**
 * App - کنترلر اصلی برنامه (نسخه اصلاح‌شده)
 * @version 2.1.0
 */
class App {
    constructor() {
        this.examEngine = null;
        this.currentView = 'registration';
        this.init();
    }

    async init() {
        this.examEngine = new ExamEngine(questionBank, storageManager);
        this.checkOngoingExam();
        this.bindEvents();
        this.setupTheme();
        this.showRegistrationPanel();
        this.loadCompanySettingsToHeader();
    }

    loadCompanySettingsToHeader() {
        const settings = this.getCompanySettings();
        const savedLogo = localStorage.getItem('company_logo');
        const logoImg = document.getElementById('companyLogo');
        const titleH1 = document.getElementById('companyNameHeader');
        const badge = document.getElementById('companyBadge');
        if (savedLogo && logoImg) {
            logoImg.src = savedLogo;
            logoImg.style.display = 'block';
        }
        if (titleH1 && settings.companyName) {
            titleH1.textContent = settings.companyName;
        }
        if (badge && settings.examSubtitle) {
            badge.textContent = settings.examSubtitle;
        }
        if (settings.themeColor) {
            document.documentElement.style.setProperty('--accent-primary', settings.themeColor);
        }
    }

    getCompanySettings() {
        const saved = localStorage.getItem('company_settings');
        if (saved) return JSON.parse(saved);
        return {
            companyName: 'SmartExam',
            examTitle: 'سامانه آزمون سازمانی',
            examSubtitle: 'Enterprise Lite',
            themeColor: '#00d4ff',
            certificateTitle: 'کارنامه رسمی آزمون',
            certificateMessage: ''
        };
    }

    checkOngoingExam() {
        if (this.examEngine.hasOngoingExam()) {
            const resume = confirm('آزمون ناتمامی وجود دارد. آیا می‌خواهید ادامه دهید؟');
            if (resume) {
                this.examEngine.resumeExam();
                this.startExamUI();
            } else {
                this.examEngine.clearExam();
            }
        }
    }

    bindEvents() {
        const regForm = document.getElementById('registrationForm');
        if (regForm) regForm.addEventListener('submit', (e) => this.handleRegistration(e));

        const prevBtn = document.getElementById('prevBtn');
        if (prevBtn) prevBtn.addEventListener('click', () => this.prevQuestion());

        const nextBtn = document.getElementById('nextBtn');
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextQuestion());

        const submitBtn = document.getElementById('submitExamBtn');
        if (submitBtn) submitBtn.addEventListener('click', () => this.submitExam());

        const newExamBtn = document.getElementById('newExamBtn');
        if (newExamBtn) newExamBtn.addEventListener('click', () => this.resetToRegistration());

        const leaderboardBtn = document.getElementById('viewLeaderboardBtn');
        if (leaderboardBtn) leaderboardBtn.addEventListener('click', () => this.showLeaderboard());
    }

    async handleRegistration(e) {
        e.preventDefault();
        const userData = {
            fullName: document.getElementById('fullName').value,
            personnelCode: document.getElementById('personnelCode').value,
            department: document.getElementById('department').value,
            workplace: document.getElementById('workplace').value
        };

        const registration = userManager.registerUser(userData);
        if (!registration.success) {
            alert(registration.message);
            return;
        }

        const examStart = await this.examEngine.startNewExam(userData);
        if (examStart.success) {
            this.startExamUI();
        } else {
            alert('خطا در شروع آزمون: ' + examStart.message);
        }
    }

    startExamUI() {
        this.showExamPanel();
        this.loadCurrentQuestion();
        this.startTimerUpdate();
        this.updateProgress();
    }

    loadCurrentQuestion() {
        const current = this.examEngine.getCurrentQuestion();
        if (!current) return;

        const container = document.getElementById('questionContainer');
        const counter = document.getElementById('questionCounter');

        if (counter) {
            counter.textContent = `سوال ${current.index + 1} از ${current.total}`;
        }

        const question = current.question;
        let html = `
            <div class="question-text">
                <strong>${question.question}</strong>
            </div>
            <div class="options-list">
        `;

        question.options.forEach((option, idx) => {
            const isSelected = current.savedAnswer === idx;
            html += `
                <div class="option-item ${isSelected ? 'selected' : ''}" data-option-index="${idx}">
                    <input type="radio" name="answer" value="${idx}" ${isSelected ? 'checked' : ''} class="option-radio">
                    <label>${option}</label>
                </div>
            `;
        });

        html += `</div>`;
        container.innerHTML = html;

        document.querySelectorAll('.option-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const radio = item.querySelector('input[type="radio"]');
                if (radio) {
                    radio.checked = true;
                    this.saveCurrentAnswer(parseInt(item.dataset.optionIndex));
                }
            });

            const radio = item.querySelector('input[type="radio"]');
            if (radio) {
                radio.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        this.saveCurrentAnswer(parseInt(item.dataset.optionIndex));
                    }
                });
            }
        });
    }

    saveCurrentAnswer(answerIndex) {
        this.examEngine.saveAnswer(answerIndex);
        this.updateProgress();
        this.highlightCurrentOption(answerIndex);
    }

    highlightCurrentOption(answerIndex) {
        document.querySelectorAll('.option-item').forEach((item, idx) => {
            if (idx === answerIndex) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }

    prevQuestion() {
        if (this.examEngine.prevQuestion()) {
            this.loadCurrentQuestion();
        }
    }

    nextQuestion() {
        if (this.examEngine.nextQuestion()) {
            this.loadCurrentQuestion();
        } else {
            const progress = this.examEngine.getProgress();
            if (progress.answered === progress.total) {
                this.submitExam();
            } else {
                alert('لطفاً به تمام سوالات پاسخ دهید.');
            }
        }
    }

    async submitExam() {
        const confirmed = confirm('آیا از پایان آزمون اطمینان دارید؟');
        if (!confirmed) return;

        const result = await this.examEngine.submitExam();
        if (result.success) {
            this.showResultPanel(result.result);
        } else {
            alert('خطا در ثبت آزمون: ' + result.message);
        }
    }

    showResultPanel(result) {
        this.currentView = 'result';
        document.getElementById('registrationPanel').style.display = 'none';
        document.getElementById('examPanel').style.display = 'none';
        document.getElementById('resultPanel').style.display = 'block';

        const container = document.getElementById('resultContent');
        const statusClass = result.passed ? 'success' : 'danger';
        const statusText = result.passed ? '✅ قبول' : '❌ مردود';

        container.innerHTML = `
            <div class="result-summary">
                <h3 class="${statusClass}">${statusText}</h3>
                <div class="result-details">
                    <p><strong>نام:</strong> ${result.fullName}</p>
                    <p><strong>کد پرسنلی:</strong> ${result.personnelCode}</p>
                    <p><strong>واحد:</strong> ${result.department}</p>
                    <p><strong>نمره نهایی:</strong> ${result.score} از ${result.totalQuestions}</p>
                    <p><strong>درصد:</strong> ${result.percent}%</p>
                    <p><strong>مدت زمان:</strong> ${Math.floor(result.duration / 60)} دقیقه و ${result.duration % 60} ثانیه</p>
                </div>
            </div>
        `;
    }

    showRegistrationPanel() {
        this.currentView = 'registration';
        document.getElementById('registrationPanel').style.display = 'block';
        document.getElementById('examPanel').style.display = 'none';
        document.getElementById('resultPanel').style.display = 'none';
    }

    showExamPanel() {
        this.currentView = 'exam';
        document.getElementById('registrationPanel').style.display = 'none';
        document.getElementById('examPanel').style.display = 'block';
        document.getElementById('resultPanel').style.display = 'none';
    }

    startTimerUpdate() {
        const timerDisplay = document.getElementById('timerDisplay');
        if (!timerDisplay) return;
        const updateTimer = () => {
            if (this.examEngine.examStarted) {
                timerDisplay.textContent = `⏱ زمان باقیمانده: ${this.examEngine.getFormattedTime()}`;
                requestAnimationFrame(updateTimer);
            }
        };
        updateTimer();
    }

    updateProgress() {
        const progress = this.examEngine.getProgress();
        const progressBar = document.getElementById('examProgress');
        if (progressBar) {
            progressBar.style.width = `${Math.round(progress.percent)}%`;
            progressBar.textContent = `${Math.round(progress.percent)}%`;
        }
    }

    resetToRegistration() {
        this.examEngine.clearExam();
        this.showRegistrationPanel();
        document.getElementById('registrationForm').reset();
    }

    showLeaderboard() {
        const leaderboard = resultManager.getLeaderboard();
        let message = '🏆 جدول رتبه‌بندی\n\n';
        leaderboard.slice(0, 10).forEach(entry => {
            message += `${entry.rank}. ${entry.fullName} - ${entry.percent}% ${entry.passed ? '✓' : '✗'}\n`;
        });
        alert(message);
    }

    setupTheme() {
        const themeBtn = document.getElementById('themeToggleBtn');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                const html = document.documentElement;
                const currentTheme = html.getAttribute('data-theme');
                if (currentTheme === 'light') {
                    html.removeAttribute('data-theme');
                    themeBtn.textContent = '🌙';
                } else {
                    html.setAttribute('data-theme', 'light');
                    themeBtn.textContent = '☀️';
                }
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});