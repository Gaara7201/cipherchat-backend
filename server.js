const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// 🔗 Connect MongoD
console.log("MONGO_URL VALUE:",
 process.env.MONGO_URL);
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// 🧠 Message Schema
const messageSchema = new mongoose.Schema({
  text: String,
  user: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 🟣 Auto delete after 1 day (TTL)
messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const Message = mongoose.model("Message", messageSchema);

// 📥 Get messages
app.get("/messages", async (req, res) => {
  const messages = await Message.find().sort({ createdAt: 1 });
  res.json(messages);
});

// 📤 Send message
app.post("/send", async (req, res) => {
  const { text, user } = req.body;

  const MAX_MESSAGES = 100;

  const count = await Message.countDocuments();

  // 🔴 Keep only 100 messages
  if (count >= MAX_MESSAGES) {
    const oldest = await Message.find().sort({ createdAt: 1 }).limit(1);
    if (oldest.length > 0) {
      await Message.findByIdAndDelete(oldest[0]._id);
    }
  }

  const newMessage = new Message({ text, user });
  await newMessage.save();

  res.json({ success: true });
});

// 🏠 Test route
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// 🚀 Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
