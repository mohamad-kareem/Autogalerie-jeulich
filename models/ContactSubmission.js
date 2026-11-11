import mongoose from "mongoose";

const ContactSubmissionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    date: {
      type: Date,
      default: null,
    },

    carId: {
      type: String,
      default: "",
    },

    carName: {
      type: String,
      default: "",
    },

    carLink: {
      type: String,
      default: "",
    },

    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
      },
    ],

    // Anfragen (staff portal): status, internal note, who handled it.
    // Older messages have no status – they count as "Neu" until someone opened them, then "Erledigt".
    status: {
      type: String,
      enum: ["new", "in_progress", "done", "archived"],
      default: "new",
    },
    note: { type: String, default: "", trim: true, maxlength: 2000 },
    handledBy: { type: String, default: "", trim: true },
    handledAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// dev: drop a model compiled before the new fields existed
if (mongoose.models.ContactSubmission && !mongoose.models.ContactSubmission.schema.path("status")) {
  mongoose.deleteModel("ContactSubmission");
}

const ContactSubmission =
  mongoose.models.ContactSubmission ||
  mongoose.model("ContactSubmission", ContactSubmissionSchema);

export default ContactSubmission;
