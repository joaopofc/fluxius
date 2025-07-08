var admin = require("firebase-admin");

var serviceAccount = require("./chaves.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://my-apps-fomor-default-rtdb.firebaseio.com"
});
