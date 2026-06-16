/**
 * Storage Manager - مدیریت ذخیره‌سازی با Supabase (نسخه نهایی با همگام‌سازی سوالات)
 * @version 3.1.0
 */
class StorageManager {
    constructor() {
        this.SUPABASE_URL = 'https://ajikhmfbufnnpubnmenp.supabase.co';
        this.SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqaWtobWZidWZubnB1Ym5tZW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NzkyNjksImV4cCI6MjA5NzE1NTI2OX0.DahfrvuG_N881ML9hnvQie2ufokv9AhEF0DHe1qj6o4';

        if (typeof supabase !== 'undefined') {
            this.supabase = supabase.createClient(this.SUPABASE_URL, this.SUPABASE_KEY);
            console.log('✅ اتصال به Supabase برقرار شد');
        } else {
            console.warn('⚠️ کتابخانه Supabase پیدا نشد');
            this.supabase = null;
        }

        this.STORAGE_KEYS = {
            QUESTIONS: 'smartexam_questions',
            SETTINGS: 'smartexam_settings',
            CURRENT_EXAM: 'smartexam_current_exam'
        };

        this.initSettings();
        // همگام‌سازی اولیه سوالات (اجرای غیرهمگام)
        this.syncQuestions();
    }

    initSettings() {
        if (!this.getSettings()) {
            this.saveSettings({ duration: 30, passPercent: 70, questionsPerExam: 30, shuffleQuestions: true, shuffleAnswers: true });
        }
    }

    saveSettings(settings) {
        settings.lastUpdated = new Date().toISOString();
        return this.save(this.STORAGE_KEYS.SETTINGS, settings);
    }

    getSettings() {
        return this.get(this.STORAGE_KEYS.SETTINGS);
    }

    save(key, data) {
        try { localStorage.setItem(key, JSON.stringify(data)); return true; } 
        catch (e) { console.error(e); return false; }
    }

