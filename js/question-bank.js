import { supabase } from "./supabase-client.js";

export class QuestionBank {
  async loadQuestions() {
    const { data, error } = await supabase
      .from("questions")
      .select("id, question, options");

    if (error) {
      console.log("Error:", error);
      return [];
    }

    return data;
  }
}