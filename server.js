const express = require('express')
const bodyParser = require('body-parser')
const Pusher = require('pusher')
const cors = require('cors')
const firebase = require('firebase')
const admin = require('firebase-admin')

require('dotenv').config()

const shortId = require('shortid')
const dialogFlow = require('./diagflow')
const app = express()


const functions = require('firebase-functions')
const {
  WebhookClient
} = require('dialogflow-fulfillment')
const {
  Card,
  Suggestion,
  BasicCard,
  Button,
  Image
} = require('dialogflow-fulfillment')
const {
  dialogflow
} = require('actions-on-google')

const conv = dialogflow({
  debug: true
});


const pusher = new Pusher({
  appId: '763384',
  key: '7e68e39c122f6cbf6b79',
  secret: '9be54d8e58c065d44a06',
  cluster: 'mt1',
  encrypted: true
})


const firebaseConfig = {
  apiKey: "AIzaSyBbcT4BZ8tiDWsrbV16eFgo_z17bqBsOBs",
  authDomain: "chanjia-e9ddb.firebaseapp.com",
  databaseURL: "https://chanjia-e9ddb.firebaseio.com",
  projectId: "chanjia-e9ddb",
  storageBucket: "chanjia-e9ddb.appspot.com",
  messagingSenderId: "885878744432"

}




app.use(cors())

app.use(bodyParser.urlencoded({
  extended: false
}))

app.use(bodyParser.json())


admin.initializeApp(firebaseConfig)

// Required by Firebase
exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);



























process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({
    request,
    response
  });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));


  function welcome(agent) {
    agent.add(`Hi! My name is Keti and i'll be your electronic oncology consultant.`);
  }


  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);

  agent.handleRequest(intentMap);
});



app.post('/getUser', (req, res) => {

  //console.log(req.headers)

  const token = req.headers.authorization.split('Bearer ')[1]

  return admin.auth().verifyIdToken(token)
    .then(decodedToken => {
      const uid = decodedToken.uid;
      console.log(uid);
      console.log('Dext was here');

      res.status(200).send('Looks good!')

    })
    .catch(err => res.status(403).send('Unauthorized'))


})


app.post('/message', async (req, res) => {
  // simulate actual db save with id and createdAt added
  //console.log(req.body);
  const chat = {
    ...req.body,
    id: shortId.generate(),
    createdAt: new Date().toISOString()
  }
  //update pusher listeners
  pusher.trigger('chat-bot', 'chat', chat)

  const message = chat.message;
  try {
    const response = await dialogFlow.send(message);
    // trigger this update to our pushers listeners
    pusher.trigger('chat-bot', 'chat', {
      message: `${response.data.result.fulfillment.speech}`,
      type: 'bot',
      createdAt: new Date().toISOString(),
      id: shortId.generate()
    })
    res.send(chat)
  } catch (e) {
    console.log('Catch an error: ', e)
  }

})

app.listen(process.env.PORT , () => console.log('Listening at port' + process.env.PORT))