    get(key) {
        try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : null; } 
        catch (e) { return null; }
    }

    remove(key) { localStorage.removeItem(key); }

    // ==================== سوالات (همیشه از Supabase) ====================
    async getQuestions() {
        // اگر Supabase در دسترس است، از آن بخوان
        if (this.supabase) {
            try {
                const { data, error } = await this.supabase
                    .from('questions')
                    .select('*')
                    .order('question_id', { ascending: true });
                if (error) throw error;
                if (data && data.length > 0) {
                    const formatted = data.map(q => ({
                        id: q.question_id,
                        category: q.category,
                        level: q.level,
                        question: q.question,
                        options: q.options,
                        correct: q.correct
                    }));
                    // ذخیره در localStorage برای دسترسی آفلاین
                    this.save(this.STORAGE_KEYS.QUESTIONS, formatted);
                    return formatted;
                }
            } catch (error) {
                console.warn('⚠️ خطا در دریافت سوالات از Supabase:', error.message);
            }
        }
        // در صورت عدم دسترسی به Supabase، از localStorage بخوان
        const local = this.get(this.STORAGE_KEYS.QUESTIONS);
        if (local && local.length > 0) return local;
        return [];
    }

    // همگام‌سازی سوالات (برای استفاده در پنل مدیریت)
    async syncQuestions() {
        if (!this.supabase) return;
        try {
            const { data, error } = await this.supabase
                .from('questions')
                .select('*')
                .order('question_id', { ascending: true });
            if (error) throw error;
            if (data && data.length > 0) {
                const formatted = data.map(q => ({
                    id: q.question_id,
                    category: q.category,
                    level: q.level,
                    question: q.question,
                    options: q.options,
                    correct: q.correct
                }));
                this.save(this.STORAGE_KEYS.QUESTIONS, formatted);
                console.log(`✅ ${formatted.length} سوال از Supabase همگام‌سازی شد`);
            }
        } catch (error) {
            console.warn('⚠️ خطا در همگام‌سازی سوالات:', error.message);
        }
    }

    async saveQuestions(questions) {
        // ذخیره در localStorage
        this.save(this.STORAGE_KEYS.QUESTIONS, questions);
        // ارسال به Supabase
        if (this.supabase) {
            try {
                await this.supabase.from('questions').delete().neq('id', 0);
                const data = questions.map(q => ({
                    question_id: q.id,
                    category: q.category,
                    level: q.level,
                    question: q.question,
                    options: q.options,
                    correct: q.correct
                }));
                await this.supabase.from('questions').insert(data);
                console.log('✅ سوالات با Supabase همگام‌سازی شدند');
            } catch (error) {
                console.warn('⚠️ خطا در همگام‌سازی سوالات با Supabase:', error.message);
            }
        }
        return true;
    }

    // ==================== نتایج (همیشه از Supabase) ====================
    async saveResult(result) {
        if (!this.supabase) return this.saveResultLocal(result);
        try {
            const { error } = await this.supabase.from('results').insert({
                exam_id: result.examId,
                full_name: result.fullName,
                personnel_code: result.personnelCode,
                department: result.department || '',
                workplace: result.workplace || '',
                score: result.score,
                total_questions: result.totalQuestions,
                percent: result.percent,
                passed: result.passed,
                duration: result.duration,
                start_time: new Date(result.startTime).toISOString(),
                end_time: new Date(result.endTime).toISOString(),
                answers: result.answers || []
            });
            if (error) throw error;
            console.log('✅ نتیجه در دیتابیس ابری ذخیره شد');
            return true;
        } catch (e) {
            console.warn('⚠️ ذخیره در ابر انجام نشد، ذخیره محلی:', e.message);
            return this.saveResultLocal(result);
        }
    }

    saveResultLocal(result) {
        const list = this.getResultsLocal();
        list.push(result);
        return this.save('smartexam_results_local', list);
    }

    getResultsLocal() {
        return this.get('smartexam_results_local') || [];
    }

    async getResults() {
        if (!this.supabase) {
            console.warn('⚠️ Supabase در دسترس نیست، از localStorage استفاده می‌شود');
            return this.getResultsLocal();
        }
        try {
            const { data, error } = await this.supabase
                .from('results')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            if (!data || data.length === 0) {
                return this.getResultsLocal();
            }
            const formatted = data.map(r => ({
                examId: r.exam_id,
                fullName: r.full_name,
                personnelCode: r.personnel_code,
                department: r.department,
                workplace: r.workplace,
                score: r.score,
                totalQuestions: r.total_questions,
                percent: parseFloat(r.percent),
                passed: r.passed,
                duration: r.duration,
                startTime: r.start_time,
                endTime: r.end_time,
                answers: r.answers || []
            }));
            this.save('smartexam_results_local', formatted);
            return formatted;
        } catch (error) {
            console.warn('⚠️ خطا در دریافت نتایج از Supabase:', error.message);
            return this.getResultsLocal();
        }
    }

    async syncResultsFromSupabase() {
        if (!this.supabase) return this.getResultsLocal();
        try {
            const results = await this.getResults();
            if (results && results.length > 0) {
                this.save('smartexam_results_local', results);
                console.log(`✅ ${results.length} نتیجه از Supabase همگام‌سازی شد`);
            }
            return results;
        } catch (e) {
            console.warn('⚠️ خطا در همگام‌سازی نتایج:', e.message);
            return this.getResultsLocal();
        }
    }

    async deleteResult(examId) {
        if (!this.supabase) return this.deleteResultLocal(examId);
        try {
            await this.supabase.from('results').delete().eq('exam_id', examId);
            return true;
        } catch (e) {
            return this.deleteResultLocal(examId);
        }
    }

    deleteResultLocal(examId) {
        const list = this.getResultsLocal().filter(r => r.examId !== examId);
        return this.save('smartexam_results_local', list);
    }

    async getResultsStats() {
        const results = await this.getResults();
        if (results.length === 0) {
            return { totalParticipants: 0, averageScore: 0, highestScore: 0, lowestScore: 0, passRate: 0 };
        }
        const scores = results.map(r => r.percent);
        const passed = results.filter(r => r.passed).length;
        return {
            totalParticipants: results.length,
            averageScore: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2),
            highestScore: Math.max(...scores),
            lowestScore: Math.min(...scores),
            passRate: ((passed / results.length) * 100).toFixed(2)
        };
    }

    // ==================== آزمون جاری ====================
    saveCurrentExam(data) { return this.save(this.STORAGE_KEYS.CURRENT_EXAM, data); }
    getCurrentExam() { return this.get(this.STORAGE_KEYS.CURRENT_EXAM); }
    clearCurrentExam() { this.remove(this.STORAGE_KEYS.CURRENT_EXAM); }
}

const storageManager = new StorageManager();