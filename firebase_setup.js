const admin = require("firebase-admin");
const serviceAccount = require(__dirname + "/mastiplay-31ca8-firebase-adminsdk-7chw1-9d85969a11.json");
const { User } = require('./models');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://mastiplay-31ca8-default-rtdb.firebaseio.com"
});

async function sendToDevice(token, payload, title, body) {
    console.log("Sending notification to", token);
    const data = JSON.stringify(payload);
    console.log("data = ", data);
    const notification = {
        "data": {
            message: data
        },
        "token": token,
    };
    if (title && body) {
        notification["notification"] = {
            title: title,
        };
        if (body.toString().startsWith("![image](")) {
            const imgUrl = body.toString().split("![image](")[1].split(")")[0];
            notification["android"] = {
                notification: {
                    imageUrl: imgUrl
                }
            };
        } else {
            notification["notification"].body = body;
        }
    }
    await admin.messaging().send(notification);
}

async function getUserDataById(id) {
    try {
        const userData = User.findOne({ id: id });
        return userData;
    } catch (error) {
        console.error('Error getting user data: ', error);
        throw error;
    }
}

async function sendMsgToAll(payload, title, body, imgUrl) {
    const data = JSON.stringify(payload);
    const notification = {
        "data": {
            message: data
        },
        topic: "all"
    };
    if (imgUrl) {
        notification["android"] = {
            notification: {
                imageUrl: imgUrl
            }
        };
    }
    if (title && body) {
        notification["notification"] = {
            title: title,
            body: body
        };
    }
    await admin.messaging().send(notification);
}

module.exports = { sendToDevice, getUserDataById, sendMsgToAll };