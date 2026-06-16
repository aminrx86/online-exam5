/**
 * User Manager - مدیریت اطلاعات کاربران
 * @version 1.0.0
 */

class UserManager {
    constructor(storageManager) {
        this.storage = storageManager;
        this.currentUser = null;
    }
    
    /**
     * ثبت نام کاربر برای آزمون
     * @param {Object} userData - اطلاعات کاربر
     * @returns {Object} نتیجه ثبت نام
     */
    registerUser(userData) {
        // Validation
        if (!userData.fullName || !userData.personnelCode || !userData.department || !userData.workplace) {
            return {
                success: false,
                message: 'لطفاً تمام فیلدها را پر کنید'
            };
        }
        
        // Check if personnel code is valid
        if (userData.personnelCode.length < 3) {
            return {
                success: false,
                message: 'شماره پرسنلی معتبر نیست'
            };
        }
        
        // Create user object
        this.currentUser = {
            fullName: userData.fullName.trim(),
            personnelCode: userData.personnelCode.trim(),
            department: userData.department.trim(),
            workplace: userData.workplace.trim(),
            registrationDate: new Date().toISOString()
        };
        
        return {
            success: true,
            user: this.currentUser
        };
    }
    
    /**
     * دریافت کاربر جاری
     * @returns {Object}
     */
    getCurrentUser() {
        return this.currentUser;
    }
    
    /**
     * خروج کاربر
     */
    logoutUser() {
        this.currentUser = null;
    }
    
    /**
     * اعتبارسنجی شماره پرسنلی
     * @param {string} personnelCode
     * @returns {boolean}
     */
    validatePersonnelCode(personnelCode) {
        // Personnel code should be numeric and between 3-10 digits
        const regex = /^\d{3,10}$/;
        return regex.test(personnelCode);
    }
    
    /**
     * دریافت تاریخچه آزمون‌های کاربر
     * @param {string} personnelCode
     * @returns {Array}
     */
    getUserExamHistory(personnelCode) {
        const allResults = this.storage.getResults();
        return allResults.filter(r => r.personnelCode === personnelCode);
    }
    
    /**
     * بررسی امکان شرکت مجدد در آزمون
     * @param {string} personnelCode
     * @returns {boolean}
     */
    canRetakeExam(personnelCode) {
        const userExams = this.getUserExamHistory(personnelCode);
        // Allow retake if no previous exam or last exam was more than 24 hours ago
        if (userExams.length === 0) return true;
        
        const lastExam = new Date(userExams[userExams.length - 1].endTime);
        const now = new Date();
        const hoursDiff = (now - lastExam) / (1000 * 60 * 60);
        
        return hoursDiff >= 24;
    }
    
    /**
     * دریافت آمار عملکرد کاربر
     * @param {string} personnelCode
     * @returns {Object}
     */
    getUserStatistics(personnelCode) {
        const exams = this.getUserExamHistory(personnelCode);
        
        if (exams.length === 0) {
            return {
                totalExams: 0,
                averageScore: 0,
                bestScore: 0,
                worstScore: 0,
                passCount: 0,
                failCount: 0,
                lastExamDate: null
            };
        }
        
        const scores = exams.map(e => e.percent);
        const passed = exams.filter(e => e.passed).length;
        
        return {
            totalExams: exams.length,
            averageScore: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2),
            bestScore: Math.max(...scores),
            worstScore: Math.min(...scores),
            passCount: passed,
            failCount: exams.length - passed,
            lastExamDate: new Date(exams[exams.length - 1].endTime).toLocaleDateString('fa-IR')
        };
    }
}

// Create global instance
const userManager = new UserManager(storageManager);