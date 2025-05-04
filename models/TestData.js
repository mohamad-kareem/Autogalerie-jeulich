import mongoose from "mongoose";

const testDataSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
  },
});

export default mongoose.models.TestData ||
  mongoose.model("TestData", testDataSchema);
