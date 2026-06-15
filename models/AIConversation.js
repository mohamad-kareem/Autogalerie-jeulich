import mongoose from "mongoose";

const AIMessageSchema = new mongoose.Schema(
  {
    messageId: {
      type: String,
      required: true,
      trim: true,
    },

    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000,
    },

    failed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    _id: false,
  },
);

const AIConversationSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    messages: {
      type: [AIMessageSchema],
      default: [],
    },

    customer: {
      name: {
        type: String,
        default: "",
        trim: true,
        maxlength: 100,
      },

      email: {
        type: String,
        default: "",
        trim: true,
        lowercase: true,
        maxlength: 180,
      },

      phone: {
        type: String,
        default: "",
        trim: true,
        maxlength: 80,
      },
    },

    page: {
      url: {
        type: String,
        default: "",
        maxlength: 1200,
      },

      title: {
        type: String,
        default: "",
        maxlength: 300,
      },

      pathname: {
        type: String,
        default: "",
        maxlength: 500,
      },
    },

    userAgent: {
      type: String,
      default: "",
      maxlength: 1000,
    },

    lastMessage: {
      type: String,
      default: "",
      maxlength: 500,
    },

    lastMessageRole: {
      type: String,
      enum: ["user", "assistant"],
      default: "user",
    },

    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    unreadByAdmin: {
      type: Boolean,
      default: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["open", "archived"],
      default: "open",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

AIConversationSchema.index({
  status: 1,
  lastMessageAt: -1,
});

AIConversationSchema.index({
  unreadByAdmin: 1,
  lastMessageAt: -1,
});

export default mongoose.models.AIConversation ||
  mongoose.model("AIConversation", AIConversationSchema);
