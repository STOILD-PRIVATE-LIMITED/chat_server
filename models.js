const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    txt: {
        type: String,
        required: true,
    },
    from: {
        type: String,
        required: true,
    },
    readBy: {
        type: [String],
        unique: false,
    },
    indicative: {
        type: Boolean,
        required: false,
    },
    chatId: {
        type: String,
        required: true,
    },
    deletedAt: {
        type: String,
        required: false,
    },
}, {
    timestamps: true,
});

const chatSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: false,
    },
    participants: {
        type: [String],
        required: true,
    },
    admins: {
        type: [String],
        required: true,
    },
    locked: {
        type: Boolean,
        required: false,
    },
}, {
    timestamps: true,
});

const userSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
    },
    token: {
        type: String,
        required: false,
    }
}, {
    timestamps: true,
});

const Message = mongoose.model('Message', messageSchema);

const Chat = mongoose.model('Chat', chatSchema);

const User = mongoose.model('User', userSchema);

module.exports = { Message, Chat, User };
