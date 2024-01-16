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
    userId: String,
    agentId: { type: String, default: null },
    name: String,
    email: String,
    photo: {
        type: String,
        default: null,
    },
    phoneNumber: {
        type: String,
        default: null,
    },
    gender: Number,
    dob: {
        type: Date,
        default: null,
    },
    country: {
        type: String,
        default: null,
    },
    frame: {
        type: String,
        default: null,
    },
    audioRoomBackground: {
        type: String,
        default: null,
    },
    chatBubble: {
        type: String,
        default: null,
    },
    entry: {
        type: String,
        default: null,
    },
    password: {
        type: String,
        default: null,
    },
    beansCount: { type: Number, default: 0 },
    diamondsCount: { type: Number, default: 0 },
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    friends: { type: Number, default: 0 },
    role: { type: String, default: "user" },
    isVerified: { type: Boolean, default: false },
    token: { type: String, required: false }
});

const Message = mongoose.model('Message', messageSchema);

const Chat = mongoose.model('Chat', chatSchema);

const User = mongoose.model('Users', userSchema);

module.exports = { Message, Chat, User };
