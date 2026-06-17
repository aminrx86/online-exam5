window.ExamEngine = class {
  constructor() {
    this.questions = [];
    this.answers = {};
  }

  setQuestions(qs) {
    this.questions = qs || [];
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

  submit() {
    const score = this.calculateScore();
    alert("Your Score: " + score);
    return score;
  }
};
