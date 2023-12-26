var admin = require("firebase-admin");
var serviceAccount = require(__dirname + "/mastiplay-31ca8-firebase-adminsdk-7chw1-9d85969a11.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://mastiplay-31ca8-default-rtdb.firebaseio.com"
});

function sendToDevice(token, payload) {
    admin.messaging().send({
        "data": payload,
        "token": token,
    });
}

module.exports = sendToDevice;