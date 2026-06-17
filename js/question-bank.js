window.QuestionBank = class {
  constructor() {
    this.questions = [];
  }

  async loadQuestions() {
    const { data, error } = await supabase
      .from("questions")
      .select("id, question, options") // ❌ no question_id
      .order("id");

    if (error) {
      console.error(error);
      return [];
    }

    this.questions = data;
    return data;
  }
};