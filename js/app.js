import { QuestionBank } from "./question-bank.js";
import { ExamEngine } from "./exam-engine.js";

class App {
  constructor() {
    this.questionBank = new QuestionBank();
    this.examEngine = new ExamEngine();
  }

  async init() {
    const questions = await this.questionBank.loadQuestions();

    console.log("Questions loaded:", questions);

    this.examEngine.setQuestions(questions); // اگر داری
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.app = new App();
  window.app.init();
});