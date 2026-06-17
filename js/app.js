class App {
  async init() {
    console.log("🚀 App starting...");

    this.questionBank = new QuestionBank();
    this.examEngine = new ExamEngine();

    const questions = await this.questionBank.loadQuestions();

    console.log("📚 Questions loaded:", questions);

    this.examEngine.setQuestions(questions);

    window.examEngine = this.examEngine;

    this.renderQuestions();
  }

  renderQuestions() {
    const container = document.getElementById("questions-container");
    container.innerHTML = "";

    this.examEngine.questions.forEach((q, index) => {
      const div = document.createElement("div");

      div.innerHTML = `
        <h3>${index + 1}. ${q.question}</h3>
        ${q.options.map(opt => `
          <button onclick="app.select('${q.id}', '${opt}')">
            ${opt}
          </button>
        `).join("")}
      `;

      container.appendChild(div);
    });
  }

  select(id, answer) {
    this.examEngine.setAnswer(id, answer);
    console.log("Selected:", id, answer);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.app = new App();
  app.init();
});
