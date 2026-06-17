window.QuestionBank = class {
  constructor() {
    this.questions = [];
  }

  async loadQuestions() {
    const { data, error } = await window.supabase
      .from("questions")
      .select("id, question, options, correct_answer")
      .order("id");

    if (error) {
      console.error("Question load error:", error);
      return [];
    }

    this.questions = data;
    return data;
  }
};
