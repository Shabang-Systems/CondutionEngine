// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
//
// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');
admin.initializeApp();
admin.firestore().settings({timestampsInSnapshots: true});

const E = require('../CondutionEngine');

E.start({admin}, "fb-admin");
E.use("fb-admin");

// Take the text parameter passed to this HTTP endpoint and insert it into 
// Cloud Firestore under the path /messages/:documentId/original
/*exports.addTask = functions.https.onRequest(async (req, res) => {*/
    //// Grab the text parameter.
    //// Send back a message that we've succesfully written the message
    
    //if (!req.query.token) {
        //res.json({error: "Missing auth token"})
        //return;
    //};
    //admin.auth().verifyIdToken(req.query.token)
      //.then(function(decodedToken) {
          //let uid = decodedToken.uid;
          //let ntObject = {
              //desc: "",
              //isFlagged: false,
              //isFloating: false,
              //isComplete: false,
              //project: "",
              //tags: [],
              //timezone: "America/Los_Angeles",
              //repeat: {rule: "none"},
              //name: "A nananana papapa",
          //};
          //E.db.newTask(uid, ntObject);
          //res.json({result: uid});
      //}).catch(function(error) {
          //console.log(error);
          //res.json({error: error});
      //});
//});

exports.addTask = functions.https.onRequest(async (req, res) => {
    // Grab the text parameter.
    // Send back a message that we've succesfully written the message
    
    let uid = req.query.uid;
    let ntObject = {
      desc: req.query.desc ? req.query.desc : "",
      isFlagged: false,
      isFloating: true,
      isComplete: false,
      project: "",
      tags: [],
      timezone: req.query.tz ? req.query.tz : "America/Los_Angeles",
      repeat: {rule: "none"},
      name: req.query.name ? req.query.name : "",
    };
    E.db.newTask(uid, ntObject).then(function(ntid) {
      res.json({result: "success", uid, payload: {taskId:ntid, taskObject: ntObject}})
    }).catch(function(error) {
      console.log(error);
      //res.json({result: "error", message: "There was an error writing your file", error: error});
      res.send(500, JSON.stringify({result: "error", payload: error}))
    });
});


