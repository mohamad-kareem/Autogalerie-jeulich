import { connectDB } from "@/lib/mongodb";
import ExpertAnswer from "@/models/ExpertAnswer";

/** The dealer's Marktwissen answers — a help, never a requirement. */
export async function loadExpertAnswers() {
  try {
    await connectDB();
    return await ExpertAnswer.find({ answer: { $ne: "" } }, { questionId: 1, answer: 1 }).lean();
  } catch (error) {
    console.error("deep: expert answers unavailable", error);
    return [];
  }
}
