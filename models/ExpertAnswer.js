import mongoose from "mongoose";

/**
 * One answer of the dealer to an Expertenwissen question
 * (lib/market/expertQuestions.js). The deep analysis reads these as the
 * business's own rules and experience.
 */
const ExpertAnswerSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true, unique: true, index: true },
    answer: { type: String, default: "", maxlength: 40000 },
    updatedBy: { type: String, default: "" },
  },
  { timestamps: true },
);

export default mongoose.models.ExpertAnswer ||
  mongoose.model("ExpertAnswer", ExpertAnswerSchema);
