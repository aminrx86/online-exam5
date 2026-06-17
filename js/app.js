class App {
  async init() {
    this.questionBank = new QuestionBank();
    this.examEngine = new ExamEngine();

    const questions = await this.questionBank.loadQuestions();

    console.log("Questions loaded:", questions);

    this.examEngine.setQuestions(questions);

    window.examEngine = this.examEngine;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.app = new App();
  app.init();
});