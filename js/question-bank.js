import { supabase } from "./supabase-client.js";

export class QuestionBank {
  constructor() {
    this.questions = [];
  }

  async loadQuestions() {
    const { data, error } = await supabase
      .from("questions")
      .select("id, question, options")
      .order("id"); // ❌ نه question_id

    if (error) {
      console.error(error);
      return [];
    }

    this.questions = data;
    return data;
  }
}