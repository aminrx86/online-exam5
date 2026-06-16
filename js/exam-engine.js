/**
 * Exam Engine - موتور آزمون (نسخه با بارگذاری تازه از دیتابیس)
 * @version 2.1.0
 */
class ExamEngine {
    constructor(questionBank, storageManager) {
        this.questionBank = questionBank;
        this.storage = storageManager;
        this.currentExam = null;
        this.questions = [];
        this.currentIndex = 0;
        this.answers = [];
        this.startTime = null;
        this.timerInterval = null;
        this.examId = null;
        this.userInfo = null;
        this.isExamActive = false;
        this.timeLeft = 0;
        this.settings = this.storage.getSettings() || { duration: 30, questionsPerExam: 30 };
        this.examStarted = false;
    }

    // ===== شروع آزمون (با دریافت تازه از دیتابیس) =====
    async startExam(userInfo) {
        this.userInfo = userInfo;
        this.examId = this.generateExamId();
        this.startTime = new Date();
        this.answers = [];
        this.currentIndex = 0;
        this.isExamActive = true;
        this.examStarted = true;

        const count = this.settings.questionsPerExam || 30;
        
        // ===== دریافت سوالات تازه از دیتابیس (نه از کش) =====
        await this.questionBank.loadQuestions();
        const categories = this.settings.selectedCategories || ['HSE', 'Technical', 'Management', 'General'];
        this.questions = this.questionBank.getRandomQuestions(count, true, categories);

        this.currentExam = {
            examId: this.examId,
            userInfo: userInfo,
            questions: this.questions,
            answers: [],
            startTime: this.startTime,
            currentIndex: 0,
            isCompleted: false
        };
        this.storage.saveCurrentExam(this.currentExam);

        this.timeLeft = (this.settings.duration || 30) * 60;
        this.startTimer();

        return {
            examId: this.examId,
            questions: this.questions,
            total: this.questions.length,
            duration: this.settings.duration || 30
        };
    }

    generateExamId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    async startNewExam(userData) {
        try {
            const result = await this.startExam(userData);
            return { success: true, data: result };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            if (this.timeLeft <= 0) {
                this.finishExam('timeout');
            }
        }, 1000);
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        const display = document.getElementById('timerDisplay');
        if (display) {
            display.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            if (this.timeLeft < 60) display.style.color = '#ff4444';
        }
    }

    getFormattedTime() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    saveAnswer(answerIndex) {
        if (!this.isExamActive) return false;
        const question = this.questions[this.currentIndex];
        if (!question) return false;

        const isCorrect = answerIndex === question.correct;
        this.answers[this.currentIndex] = {
            questionId: question.id,
            selected: answerIndex,
            correct: question.correct,
            isCorrect: isCorrect
        };

        this.currentExam.answers = this.answers;
        this.currentExam.currentIndex = this.currentIndex + 1;
        this.storage.saveCurrentExam(this.currentExam);
        return true;
    }

    getCurrentQuestion() {
        if (!this.isExamActive || this.currentIndex >= this.questions.length) {
            return null;
        }
        const question = this.questions[this.currentIndex];
        return {
            index: this.currentIndex,
            total: this.questions.length,
            question: question,
            savedAnswer: this.answers[this.currentIndex]?.selected ?? null
        };
    }

    nextQuestion() {
        if (this.currentIndex < this.questions.length - 1) {
            this.currentIndex++;
            return true;
        }
        return false;
    }

    prevQuestion() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            return true;
        }
        return false;
    }

    getProgress() {
        const answered = this.answers.filter(a => a !== undefined && a !== null).length;
        const total = this.questions.length;
        return {
            answered: answered,
            total: total,
            percent: total > 0 ? (answered / total) * 100 : 0
        };
    }

    async submitExam() {
        if (!this.isExamActive) return { success: false, message: 'آزمون فعال نیست' };
        const result = await this.finishExam('completed');
        return { success: true, result: result };
    }

    async finishExam(reason = 'completed') {
        if (!this.isExamActive) return null;
        this.isExamActive = false;
        this.examStarted = false;
        if (this.timerInterval) clearInterval(this.timerInterval);

        const endTime = new Date();
        const duration = Math.floor((endTime - this.startTime) / 1000);

        let correctCount = 0;
        this.answers.forEach(a => { if (a && a.isCorrect) correctCount++; });

        const percent = (correctCount / this.questions.length) * 100;
        const passed = percent >= (this.settings.passPercent || 70);

        const result = {
            examId: this.examId,
            fullName: this.userInfo.fullName,
            personnelCode: this.userInfo.personnelCode,
            department: this.userInfo.department || '',
            workplace: this.userInfo.workplace || '',
            score: correctCount,
            totalQuestions: this.questions.length,
            percent: parseFloat(percent.toFixed(2)),
            passed: passed,
            duration: duration,
            startTime: this.startTime,
            endTime: endTime,
            answers: this.answers
        };

        await this.storage.saveResult(result);
        this.storage.clearCurrentExam();
        this.currentExam = null;
        this.questions = [];
        this.answers = [];
        this.currentIndex = 0;

        return result;
    }

    resumeExam() {
        const saved = this.storage.getCurrentExam();
        if (!saved || saved.isCompleted) return null;

        this.currentExam = saved;
        this.examId = saved.examId;
        this.userInfo = saved.userInfo;
        this.questions = saved.questions;
        this.answers = saved.answers || [];
        this.startTime = new Date(saved.startTime);
        this.currentIndex = saved.currentIndex || 0;
        this.isExamActive = true;
        this.examStarted = true;

        const elapsed = Math.floor((new Date() - this.startTime) / 1000);
        const totalTime = (this.settings.duration || 30) * 60;
        this.timeLeft = Math.max(0, totalTime - elapsed);
        this.startTimer();

        return {
            examId: this.examId,
            questions: this.questions,
            currentIndex: this.currentIndex,
            userInfo: this.userInfo
        };
    }

    clearExam() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.isExamActive = false;
        this.examStarted = false;
        this.storage.clearCurrentExam();
        this.currentExam = null;
        this.questions = [];
        this.answers = [];
        this.currentIndex = 0;
        this.timeLeft = 0;
    }

    hasOngoingExam() {
        return this.isExamActive && this.currentExam !== null;
    }

    getCurrentState() {
        return {
            examId: this.examId,
            currentIndex: this.currentIndex,
            totalQuestions: this.questions.length,
            answers: this.answers,
            timeLeft: this.timeLeft,
            isActive: this.isExamActive
        };
    }
}

const examEngine = new ExamEngine(questionBank, storageManager);