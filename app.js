const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.json());

// Define Message Schema
const messageSchema = new mongoose.Schema({
  id: String,
  txt: String,
  from: String,
  createdAt: Date,
  modifiedAt: Date,
  readBy: [
    {
      type: String,
      unique: true,
    },
  ],
  indicative: Boolean,
  deletedAt: Date,
});

// Define Chat Schema
const chatSchema = new mongoose.Schema({
  id: String,
  title: String,
  description: [],
  participants: [],
  messages: [messageSchema],
  locked: Boolean,
});

// Create Message and Chat Models
const Message = mongoose.model("Message", messageSchema);
const Chat = mongoose.model("Chat", chatSchema);
// MongoDB Connection0
mongoose
  .connect("mongodb://0.0.0.0:27017/chat", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Successfully connected to database");
  });

// REST API Endpoints
// Fetch chat by ID from MongoDB
app.get("/api/chats/:id", async (req, res) => {
  console.log(`request to /api/chats/${req.params.id}`);
  console.log(`req = ${req}`);
  console.log(`res = ${res}`);
  try {
    const chatId = req.params.id;
    const chat = await Chat.findOne({ id: chatId });
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }
    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create a chat
app.post("/api/chats", async (req, res) => {
  console.log(`request to /api/chats`);
  console.log(`req = ${req}`);
  console.log(`res = ${res}`);
  // Create a new chat in MongoDB
  try {
    const newChat = new Chat(req.body);
    // TODO: add time.now as createdAt into the chat
    // TODO: add time.now as modifiedAt into the chat
    const savedChat = await newChat.save();
    res.status(201).json(savedChat);
  } catch (err) {
    res.status(500).json({ error: "Failed to create chat" });
  }
});

// Fetch Messages of a Chat
app.get("/api/chats/:id/messages", async (req, res) => {
  console.log(`request to /api/chats/${req.params.id}/messages`);
  console.log(`req = ${req}`);
  console.log(`res = ${res}`);
  try {
    const chatId = req.params.id;
    const chat = await Chat.findOne({ id: chatId });
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }
    const messages = chat.messages;
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create a New Message in a Chat
app.post("/api/chats/:id/messages", async (req, res) => {
  console.log(`post request to /api/chats/${req.params.id}/messages`);
  console.log(`req = ${req}`);
  console.log(`res = ${res}`);
  try {
    const chatId = req.params.id;
    const chat = await Chat.findOne({ id: chatId });
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }
    const newMessage = new Message(req.body);
    // TODO: add time.now as createdAt into the msg
    // TODO: add time.now as modifiedAt into the msg
    chat.messages.push(newMessage);
    await chat.save();
    io.to(chatId).emit("newMessage", newMessage);
    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ error: "Failed to create message" });
  }
});

// Create an endpoint to add userID (given in request) to the msg's readBy array
// Don't create a list in chats for msg id, instead create a new field in messages for chatID and create a separate table of messages
// create a fetch chats api for every user to include these params: userID,startID,limit with these values meaning the same as discussed
// change the fetch msg api to include these params: chatID,startID,limit with these values meaning the same as discussed

// Socket.IO handling
io.on("connection", (socket) => {
  console.log("A user connected");

  // Join a specific chat room
  socket.on("joinChat", (chatId) => {
    socket.join(chatId);
    console.log(`User joined chat ${chatId}`);
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
