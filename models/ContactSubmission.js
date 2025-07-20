import mongoose from "mongoose";

const ContactSubmissionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    date: { type: Date },

    carName: { type: String },
    carLink: { type: String },

    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "Admin" }],
  },
  { timestamps: true }
);

const ContactSubmission =
  mongoose.models.ContactSubmission ||
  mongoose.model("ContactSubmission", ContactSubmissionSchema);

export default ContactSubmission;
