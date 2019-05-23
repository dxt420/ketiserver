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


app.use(cors())

app.use(bodyParser.urlencoded({
  extended: false
}))

app.use(bodyParser.json())

firebase.initializeApp({
  apiKey: "AIzaSyBbcT4BZ8tiDWsrbV16eFgo_z17bqBsOBs",
  authDomain: "chanjia-e9ddb.firebaseapp.com",
  databaseURL: "https://chanjia-e9ddb.firebaseio.com",
  projectId: "chanjia-e9ddb",
  storageBucket: "chanjia-e9ddb.appspot.com",
  messagingSenderId: "885878744432"

})

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_APP_KEY,
  secret: process.env.PUSHER_APP_SECRET,
  cluster: 'mt1',
  encrypted: true
})


app.post('/getUser', (req, res) => {

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
  console.log(req.body);
  const chat = {
    ...req.body,
    id: shortId.generate(),
    createdAt: new Date().toISOString()
  }
  //update pusher listeners
  pusher.trigger('chat-bot', 'chat', chat)

  const message = chat.message;
  const response = await dialogFlow.send(message);
  // trigger this update to our pushers listeners
  pusher.trigger('chat-bot', 'chat', {
    message: `${response.data.result.fulfillment.speech}`,
    type: 'bot',
    createdAt: new Date().toISOString(),
    id: shortId.generate()
  })
  res.send(chat)
})

app.listen(process.env.PORT || 5000, () => console.log('Listening at 5000'))