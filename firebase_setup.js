const admin = require("firebase-admin");
const serviceAccount = require(__dirname + "/mastiplay-31ca8-firebase-adminsdk-7chw1-9d85969a11.json");
const { User } = require('./models');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://mastiplay-31ca8-default-rtdb.firebaseio.com"
});

function sendToDevice(token, payload, title, body) {
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
            body: body
        };
    }
    admin.messaging().send(notification);
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

// const followerId = '54299103';
// getUserDataById(followerId)
//     .then(userData => {
//         if (userData) {
//             console.log('User Data:', userData);
//         } else {
//             console.log('User not found.');
//         }
//     })
//     .catch(error => {
//         console.error('Error:', error);
//     });


module.exports = sendToDevice;