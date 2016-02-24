import Express from 'express';
import Response from 'plivo-promise/lib/PlivoResponse';
import bodyParser from 'body-parser';

const app = Express();
app.use(bodyParser.urlencoded({extended: true}));

// This file will be played when a caller presses 2.
const PLIVO_SONG = "https://s3.amazonaws.com/plivocloud/music.mp3";

// This is the message that Plivo reads when the caller dials in
const IVR_MESSAGE1 = "Welcome to the Plivo IVR Demo App. This is all running on a webtask, which is cool because webtask does not support plivo, Press 1 to listen to a pre recorded text in different languages. Press 2 to listen to a song.";

const IVR_MESSAGE2 = "Press 1 for English. Press 2 for French. Press 3 for Russian";

// This is the message that Plivo reads when the caller does nothing at all
const NO_INPUT_MESSAGE = "Sorry, I didn't catch that. Please hangup and try again later.";

// This is the message that Plivo reads when the caller inputs a wrong number.
const WRONG_INPUT_MESSAGE = "Sorry, you've entered an invalid input.";


// app.use(bodyParser.urlencoded({extended: true}));
app.use(function(request, res, next){
  let usableSlug = request.originalUrl.replace(request.path, '');
  if( usableSlug.indexOf('?') !== -1 ){
    usableSlug = usableSlug.substring(0, usableSlug.indexOf('?'));
  }
  request.usableSlug = usableSlug;
  next();
});

app.get("/", function(){
  res.json({
    "action": "Call",
    "emoticon": "Please",
    "number": ""
  })
});


app.get('/response/ivr/', function(request, response) {
  const r = new Response();

  const getdigits_action_url =  'https://' + request.headers.host + request.usableSlug + '/response/choose/';
  const params = {
    'action': getdigits_action_url,
    'method': 'POST',
    'timeout': '7',
    'numDigits': '1',
    'retries': '1'
  };
  const getDigits = r.addGetDigits(params);

  getDigits.addSpeak(IVR_MESSAGE1);
  r.addSpeak(NO_INPUT_MESSAGE);

  response.set({'Content-Type': 'text/xml'});
  response.send(r.toXML());
});

app.post('/response/choose/', function(request, response) {
  const r = new Response();
  const digit = request.body.Digits;  
  if (digit === '1') {
    const getdigits_action_url = 'https://' + request.headers.host + request.usableSlug + '/response/tree/';
    const params = {
      'action': getdigits_action_url,
      'method': 'GET',
      'timeout': '7',
      'numDigits': '1',
      'retries': '1'
    };
    const getDigits = r.addGetDigits(params);
    getDigits.addSpeak(IVR_MESSAGE2);
    r.addSpeak(NO_INPUT_MESSAGE);
  } else if (digit === '2') {
    r.addPlay(PLIVO_SONG);
  } else {
    r.addSpeak(WRONG_INPUT_MESSAGE);
  }

  response.set({'Content-Type': 'text/xml'});
  response.send(r.toXML());
});

app.get('/response/tree/', function(request, response) {
  var r = new Response();
  let text = WRONG_INPUT_MESSAGE, params = {};
  const digit = request.body.Digits || request.query.Digits;
  
  switch (digit){
    case "1": 
      text = "This message is being read out in English";
      params = {'language': 'en-US'};
    break;
    case "2":
      text = "Ce message est lu en français";
      params = {'language': 'fr-FR'};
    break;
    case "3":
      text = "Это сообщение было прочитано в России";
      params = {'language': 'ru-RU'};
    break;
  }  

  r.addSpeak(text, params);
  response.set({'Content-Type': 'text/xml'});
  response.send(r.toXML());
});


export default app;
