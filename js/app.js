class App {
  async init() {
    try {
      console.log("🚀 App starting...");

      this.questionBank = new QuestionBank();
      this.examEngine = new ExamEngine();

      const questions = await this.questionBank.loadQuestions();

      console.log("📚 Questions loaded:", questions);

      this.examEngine.setQuestions(questions);

      window.examEngine = this.examEngine;

      this.renderQuestions();

    } catch (err) {
      console.error("App init error:", err);
    }
  }

  renderQuestions() {
    const container = document.getElementById("questions-container");
    if (!container) return;

    container.innerHTML = "";

    this.examEngine.questions.forEach((q, index) => {
      const div = document.createElement("div");
      div.className = "question";

      div.innerHTML = `
        <h3>${index + 1}. ${q.question}</h3>
        <div>
          ${q.options.map(opt => `
            <button onclick="app.selectAnswer('${q.id}', '${opt}')">
              ${opt}
            </button>
          `).join("")}
        </div>
      `;

      container.appendChild(div);
    });
  }

  selectAnswer(questionId, answer) {
    this.examEngine.setAnswer(questionId, answer);
    console.log("Answer selected:", questionId, answer);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.app = new App();
  app.init();
});
