const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

function print(...msg) {
  console.log(...msg);
}

mongoose.connect('mongodb://localhost:27017/chats', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).catch((error) => print(error));
print("Connected to MongoDB");

const { Chat, Message, User } = require('./models');
const validatePostRequest = require('./validations');
const validateExtraFields = require('./validate_extra_fields');
const sendToDevice = require('./firebase_setup');

app.use(bodyParser.json());

app.get('/', async (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Endpoint to store/update the fcm token of a user
app.post('/users/:id', async (req, res) => {
  print(`get request at /users/`, req.params.id);
  const token = req.body.token;
  print(`token:`, token);
  print(`id:`, req.params.id);
  try {
    var user = await User.findOneAndUpdate(
      { id: req.params.id },
      { $set: { token: token } },
      { new: true, upsert: true }
    );
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: `${error}` });
    print("Error: ", error);
  }
});

// Endpoint to get chat data by ID
app.get('/chats/:id', async (req, res) => {
  print(`get request at /chat/${req.params.id}`);
  try {
    const chat = await Chat.findById(req.params.id);
    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: `${error}` });
    print("Error: ", error);
  }
});

// Endpoint to create a new chat
app.post('/chats', async (req, res) => {
  print(`post request at /chat`);
  print(`req.body = `, req.body);
  const err = validatePostRequest(req.body, Chat);
  validateExtraFields(req.body, Chat);
  if (err != null) {
    console.error(err);
    res.status(400).json({ error: err });
    return;
  }
  try {
    const newChat = await Chat.create(req.body);
    res.json(newChat);
  } catch (error) {
    res.status(500).json({ error: `${error}` });
    print("Error: ", error);
  }
});

// // Endpoint to get chats with unread messages for a user
// app.get('/chats/unread/:userId', async (req, res) => {
//   print(`get request at /chats/unread/${req.params.userId}`);
//   try {
//     const unreadChats = await Chat.find({ participants: req.params.userId, 'messages.readBy': { $ne: req.params.userId } });
//     res.json(unreadChats);
//   } catch (error) {
//     res.status(500).json({ error: `${error}` });
//     print("Error: ", error);
//   }
// });

// Endpoint to get all chats for a user
app.get('/chats/all/:userId', async (req, res) => {
  print(`get request at /chats/all/${req.params.userId}`);
  try {
    const allChats = await Chat.find({ participants: req.params.userId });
    res.json(allChats);
  } catch (error) {
    res.status(500).json({ error: `${error}` });
    print("Error: ", error);
  }
});

// Endpoint to get a message by ID
// app.get('/messages/:id', async (req, res) => {
//   print(`get request at /messages/${req.params.userId}`);
//   try {
//     const message = await Message.findById(req.params.id);
//     res.json(message);
//   } catch (error) {
//     res.status(500).json({ error: `${error}` });
//     print("Error: ", error);
//   }
// });

// Endpoint to create a new message
app.post('/messages/:chatId', async (req, res) => {
  print(`post request at /message/${req.params.chatId}`);
  req.body.chatId = req.params.chatId;
  const err = validatePostRequest(req.body, Message);
  validateExtraFields(req.body, Message);
  if (err != null) {
    console.error(err);
    res.status(400).json({ error: err });
    return;
  }
  try {
    const newMessage = await Message.create(req.body);
    res.json(newMessage);
    const chat = await Chat.findById(req.params.chatId);
    print("chat with id", req.params.chatId, "=", chat);
    const participants = chat.participants;
    print("participants", participants);
    participants.forEach(async (participant) => {
      console.log("finding participant: ", participant);
      const user = await User.findOne({ id: participant });
      console.log("participant found: ", user);
      if (user && user.token) {
        console.log("sending msg: to user", user);
        sendToDevice(user.token, newMessage, newMessage.from, newMessage.txt);
      }
    });
  } catch (error) {
    res.status(500).json({ error: `${error}` });
    print("Error: ", error);
  }
});

// Endpoint to get messages of a chat
app.get('/messages/:chatId', async (req, res) => {
  print(`get request at /messages/`, req.params.chatId);
  try {
    const { limit, startID } = req.query;
    var messages = [];
    if (!startID) {
      messages = await Message.find({ chatId: req.params.chatId })
        .sort({ createdAt: 'desc' })
        .limit(limit ? parseInt(limit) : 10);
    } else {
      messages = await Message.find({ chatId: req.params.chatId, _id: { $lte: startID } })
        .sort({ createdAt: 'desc' })
        .limit(limit ? parseInt(limit) : 10);
    }
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: `${error}` });
    print("Error: ", error);
  }
});

// Endpoint to add userID to the readBy array of a message
app.post('/messages/:id/readBy', async (req, res) => {
  print(`get request at /messages/${req.params.userId}/readBy`);
  try {
    const message = await Message.findByIdAndUpdate(req.params.id, { $addToSet: { readBy: req.body.userId } }, { new: true });
    res.status(200).json(message);
  } catch (error) {
    res.status(500).json({ error: `${error}` });
    print("Error: ", error);
  }
});

app.listen(port, () => {
  print(`Server is running on port ${port}`);
});
