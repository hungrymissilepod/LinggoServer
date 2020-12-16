const express = require('express');
const router = express.Router();
const { validationResult, query } = require('express-validator');
const AWS = require('aws-sdk');
const { Stream } = require('stream');

// Create Polly client
const Polly = new AWS.Polly({
  signatureVersion: 'v4',
  region: 'us-east-1',
});

router.get('/',
[
  query('text', 'text is required').not().isEmpty(),
  query('textType', 'textType is required').not().isEmpty(),
  query('outputFormat', 'outputFormat is required').not().isEmpty(),
  query('voiceId', 'voiceId is required').not().isEmpty(),
],
async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  var params = { 'Text': decodeURI(req.query.text), 'TextType': req.query.textType, 'OutputFormat': req.query.outputFormat, 'VoiceId': req.query.voiceId }
  console.log(params);

  Polly.synthesizeSpeech(params, (err, data) => {
    if (err) {
        console.log(err.code); res.sendStatus(500);
    } else if (data) {
      if (data.AudioStream instanceof Buffer) {
        const bufferStream = new Stream.PassThrough();
        bufferStream.end(new Buffer(data.AudioStream));
        res.set({
          'Content-Type': 'audio/ogg',
        });
        bufferStream.on('error', bufferError => {
          res.sendStatus(400);
        });
        bufferStream.pipe(res);
      }
    }
  })
});

// router.get('/',
// [
//   header('text', 'text is required').not().isEmpty(),
//   header('textType', 'textType is required').not().isEmpty(),
//   header('outputFormat', 'outputFormat is required').not().isEmpty(),
//   header('voiceId', 'voiceId is required').not().isEmpty(),
// ],
// async (req, res) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({ errors: errors.array() });
//   }

//   var params = { 'Text': decodeURI(req.header('text')), 'TextType': req.header('textType'), 'OutputFormat': req.header('outputFormat'), 'VoiceId': req.header('voiceId') }
//   console.log(params);

//   Polly.synthesizeSpeech(params, (err, data) => {
//     if (err) {
//         console.log(err.code); res.sendStatus(500);
//     } else if (data) {
//       if (data.AudioStream instanceof Buffer) {
//         const bufferStream = new Stream.PassThrough();
//         bufferStream.end(new Buffer(data.AudioStream));
//         res.set({
//           'Content-Type': 'audio/ogg',
//         });
//         bufferStream.on('error', bufferError => {
//           res.sendStatus(400);
//         });
//         bufferStream.pipe(res);
//       }
//     }
//   })
// });

// save Polly sound file

/*

const Fs = require('fs');

Polly.synthesizeSpeech(params, (err, data) => {
if (err) {
    console.log(err.code)
} else if (data) {
    if (data.AudioStream instanceof Buffer) {
        Fs.writeFile("./speech.ogg", data.AudioStream, function(err) {
            if (err) {
                return console.log(err)
            }
            console.log("The file was saved!")
        })
    }
}
})

*/

module.exports = router;