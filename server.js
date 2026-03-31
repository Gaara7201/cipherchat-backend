 const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// 🔗 Connect MongoDB
console.log("MONGO_URL VALUE:", process.env.MONGO_URL);
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("MongoDB connection error:", err));

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

// 🏠 Root route
app.get("/", async (req, res) => {
  const count = await Message.countDocuments();
  res.send(`
    <h1>CipherChat Backend 🚀</h1>
    <p>Server is running!</p>
    <p>Total messages in DB: ${count}</p>
    <p>Use /messages to get all messages and /send to post a message</p>
  `);
});

// 📥 Get all messages
app.get("/messages", async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to get messages" });
  }
});

// 📤 Send a message
app.post("/send", async (req, res) => {
  try {
    const { text, user } = req.body;
    if (!text || !user) return res.status(400).json({ error: "Text and user required" });

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
  } catch (err) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

// 🚀 Start server
const PORT = process.env.PORT;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port " + PORT);
});
