window.ExamEngine = class {
  constructor() {
    this.questions = [];
    this.answers = {};
    this.currentIndex = 0;
  }

  setQuestions(questions) {
    this.questions = questions;
  }

  setAnswer(id, answer) {
    this.answers[id] = answer;
  }

  calculateScore() {
    let score = 0;

    for (const q of this.questions) {
      if (this.answers[q.id] === q.correct_answer) {
        score++;
      }
    }

    return score;
  }
};