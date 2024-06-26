const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { exec } = require('child_process');

const app = express();
const port = 3001;

function print(...msg) {
  console.log(...msg);
}

mongoose.connect('mongodb://0.0.0.0:27017/mastiplay1', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).catch((error) => print(error));

const { Chat, Message, User } = require('./models');
const validatePostRequest = require('./validations');
const validateExtraFields = require('./validate_extra_fields');
const { sendToDevice, getUserDataById, sendMsgToAll } = require('./firebase_setup');

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
      { userId: req.params.id },
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
    req.body.participants = req.body.participants.sort();
    const existingChat = await Chat.findOne({ participants: req.body.participants });

    if (existingChat) {
      res.json(existingChat);
    } else {
      const newChat = await Chat.create(req.body);
      res.json(newChat);
    }
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

// Endpoint to delete a msg by ID
app.delete('/messages/:id', async (req, res) => {
  print(`delete request at /messages/${req.params.id}`);
  try {
    const message = await Message.findByIdAndDelete(req.params.id);
    res.json(message);
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
      const user = await User.findOne({ userId: participant });
      console.log("participant found: ", user);
      if (user && user.token) {
        console.log("sending msg: to user", user);
        try {
          const title = newMessage.from;
          const body = newMessage.txt;
          if (user.userId == newMessage.from) { sendToDevice(user.token, newMessage, null, null); }
          else { sendToDevice(user.token, newMessage, title, body); }
        }
        catch (e) {
          console.error("Error while sending notification:", e);
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: `${error}` });
    print("Error: ", error);
  }
});

// Endpoint to create a new message
app.post('/admin-message', async (req, res) => {
  print(`post request at /admin-message`);
  try {
    print("req.body = ", req.body);
    // broadcast a fcm msg to all users
    const payload = req.body.payload;
    const title = req.body.title;
    const body = req.body.body;
    const imgUrl = req.body.imgUrl;
    await sendMsgToAll(payload, title, body, imgUrl);
    print("Message sent to all users");
    res.status(200).send('Message sent to all users');
  } catch (error) {
    res.status(500).json({ error: `${error}` });
    print("Error: ", error);
  }
});

app.post('/api/update-server', async (req, res) => {
  console.log("Updating Server: ");
  const payload = req.body;
  if ((payload && payload.force && payload.force == true) || (payload && payload.ref === 'refs/heads/master')) {
    exec('git reset --hard && git pull', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        res.status(500).send('Internal Server Error');
        return;
      }
      console.log(`Git Pull Successful: ${stdout}`);
      res.status(200).send('Server Updated Successfully');
    });
  } else {
    res.status(200).send('Ignoring non-master branch push event');
  }
});

// Endpoint to get messages of a chat
app.get('/messages/:chatId', async (req, res) => {
  print(`get request at /messages/`, req.params.chatId);
  try {
    const { limit, startID } = req.query;
    let messages;
    if (!startID) {
      const query = { chatId: req.params.chatId };
      const sortedQuery = Message.find(query).sort({ createdAt: 'desc' });
      messages = limit ? await sortedQuery.limit(parseInt(limit)) : await sortedQuery.exec();
    } else {
      const query = { chatId: req.params.chatId, _id: { $lte: startID } };
      const sortedQuery = Message.find(query).sort({ createdAt: 'desc' });
      messages = limit ? await sortedQuery.limit(parseInt(limit)) : await sortedQuery.exec();

      // messages = await Message.find({ chatId: req.params.chatId, _id: { $lte: startID } })
      //   .sort({ createdAt: 'desc' })
      //   .limit(limit ? parseInt(limit) : 10);
    }
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: `${error}` });
    print("Error: ", error);
  }
});

app.get('/last-message/:chatId', async (req, res) => {
  print(`get request at /last-message/`, req.params.chatId);
  try {
    const message = await Message.findOne({ chatId: req.params.chatId }).sort({ createdAt: 'desc' });
    res.status(200).json(message);
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
