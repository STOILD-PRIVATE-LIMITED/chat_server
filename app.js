const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const port = 3000; // You can use any port you prefer

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/chats', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Models
const { Chat, Message } = require('./models'); // Assuming your models are in a 'models' directory

app.use(bodyParser.json());

// Endpoint to get chat data by ID
app.get('/chat/:id', async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to create a new chat
app.post('/chat', async (req, res) => {
  try {
    const newChat = await Chat.create(req.body);
    res.json(newChat);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to get chats with unread messages for a user
app.get('/chats/unread/:userId', async (req, res) => {
  try {
    const unreadChats = await Chat.find({ participants: req.params.userId, 'messages.readBy': { $ne: req.params.userId } });
    res.json(unreadChats);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to get all chats for a user
app.get('/chats/all/:userId', async (req, res) => {
  try {
    const allChats = await Chat.find({ participants: req.params.userId });
    res.json(allChats);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to get a message by ID
app.get('/message/:id', async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to create a new message
app.post('/message/:chatId', async (req, res) => {
  try {
    const newMessage = await Message.create({
      ...req.body,
      chatId: req.params.chatId,
    });
    res.json(newMessage);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to get messages of a chat
app.get('/messages/:chatId', async (req, res) => {
  try {
    const { limit, startID } = req.query;
    const messages = await Message.find({ chatId: req.params.chatId, _id: { $lte: startID } })
      .sort({ createdAt: 'desc' })
      .limit(limit ? parseInt(limit) : 10);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to add userID to the readBy array of a message
app.post('/message/:id/readBy', async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(req.params.id, { $addToSet: { readBy: req.body.userId } }, { new: true });
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
