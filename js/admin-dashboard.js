/**
 * Admin Dashboard - پنل مدیریت (نسخه کامل با همگام‌سازی)
 * @version 5.0.0
 */

class AdminDashboard {
    constructor(questionBank, resultManager, storageManager) {
        this.questionBank = questionBank;
        this.resultManager = resultManager;
        this.storage = storageManager;
        this.currentTab = 'questions';
        this.isAuthenticated = false;
        this.ADMIN_PASSWORD = 'admin123';

        this.bindEvents();
        this.checkAuth();

        if (this.isAuthenticated) {
            this.init();
        } else {
            console.warn('دسترسی غیرمجاز - لاگین الزامی است');
            this.showLoginOverlay();
        }
    }

    // ========== احراز هویت ==========
    checkAuth() {
        const token = sessionStorage.getItem('admin_token');
        if (token === 'authenticated') {
            this.isAuthenticated = true;
            this.hideLoginOverlay();
            document.getElementById('logoutBtn').style.display = 'inline-block';
        } else {
            this.isAuthenticated = false;
            this.showLoginOverlay();
            document.getElementById('logoutBtn').style.display = 'none';
        }
    }

    showLoginOverlay() {
        const overlay = document.getElementById('loginOverlay');
        if (overlay) overlay.classList.add('active');
    }

    hideLoginOverlay() {
        const overlay = document.getElementById('loginOverlay');
        if (overlay) overlay.classList.remove('active');
    }

    handleLogin() {
        const passwordInput = document.getElementById('loginPassword');
        const errorDiv = document.getElementById('loginError');
        const password = passwordInput?.value || '';

        if (password === this.ADMIN_PASSWORD) {
            sessionStorage.setItem('admin_token', 'authenticated');
            this.isAuthenticated = true;
            this.hideLoginOverlay();
            document.getElementById('logoutBtn').style.display = 'inline-block';
            if (errorDiv) errorDiv.style.display = 'none';
            passwordInput.value = '';
            this.loadQuestionsTab();
            this.loadResultsTab();
            this.loadReportsTab();
        } else {
            if (errorDiv) errorDiv.style.display = 'block';
            passwordInput.value = '';
            passwordInput.focus();
        }
    }

    handleLogout() {
        sessionStorage.removeItem('admin_token');
        this.isAuthenticated = false;
        document.getElementById('logoutBtn').style.display = 'none';
        this.showLoginOverlay();
        document.getElementById('questionsList').innerHTML = '';
        document.getElementById('resultsTable').innerHTML = '';
        document.getElementById('reportContent').innerHTML = '';
        document.getElementById('totalParticipants').textContent = '0';
        document.getElementById('avgScore').textContent = '0%';
        document.getElementById('highestScore').textContent = '0%';
        document.getElementById('lowestScore').textContent = '0%';
        document.getElementById('passRate').textContent = '0%';
    }

    // ========== مقداردهی اولیه ==========
    init() {
        console.log('Admin Dashboard Initialized');
        this.loadQuestionsTab();
        this.loadResultsTab();
        this.loadReportsTab();
        this.setupTheme();
        this.loadCustomBackground();
    }

    // ========== رویدادها ==========
    bindEvents() {
        // لاگین
        document.getElementById('loginBtn')?.addEventListener('click', () => this.handleLogin());
        document.getElementById('loginPassword')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.handleLogout());

