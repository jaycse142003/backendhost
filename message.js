const mongoose = require("mongoose");

const MessageSchema = mongoose.Schema(
  {
    message: {
      text: { type: String, required: true },
    },
    users: Array,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Userdata",
      required:true
    },
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model("UserMessage", MessageSchema);
module.exports = Message;
