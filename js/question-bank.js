/**
 * Question Bank - مدیریت بانک سوالات (نسخه نهایی با همگام‌سازی)
 * @version 2.1.0
 */

class QuestionBank {
    constructor(storageManager) {
        this.storage = storageManager;
        this.questions = [];
        this.categories = ['HSE', 'Technical', 'Management', 'General'];
        this.levels = ['easy', 'medium', 'hard'];
        this.loadQuestions();
    }

    async loadQuestions() {
        // دریافت سوالات از storage (که از Supabase می‌خواند)
        const saved = await this.storage.getQuestions();
        if (saved && saved.length > 0) {
            this.questions = saved;
            // حذف شماره‌های اضافی از سوالات موجود
            this.questions = this.questions.map(q => {
                q.question = this.cleanQuestionText(q.question);
                return q;
            });
            this.saveQuestions();
        } else {
            this.initSampleQuestions();
        }
    }

    cleanQuestionText(text) {
        return text.replace(/\s*\(سوال\s*شماره\s*\d+\)/gi, '').trim();
    }

    initSampleQuestions() {
        this.questions = [];
        const sampleData = [
            { category: 'HSE', level: 'easy', question: 'هدف استفاده از کلاه ایمنی چیست؟', options: ['ایمنی', 'سرعت', 'زیبایی', 'هیچکدام'], correct: 0 },
            { category: 'HSE', level: 'easy', question: 'در هنگام آتش‌سوزی ابتدا چه اقدامی باید انجام داد؟', options: ['خاموش کردن آتش', 'اطلاع به مسئولین', 'فرار از محل', 'آب پاشی'], correct: 1 },
            { category: 'HSE', level: 'medium', question: 'کپسول آتش‌نشانی CO2 برای چه نوع آتش‌سوزی مناسبت است؟', options: ['چوب و کاغذ', 'الکتریکی و مایعات', 'فلزات', 'همه موارد'], correct: 1 },
            { category: 'Technical', level: 'easy', question: 'سیستم عامل Windows توسط کدام شرکت تولید می‌شود؟', options: ['Apple', 'Google', 'Microsoft', 'Linux'], correct: 2 },
            { category: 'Technical', level: 'medium', question: 'پروتکل HTTP بر روی کدام لایه مدل OSI کار می‌کند؟', options: ['لایه فیزیکی', 'لایه شبکه', 'لایه انتقال', 'لایه کاربردی'], correct: 3 },
            { category: 'Management', level: 'easy', question: 'مدیریت مؤثر بر چه اساسی استوار است؟', options: ['کنترل شدید', 'برنامه‌ریزی و هماهنگی', 'اجبار کارکنان', 'تمرکز قدرت'], correct: 1 },
            { category: 'General', level: 'easy', question: 'پایتخت ایران کدام شهر است؟', options: ['مشهد', 'اصفهان', 'تبریز', 'تهران'], correct: 3 }
        ];

        for (let i = 1; i <= 500; i++) {
            const template = sampleData[i % sampleData.length];
            this.questions.push({
                id: i,
                category: template.category,
                level: i % 3 === 0 ? 'hard' : (i % 2 === 0 ? 'medium' : 'easy'),
                question: template.question,
                options: [...template.options],
                correct: template.correct
            });
        }
        this.saveQuestions();
    }

    async saveQuestions() {
        await this.storage.saveQuestions(this.questions);
    }

    getAllQuestions() {
        return this.questions;
    }

    getQuestionById(id) {
        return this.questions.find(q => q.id === parseInt(id));
    }

    getQuestionsByCategory(category) {
        if (category === 'all') return this.questions;
        return this.questions.filter(q => q.category === category);
    }

    getRandomQuestions(count, shuffle = true, categories = null) {
        let selected = [];
        
        if (categories && Array.isArray(categories) && categories.length > 0) {
            const perCategory = Math.floor(count / categories.length);
            const remainder = count % categories.length;
            let total = 0;
            for (let i = 0; i < categories.length; i++) {
                const cat = categories[i];
                const catQuestions = this.questions.filter(q => q.category === cat);
                const take = perCategory + (i < remainder ? 1 : 0);
                const shuffled = this.shuffleArray([...catQuestions]);
                selected = selected.concat(shuffled.slice(0, take));
                total += take;
            }
            if (total < count) {
                const remaining = this.questions.filter(q => !selected.includes(q));
                const shuffledRemaining = this.shuffleArray([...remaining]);
                selected = selected.concat(shuffledRemaining.slice(0, count - total));
            }
        } else {
            const shuffledAll = this.shuffleArray([...this.questions]);
            selected = shuffledAll.slice(0, count);
        }

        if (shuffle) {
            selected = this.shuffleArray(selected);
            selected = selected.map(q => this.shuffleQuestionOptions(q));
        }
        return selected;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    shuffleQuestionOptions(question) {
        const options = [...question.options];
        const correctAnswer = question.options[question.correct];
        for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
        }
        const newCorrectIndex = options.indexOf(correctAnswer);
        return {
            ...question,
            options: options,
            correct: newCorrectIndex
        };
    }

    async addQuestion(questionData) {
        const newId = this.questions.length > 0 ? Math.max(...this.questions.map(q => q.id)) + 1 : 1;
        questionData.question = this.cleanQuestionText(questionData.question);
        this.questions.push({ id: newId, ...questionData });
        await this.saveQuestions();
        return true;
    }

    async updateQuestion(id, updatedData) {
        const index = this.questions.findIndex(q => q.id === parseInt(id));
        if (index !== -1) {
            updatedData.question = this.cleanQuestionText(updatedData.question);
            this.questions[index] = { ...this.questions[index], ...updatedData, id: parseInt(id) };
            await this.saveQuestions();
            return true;
        }
        return false;
    }

    async deleteQuestion(id) {
        const index = this.questions.findIndex(q => q.id === parseInt(id));
        if (index !== -1) {
            this.questions.splice(index, 1);
            await this.saveQuestions();
            return true;
        }
        return false;
    }

    async deleteAllQuestions() {
        if (confirm('⚠️ آیا از حذف تمام سوالات اطمینان دارید؟ این عمل غیرقابل بازگشت است.')) {
            this.questions = [];
            await this.saveQuestions();
            return true;
        }
        return false;
    }

    searchQuestions(searchTerm) {
        const term = searchTerm.toLowerCase();
        return this.questions.filter(q =>
            q.question.toLowerCase().includes(term) ||
            q.category.toLowerCase().includes(term)
        );
    }

    async importQuestions(questions) {
        if (!Array.isArray(questions)) return false;
        const isValid = questions.every(q =>
            q.id && q.category && q.level && q.question &&
            q.options && Array.isArray(q.options) &&
            typeof q.correct !== 'undefined'
        );
        if (isValid) {
            questions = questions.map(q => {
                q.question = this.cleanQuestionText(q.question);
                return q;
            });
            this.questions = questions;
            await this.saveQuestions();
            return true;
        }
        return false;
    }

    exportQuestions() {
        return JSON.stringify(this.questions, null, 2);
    }

    getCategories() {
        const cats = this.questions.map(q => q.category);
        return [...new Set(cats)];
    }

    // ===== همگام‌سازی دستی با Supabase =====
    async syncQuestions() {
        await this.storage.syncQuestions();
        await this.loadQuestions();
    }
}

const questionBank = new QuestionBank(storageManager);