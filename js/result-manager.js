/**
 * Result Manager - مدیریت نتایج (نسخه نهایی)
 * @version 2.1.0
 */
class ResultManager {
    constructor(storageManager) {
        this.storage = storageManager;
        this.results = [];
        this.loadResults();
    }

    async loadResults() {
        this.results = await this.storage.getResults();
        return this.results;
    }

    async getAllResults() {
        if (this.results.length === 0) {
            await this.loadResults();
        }
        return this.results;
    }

    async getResultById(examId) {
        let result = this.results.find(r => r.examId === examId);
        if (!result) {
            const all = await this.storage.getResults();
            result = all.find(r => r.examId === examId);
            if (result) {
                this.results = all;
            }
        }
        return result;
    }

    async deleteResult(examId) {
        await this.storage.deleteResult(examId);
        this.results = this.results.filter(r => r.examId !== examId);
    }

    exportToCSV() {
        if (this.results.length === 0) return 'هیچ داده‌ای وجود ندارد';
        const headers = ['شناسه', 'نام', 'کد پرسنلی', 'واحد', 'محل خدمت', 'نمره', 'تعداد سوالات', 'درصد', 'وضعیت', 'مدت (ثانیه)', 'تاریخ'];
        const rows = this.results.map(r => [
            r.examId,
            r.fullName,
            r.personnelCode,
            r.department,
            r.workplace,
            r.score,
            r.totalQuestions,
            r.percent,
            r.passed ? 'قبول' : 'مردود',
            r.duration,
            new Date(r.endTime).toLocaleDateString('fa-IR')
        ]);
        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }

    async getPrintableReport() {
        const results = await this.storage.getResults();
        
        if (!results || results.length === 0) {
            return '<p style="text-align: center; padding: 40px;">📭 هیچ داده‌ای برای گزارش وجود ندارد</p>';
        }

        const stats = await this.storage.getResultsStats();

        let html = `
            <h2 style="text-align: center; margin-bottom: 20px;">📊 گزارش کلی آزمون</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin: 20px 0;">
                <div class="stat-card" style="background: #f0f4ff; padding: 15px; border-radius: 12px; text-align: center;">
                    <h4 style="margin: 0; color: #666;">تعداد شرکت‌کنندگان</h4>
                    <div style="font-size: 28px; font-weight: bold; color: #667eea;">${stats.totalParticipants}</div>
                </div>
                <div class="stat-card" style="background: #f0fff4; padding: 15px; border-radius: 12px; text-align: center;">
                    <h4 style="margin: 0; color: #666;">میانگین نمرات</h4>
                    <div style="font-size: 28px; font-weight: bold; color: #00cc66;">${stats.averageScore}%</div>
                </div>
                <div class="stat-card" style="background: #fff8f0; padding: 15px; border-radius: 12px; text-align: center;">
                    <h4 style="margin: 0; color: #666;">بالاترین نمره</h4>
                    <div style="font-size: 28px; font-weight: bold; color: #ff8800;">${stats.highestScore}%</div>
                </div>
                <div class="stat-card" style="background: #fff0f0; padding: 15px; border-radius: 12px; text-align: center;">
                    <h4 style="margin: 0; color: #666;">پایین‌ترین نمره</h4>
                    <div style="font-size: 28px; font-weight: bold; color: #ff4444;">${stats.lowestScore}%</div>
                </div>
                <div class="stat-card" style="background: #f0f8ff; padding: 15px; border-radius: 12px; text-align: center;">
                    <h4 style="margin: 0; color: #666;">درصد قبولی</h4>
                    <div style="font-size: 28px; font-weight: bold; color: #4488ff;">${stats.passRate}%</div>
                </div>
            </div>
            <h3 style="margin-top: 30px;">📋 لیست نتایج</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <thead>
                    <tr style="background: #f0f0f0;">
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">نام</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">کد پرسنلی</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">نمره</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">درصد</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">وضعیت</th>
                    </tr>
                </thead>
                <tbody>
        `;

        results.forEach(r => {
            html += `
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${r.fullName}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${r.personnelCode}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${r.score}/${r.totalQuestions}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-weight: bold; color: ${r.passed ? '#00cc66' : '#ff4444'};">${r.percent}%</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${r.passed ? '✅ قبول' : '❌ مردود'}</td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
            <p style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                تاریخ تولید گزارش: ${new Date().toLocaleString('fa-IR')}
            </p>
        `;

        return html;
    }
}

const resultManager = new ResultManager(storageManager);