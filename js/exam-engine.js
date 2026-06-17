export class ExamEngine {
  constructor() {
    this.questions = [];
    this.answers = {};
    this.currentIndex = 0;
  }

  // 📌 دریافت سوالات از app.js
  setQuestions(questions) {
    this.questions = questions || [];
  }

  // 📌 ثبت جواب کاربر
  setAnswer(questionId, answer) {
    this.answers[questionId] = answer;
  }

  // 📌 گرفتن سوال فعلی
  getCurrentQuestion() {
    return this.questions[this.currentIndex];
  }

  // 📌 رفتن به سوال بعد
  nextQuestion() {
    if (this.currentIndex < this.questions.length - 1) {
      this.currentIndex++;
    }
  }

  // 📌 رفتن به سوال قبل
  prevQuestion() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }

  // 📌 محاسبه نتیجه (fallback اگر Edge Function نباشه)
  calculateScore() {
    let score = 0;

    for (const q of this.questions) {
      if (this.answers[q.id] === q.correct_answer) {
        score++;
      }
    }

    return score;
  }

  // 📌 ارسال آزمون به سرور (Supabase Edge Function)
  async submit(userId) {
    try {
      const res = await fetch(
        "https://YOUR_PROJECT.supabase.co/functions/v1/grade-exam",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            userId,
            answers: this.answers,
            questions: this.questions.map(q => ({
              id: q.id,
              correct_answer: q.correct_answer
            }))
          })
        }
      );

      const data = await res.json();
      return data;

    } catch (error) {
      console.error("Submit error:", error);

      // fallback (اگر function کار نکرد)
      const score = this.calculateScore();
      return { score };
    }
  }
}