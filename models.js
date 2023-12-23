const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    id: {
        type: String,
        unique: true,
        required: true,
    },
    txt: {
        type: String,
        required: true,
    },
    from: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        required: true,
    },
    modifiedAt: {
        type: Date,
        required: true,
    },
    readBy: {
        type: [String],
        unique: true,
    },
    indicative: {
        type: Boolean,
        required: true,
    },
    chatId: {
        type: String,
        required: true,
    },
    deletedAt: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});

const chatSchema = new mongoose.Schema({
    id: {
        type: String,
        unique: true,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    participants: {
        type: [String],
        required: true,
    },
    locked: {
        type: Boolean,
        required: true,
    },
}, {
    timestamps: true,
});

const Message = mongoose.model('Message', messageSchema);

const Chat = mongoose.model('Chat', chatSchema);

module.exports = { Message, Chat };