        // تب‌ها
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.getAttribute('data-tab');
                this.switchTab(tabId);
            });
        });

        // سوالات
        document.getElementById('addQuestionBtn')?.addEventListener('click', () => this.showQuestionModal());
        document.getElementById('importJsonBtn')?.addEventListener('click', () => this.importQuestions());
        document.getElementById('exportJsonBtn')?.addEventListener('click', () => this.exportQuestions());
        document.getElementById('bgUploadBtn')?.addEventListener('click', () => this.showBackgroundUploader());

        // ===== دکمه حذف همه سوالات =====
        document.getElementById('deleteAllQuestionsBtn')?.addEventListener('click', async () => {
            if (await this.questionBank.deleteAllQuestions()) {
                this.loadQuestionsTab();
                alert('✅ همه سوالات با موفقیت حذف شدند');
            }
        });

        // ===== دکمه همگام‌سازی سوالات از دیتابیس (مرحله ۳) =====
        document.getElementById('syncQuestionsBtn')?.addEventListener('click', async () => {
            if (!this.isAuthenticated) return;
            const btn = document.getElementById('syncQuestionsBtn');
            const originalText = btn.textContent;
            btn.textContent = '⏳ در حال همگام‌سازی...';
            btn.disabled = true;
            try {
                await this.questionBank.syncQuestions();
                this.loadQuestionsTab();
                alert('✅ سوالات با موفقیت از دیتابیس همگام‌سازی شدند');
            } catch (error) {
                alert('❌ خطا در همگام‌سازی: ' + error.message);
            } finally {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });

        // جستجو
        document.getElementById('searchQuestion')?.addEventListener('input', () => this.filterQuestions());
        document.getElementById('categoryFilter')?.addEventListener('change', () => this.filterQuestions());

        // گزارشات
        document.getElementById('exportCsvBtn')?.addEventListener('click', () => this.exportToCSV());
        document.getElementById('exportExcelBtn')?.addEventListener('click', () => this.exportToExcel());
        document.getElementById('printReportBtn')?.addEventListener('click', () => this.printReport());
        document.getElementById('generateCertificateBtn')?.addEventListener('click', () => this.generateBulkCertificates());

        // دکمه Refresh نتایج
        document.getElementById('refreshResultsBtn')?.addEventListener('click', () => this.refreshResults());

        // مودال
        document.querySelector('.close')?.addEventListener('click', () => {
            document.getElementById('questionModal').style.display = 'none';
        });
        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('questionModal')) {
                document.getElementById('questionModal').style.display = 'none';
            }
        });
        document.getElementById('questionForm')?.addEventListener('submit', (e) => this.saveQuestion(e));
    }

    // ========== مدیریت تب‌ها ==========
    switchTab(tabId) {
        if (!this.isAuthenticated) return;
        this.currentTab = tabId;
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabId}Tab`);
        });
        if (tabId === 'questions') this.loadQuestionsTab();
        else if (tabId === 'results') this.loadResultsTab();
        else if (tabId === 'reports') this.loadReportsTab();
    }

    // ========== سوالات ==========
    async loadQuestionsTab() {
        if (!this.isAuthenticated) return;
        const questions = this.questionBank.getAllQuestions();
        this.renderQuestionsList(questions);
    }

    renderQuestionsList(questions) {
        const container = document.getElementById('questionsList');
        if (!container) return;
        if (!questions || questions.length === 0) {
            container.innerHTML = '<div class="no-data">📭 هیچ سوالی یافت نشد</div>';
            return;
        }
        let html = '';
        questions.forEach(q => {
            html += `
                <div class="question-card" data-id="${q.id}">
                    <div class="question-info">
                        <strong>#${q.id}</strong> - 
                        <span style="color: var(--accent-primary);">${q.category}</span> - 
                        <span>${this.getLevelText(q.level)}</span>
                        <p style="margin-top: 8px;">${q.question.length > 100 ? q.question.substring(0, 100) + '...' : q.question}</p>
                    </div>
                    <div class="question-actions">
                        <button class="btn-secondary edit-question" data-id="${q.id}" style="padding: 5px 12px;">✏️ ویرایش</button>
                        <button class="btn-danger delete-question" data-id="${q.id}" style="padding: 5px 12px;">🗑️ حذف</button>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
        container.querySelectorAll('.edit-question').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.getAttribute('data-id'));
                this.editQuestion(id);
            });
        });
        container.querySelectorAll('.delete-question').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.getAttribute('data-id'));
                this.deleteQuestion(id);
            });
        });
    }

    getLevelText(level) {
        const levels = { 'easy': '🟢 آسان', 'medium': '🟡 متوسط', 'hard': '🔴 سخت' };
        return levels[level] || level;
    }

    filterQuestions() {
        if (!this.isAuthenticated) return;
        const searchTerm = document.getElementById('searchQuestion')?.value || '';
        const category = document.getElementById('categoryFilter')?.value || 'all';
        let filtered = this.questionBank.getAllQuestions();
        if (searchTerm) filtered = filtered.filter(q => q.question.toLowerCase().includes(searchTerm.toLowerCase()));
        if (category !== 'all') filtered = filtered.filter(q => q.category === category);
        this.renderQuestionsList(filtered);
    }

    showQuestionModal(question = null) {
        if (!this.isAuthenticated) return;
        const modal = document.getElementById('questionModal');
        if (!modal) return;
        const title = document.getElementById('modalTitle');
        if (question) {
            title.textContent = '✏️ ویرایش سوال';
            document.getElementById('questionId').value = question.id;
            document.getElementById('modalCategory').value = question.category;
            document.getElementById('modalLevel').value = question.level;
            document.getElementById('modalQuestion').value = question.question;
            document.getElementById('option0').value = question.options[0];
            document.getElementById('option1').value = question.options[1];
            document.getElementById('option2').value = question.options[2];
            document.getElementById('option3').value = question.options[3];
            document.getElementById('modalCorrect').value = question.correct;
        } else {
            title.textContent = '➕ افزودن سوال جدید';
            document.getElementById('questionForm').reset();
            document.getElementById('questionId').value = '';
        }
        modal.style.display = 'block';
    }

    async saveQuestion(e) {
        e.preventDefault();
        if (!this.isAuthenticated) return;
        const id = document.getElementById('questionId').value;
        const questionData = {
            category: document.getElementById('modalCategory').value,
            level: document.getElementById('modalLevel').value,
            question: document.getElementById('modalQuestion').value,
            options: [
                document.getElementById('option0').value,
                document.getElementById('option1').value,
                document.getElementById('option2').value,
                document.getElementById('option3').value
            ],
            correct: parseInt(document.getElementById('modalCorrect').value)
        };
        if (!questionData.question.trim()) { alert('لطفاً متن سوال را وارد کنید'); return; }
        for (let i = 0; i < questionData.options.length; i++) {
            if (!questionData.options[i].trim()) { alert(`لطفاً گزینه ${i + 1} را وارد کنید`); return; }
        }
        if (isNaN(questionData.correct) || questionData.correct < 0 || questionData.correct > 3) {
            alert('لطفاً گزینه صحیح معتبر (0 تا 3) وارد کنید');
            return;
        }
        if (id) {
            await this.questionBank.updateQuestion(parseInt(id), questionData);
            alert('✅ سوال با موفقیت ویرایش شد');
        } else {
            await this.questionBank.addQuestion(questionData);
            alert('✅ سوال با موفقیت اضافه شد');
        }
        document.getElementById('questionModal').style.display = 'none';
        this.loadQuestionsTab();
    }

    async editQuestion(id) {
        if (!this.isAuthenticated) return;
        const question = this.questionBank.getQuestionById(id);
        if (question) this.showQuestionModal(question);
        else alert('سوال یافت نشد');
    }

    async deleteQuestion(id) {
        if (!this.isAuthenticated) return;
        if (confirm('⚠️ آیا از حذف این سوال اطمینان دارید؟')) {
            await this.questionBank.deleteQuestion(id);
            this.loadQuestionsTab();
            alert('✅ سوال با موفقیت حذف شد');
        }
    }

    async importQuestions() {
        if (!this.isAuthenticated) return;
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const questions = JSON.parse(event.target.result);
                    if (await this.questionBank.importQuestions(questions)) {
                        alert('✅ سوالات با موفقیت وارد شدند');
                        this.loadQuestionsTab();
                    } else {
                        alert('❌ فرمت فایل نامعتبر است');
                    }
                } catch (error) {
                    alert('❌ خطا در خواندن فایل');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    exportQuestions() {
        if (!this.isAuthenticated) return;
        const questions = this.questionBank.exportQuestions();
        const blob = new Blob([questions], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `questions_${new Date().toISOString().slice(0, 19)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        alert('✅ فایل با موفقیت ذخیره شد');
    }

    // ========== نتایج (همیشه از Supabase) ==========
    async loadResultsTab() {
        if (!this.isAuthenticated) return;
        const stats = await this.storage.getResultsStats();
        document.getElementById('totalParticipants').textContent = stats.totalParticipants;
        document.getElementById('avgScore').textContent = `${stats.averageScore}%`;
        document.getElementById('highestScore').textContent = `${stats.highestScore}%`;
        document.getElementById('lowestScore').textContent = `${stats.lowestScore}%`;
        document.getElementById('passRate').textContent = `${stats.passRate}%`;
        await this.renderResultsTable();
    }

    async renderResultsTable() {
        if (!this.isAuthenticated) return;
        const results = await this.storage.getResults();
        const container = document.getElementById('resultsTable');
        if (!container) return;
        if (!results || results.length === 0) {
            container.innerHTML = '<div class="no-data">📭 هیچ نتیجه‌ای ثبت نشده است</div>';
            return;
        }
        let html = `
            <div style="margin-bottom: 20px;">
                <button id="bulkCertificateBtn" class="btn-primary">🎓 تولید کارنامه رسمی</button>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>شناسه</th>
                        <th>نام</th>
                        <th>کد پرسنلی</th>
                        <th>واحد</th>
                        <th>نمره</th>
                        <th>درصد</th>
                        <th>وضعیت</th>
                        <th>کارنامه</th>
                        <th>عملیات</th>
                    </tr>
                </thead>
                <tbody>
        `;
        results.forEach(r => {
            const statusHtml = r.passed ? '✅ قبول' : '❌ مردود';
            const statusClass = r.passed ? 'status-passed' : 'status-failed';
            html += `
                <tr>
                    <td>${r.examId}</td>
                    <td>${r.fullName}</td>
                    <td>${r.personnelCode}</td>
                    <td>${r.department}</td>
                    <td>${r.score}/${r.totalQuestions}</td>
                    <td style="color: var(--accent-primary); font-weight: bold;">${r.percent}%</td>
                    <td class="${statusClass}">${statusHtml}</td>
                    <td><button class="btn-secondary cert-btn" data-id="${r.examId}" style="padding: 5px 10px;">🎓 کارنامه</button></td>
                    <td><button class="btn-danger delete-result" data-id="${r.examId}" style="padding: 5px 10px;">🗑️ حذف</button></td>
                </tr>
            `;
        });
        html += `</tbody></table>`;
        container.innerHTML = html;

        container.querySelectorAll('.cert-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const examId = btn.getAttribute('data-id');
                this.generateCertificateForResult(examId);
            });
        });
        container.querySelectorAll('.delete-result').forEach(btn => {
            btn.addEventListener('click', async () => {
                const examId = btn.getAttribute('data-id');
                await this.deleteResult(examId);
            });
        });
        document.getElementById('bulkCertificateBtn')?.addEventListener('click', () => this.generateBulkCertificates());
    }

    async deleteResult(examId) {
        if (!this.isAuthenticated) return;
        if (confirm('⚠️ آیا از حذف این نتیجه اطمینان دارید؟')) {
            await this.storage.deleteResult(examId);
            await this.loadResultsTab();
            alert('✅ نتیجه با موفقیت حذف شد');
        }
    }

    async refreshResults() {
        if (!this.isAuthenticated) return;
        const btn = document.getElementById('refreshResultsBtn');
        if (btn) {
            btn.textContent = '⏳ در حال به‌روزرسانی...';
            btn.disabled = true;
        }
        try {
            await this.storage.syncResultsFromSupabase();
            await this.loadResultsTab();
            alert('✅ نتایج با موفقیت به‌روزرسانی شدند');
        } catch (error) {
            alert('❌ خطا در به‌روزرسانی نتایج: ' + error.message);
        } finally {
            if (btn) {
                btn.textContent = '🔄 به‌روزرسانی نتایج';
                btn.disabled = false;
            }
        }
    }

    // ========== گزارشات ==========
    async loadReportsTab() {
        if (!this.isAuthenticated) return;
        const container = document.getElementById('reportContent');
        if (!container) return;
        container.innerHTML = '<p style="text-align: center; padding: 40px;">⏳ در حال بارگذاری گزارش...</p>';
        try {
            const reportContent = await this.resultManager.getPrintableReport();
            container.innerHTML = reportContent;
        } catch (error) {
            container.innerHTML = `<p style="text-align: center; padding: 40px; color: red;">❌ خطا در بارگذاری گزارش: ${error.message}</p>`;
        }
    }

    exportToCSV() {
        if (!this.isAuthenticated) return;
        const csv = this.resultManager.exportToCSV();
        const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `exam_results_${new Date().toISOString().slice(0, 19)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        alert('✅ فایل CSV با موفقیت ذخیره شد');
    }

    exportToExcel() {
        if (!this.isAuthenticated) return;
        const csv = this.resultManager.exportToCSV();
        const blob = new Blob(["\uFEFF" + csv], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `exam_results_${new Date().toISOString().slice(0, 19)}.xls`;
        a.click();
        URL.revokeObjectURL(url);
        alert('✅ فایل Excel با موفقیت ذخیره شد');
    }

    printReport() {
        if (!this.isAuthenticated) return;
        const printWindow = window.open('', '_blank');
        const reportHtml = this.resultManager.getPrintableReport();
        printWindow.document.write(`
            <html dir="rtl">
            <head>
                <title>گزارش آزمون</title>
                <style>
                    body { font-family: Tahoma, sans-serif; padding: 20px; }
                    table { border-collapse: collapse; width: 100%; margin: 10px 0; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
                    th { background: #f0f0f0; }
                    .stats-table { width: 50%; }
                    h1 { color: #333; }
                    @media print { body { margin: 0; padding: 0; } }
                </style>
            </head>
            <body>${reportHtml}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }

    // ========== کارنامه ==========
    async generateCertificateForResult(examId) {
        if (!this.isAuthenticated) return;
        try {
            const result = await this.resultManager.getResultById(examId);
            if (result) {
                this.generateProfessionalCertificate(result);
            } else {
                alert('❌ نتیجه‌ای با این شناسه یافت نشد. لطفاً ابتدا نتایج را به‌روزرسانی کنید.');
            }
        } catch (error) {
            alert('❌ خطا در تولید کارنامه: ' + error.message);
        }
    }

    async generateBulkCertificates() {
        if (!this.isAuthenticated) return;
        try {
            const results = await this.resultManager.getAllResults();
            if (!results || results.length === 0) {
                alert('هیچ نتیجه‌ای برای تولید کارنامه وجود ندارد');
                return;
            }
            const selected = prompt(`تعداد ${results.length} نتیجه موجود است.\nبرای کدام شخص کارنامه می‌خواهید؟\n(شماره پرسنلی یا نام را وارد کنید)`);
            if (selected) {
                const result = results.find(r => r.personnelCode === selected || r.fullName.includes(selected));
                if (result) {
                    this.generateProfessionalCertificate(result);
                } else {
                    alert('نتیجه‌ای با این مشخصات یافت نشد');
                }
            }
        } catch (error) {
            alert('❌ خطا در تولید کارنامه دسته‌جمعی: ' + error.message);
        }
    }

    generateProfessionalCertificate(result) {
        if (!this.isAuthenticated) return;
        const certWindow = window.open('', '_blank');
        const percent = result.percent;
        const status = result.passed ? 'قبول' : 'نیاز به بازآموزی';
        const statusClass = result.passed ? 'status-passed' : 'status-failed';
        const circleOffset = 565.48 - (565.48 * percent) / 100;
        const html = `
            <!DOCTYPE html>
            <html dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>کارنامه رسمی - ${result.fullName}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Segoe UI', Tahoma, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; justify-content: center; align-items: center; padding: 40px; }
                    .certificate-wrapper { max-width: 900px; width: 100%; }
                    .certificate { background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
                    .certificate-header { background: linear-gradient(135deg, #667eea, #764ba2); padding: 30px; text-align: center; color: white; }
                    .certificate-header h1 { font-size: 28px; margin-bottom: 10px; }
                    .certificate-body { padding: 40px; }
                    .recipient-name { font-size: 24px; color: #667eea; text-align: center; margin-bottom: 30px; padding-bottom: 10px; border-bottom: 2px solid #667eea; display: inline-block; width: auto; }
                    .text-center { text-align: center; }
                    .score-circle { width: 180px; height: 180px; margin: 20px auto; position: relative; }
                    .score-circle svg { width: 100%; height: 100%; transform: rotate(-90deg); }
                    .score-circle circle { fill: none; stroke-width: 12; stroke-linecap: round; }
                    .bg-circle { stroke: #e0e0e0; }
                    .progress-circle { stroke: url(#gradient); stroke-dasharray: 565.48; stroke-dashoffset: ${circleOffset}; }
                    .score-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; }
                    .score-value { font-size: 40px; font-weight: bold; color: #667eea; }
                    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 30px 0; }
                    .info-card { background: #f5f5f5; padding: 15px; border-radius: 10px; text-align: center; }
                    .info-label { font-size: 12px; color: #666; margin-bottom: 5px; }
                    .info-value { font-size: 18px; font-weight: bold; color: #333; }
                    .status { display: inline-block; padding: 10px 30px; border-radius: 50px; font-size: 18px; font-weight: bold; color: white; margin: 20px 0; }
                    .status-passed { background: linear-gradient(135deg, #00ff88, #00cc66); }
                    .status-failed { background: linear-gradient(135deg, #ff4444, #cc0000); }
                    .signature-section { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; border-top: 1px dashed #ddd; }
                    .signature { text-align: center; }
                    .signature-line { width: 150px; height: 1px; background: #333; margin-top: 5px; }
                    .footer { background: #f8f9fa; padding: 15px; text-align: center; font-size: 11px; color: #999; }
                    .btn-print { display: block; width: 200px; margin: 20px auto; padding: 12px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; text-align: center; border: none; border-radius: 10px; cursor: pointer; font-size: 16px; }
                    @media print { body { background: white; padding: 0; } .btn-print { display: none; } .certificate { box-shadow: none; } }
                </style>
            </head>
            <body>
                <div class="certificate-wrapper">
                    <div class="certificate">
                        <div class="certificate-header">
                            <h1>🎓 کارنامه رسمی آزمون</h1>
                            <p>SmartExam Enterprise Lite</p>
                        </div>
                        <div class="certificate-body">
                            <div class="text-center">
                                <div class="recipient-name">${result.fullName}</div>
                                <p style="margin-top: 5px;">کد پرسنلی: ${result.personnelCode}</p>
                            </div>
                            <div class="score-circle">
                                <svg>
                                    <defs><linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" style="stop-color:#667eea" />
                                        <stop offset="100%" style="stop-color:#764ba2" />
                                    </linearGradient></defs>
                                    <circle class="bg-circle" cx="90" cy="90" r="80"></circle>
                                    <circle class="progress-circle" cx="90" cy="90" r="80"></circle>
                                </svg>
                                <div class="score-text">
                                    <div class="score-value">${percent}%</div>
                                    <div style="font-size: 12px;">درصد قبولی</div>
                                </div>
                            </div>
                            <div class="info-grid">
                                <div class="info-card"><div class="info-label">📊 نمره کسب شده</div><div class="info-value">${result.score} / ${result.totalQuestions}</div></div>
                                <div class="info-card"><div class="info-label">📅 تاریخ آزمون</div><div class="info-value">${new Date(result.endTime).toLocaleDateString('fa-IR')}</div></div>
                                <div class="info-card"><div class="info-label">🏢 واحد سازمانی</div><div class="info-value">${result.department}</div></div>
                                <div class="info-card"><div class="info-label">📍 محل خدمت</div><div class="info-value">${result.workplace}</div></div>
                                <div class="info-card"><div class="info-label">⏱ مدت زمان</div><div class="info-value">${Math.floor(result.duration / 60)} دقیقه و ${result.duration % 60} ثانیه</div></div>
                                <div class="info-card"><div class="info-label">✅ پاسخ صحیح</div><div class="info-value">${result.score} سوال</div></div>
                            </div>
                            <div class="text-center">
                                <div class="status ${statusClass}">${status}</div>
                            </div>
                            <div class="signature-section">
                                <div class="signature"><div>مدیریت سازمان</div><div class="signature-line"></div></div>
                                <div class="signature"><div>مسئول آموزش</div><div class="signature-line"></div></div>
                            </div>
                        </div>
                        <div class="footer">این کارنامه توسط سامانه SmartExam Enterprise Lite صادر شده است</div>
                    </div>
                    <button class="btn-print" onclick="window.print()">🖨 چاپ کارنامه</button>
                </div>
            </body>
            </html>
        `;
        certWindow.document.write(html);
        certWindow.document.close();
    }

    // ========== پس‌زمینه ==========
    showBackgroundUploader() {
        if (!this.isAuthenticated) return;
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content glass-card">
                <span class="close" style="cursor: pointer;">&times;</span>
                <h3>🎨 تنظیم پس‌زمینه سفارشی</h3>
                <div class="background-upload-area" style="border: 2px dashed var(--accent-primary); border-radius: 15px; padding: 40px; text-align: center; margin: 20px 0; cursor: pointer;">
                    📸 کلیک کنید یا عکس را اینجا بکشید
                    <br><small>فرمت‌های مجاز: JPG, PNG, GIF</small>
                </div>
                <input type="file" id="bgFileInput" accept="image/*" style="display: none;">
                <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
                    <button id="removeBgBtn" class="btn-danger">حذف پس‌زمینه</button>
                    <button id="closeBgModal" class="btn-secondary">بستن</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        const uploadArea = modal.querySelector('.background-upload-area');
        const fileInput = modal.querySelector('#bgFileInput');
        const removeBtn = modal.querySelector('#removeBgBtn');
        const closeBtn = modal.querySelector('#closeBgModal');
        const closeX = modal.querySelector('.close');
        uploadArea.onclick = () => fileInput.click();
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                this.setCustomBackground(file);
                modal.remove();
            } else {
                alert('لطفاً یک فایل تصویری انتخاب کنید');
            }
        };
        removeBtn.onclick = () => {
            this.removeCustomBackground();
            modal.remove();
        };
        const closeModal = () => modal.remove();
        closeBtn.onclick = closeModal;
        closeX.onclick = closeModal;
    }

    setCustomBackground(file) {
        if (!this.isAuthenticated) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageUrl = e.target.result;
            localStorage.setItem('custom_background', imageUrl);
            document.body.style.background = `url(${imageUrl}) center/cover fixed no-repeat`;
            document.body.classList.add('has-custom-bg');
            alert('✅ پس‌زمینه با موفقیت تغییر کرد');
        };
        reader.readAsDataURL(file);
    }

    loadCustomBackground() {
        const savedBg = localStorage.getItem('custom_background');
        if (savedBg) {
            document.body.style.background = `url(${savedBg}) center/cover fixed no-repeat`;
            document.body.classList.add('has-custom-bg');
        }
    }

    removeCustomBackground() {
        if (!this.isAuthenticated) return;
        document.body.style.background = '';
        document.body.classList.remove('has-custom-bg');
        localStorage.removeItem('custom_background');
        alert('✅ پس‌زمینه به حالت پیش‌فرض بازگشت');
    }

    setupTheme() {
        const themeBtn = document.getElementById('themeToggleBtn');
        if (themeBtn) {
            themeBtn.onclick = () => {
                const html = document.documentElement;
                const currentTheme = html.getAttribute('data-theme');
                if (currentTheme === 'light') {
                    html.removeAttribute('data-theme');
                    themeBtn.textContent = '🌙';
                } else {
                    html.setAttribute('data-theme', 'light');
                    themeBtn.textContent = '☀️';
                }
            };
        }
    }
}

let adminDashboard = null;
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing AdminDashboard...');
    adminDashboard = new AdminDashboard(questionBank, resultManager, storageManager);
});