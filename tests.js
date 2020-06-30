var firebase = require("firebase/app");
var E = require('./Engine.js');

require("firebase/auth");
require("firebase/firestore");

E.start("firebase", firebase, "./secrets.json");


