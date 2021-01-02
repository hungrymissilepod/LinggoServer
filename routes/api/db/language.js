const express = require('express');
const router = express.Router();
const auth = require('../../../middleware/auth');
const { validationResult, header, query } = require('express-validator');

const mongoose = require('mongoose');
const LanguageSchema = require('../../../models/Language');
var LanguageModel = mongoose.model('languageModel', LanguageSchema, 'Chinese');

// @route   POST api/db/language
// @params  language (which language data we are posting)
// @desc    Post user language data to database
// @access  Private
router.post('/', auth.verifyJWTToken,
[
  header('uid', 'uid is required').not().isEmpty(),
  header('timeStamp', 'TimeStamp is required').not().isEmpty(),
  header('updated', 'Updated is required').not().isEmpty(),
  query('language', 'language param is required').not().isEmpty(),
],
async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const uid = req.header('uid');
  const timeStamp = req.header('timeStamp');
  const updated = req.header('updated');
  const language = req.query.language;
  LanguageModel = mongoose.model('languageModel', LanguageSchema, language); // set collection to language from params

  // Make sure uid from header matches uid from token. So user can only access their own data
  if (uid != req.uid) return res.status(401).json({ msg: 'Not authorized to access this data' });

  const {
    version,
    build,
    id,
    words,
    questions,
  } = req.body;

  const userData = {
    uid,
    version,
    build,
    id,
    words,
    questions,
    timeStamp,
    updated,
  }

  try {
    // Check is user language data already exists
    let data = await LanguageModel.findOne({ uid: uid });

    // If data exists, update
    if (data) {
      data = await updateLanguageData(data, userData);
      return languageDataUpdateTime(res, data, timeStamp, updated);
    }
    return res.status(200).send(createLanguageData(data, userData));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

async function createLanguageData(data, userData) {
  // userData.timeStamp = timeStamp; userData.updated = updated;
  data = new LanguageModel(userData);
  await data.save();
  return data;
}

async function updateLanguageData(data, userData) {
  data = await LanguageModel.findOneAndUpdate(
    { uid: data.uid }, // find by uid
    { $set: userData }, // update all userData
    { new: true }
  );
  return data;
}

// ! testing out new method of simply updating timeStamp and updated to whatever we get sent. Don't think there is need to check this
async function languageDataUpdateTime(res, data, timeStamp, updated) {
  data = await LanguageModel.findOneAndUpdate( { uid: data.uid }, { $set: { 'timeStamp': timeStamp, 'updated': updated } }, { new: true } );
  // if (timeStamp > data.timeStamp) {
  //   if (timeStamp <= new Date().getTime()) { // ensure that the [timeStamp] time sent is not in the future (compare to server time)
  //     if (updated > data.updated) {
  //       data = await LanguageModel.findOneAndUpdate( { uid: data.uid }, { $set: { 'timeStamp': timeStamp, 'updated': updated } }, { new: true } );
  //       // data = await LanguageModel.findOneAndUpdate( { uid: data.uid, 'timeStamp': { $lt: timeStamp }, 'updated': { $lt: updated } }, { $set: { 'timeStamp': timeStamp }, $set: { 'updated': updated } }, { new: true } );
  //     }
  //   }
  // }
  return res.json(data);
}

// @route   GET api/db/language/:user_id
// @desc    Get user language data by user id
// @access  Private
router.get('/:user_id', auth.verifyJWTToken,
[
  query('language', 'language param is required').not().isEmpty(),
],
async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Get uid from JWTToken. We need to make sure users can only get their OWN data
  const uid = req.uid;
  // Get the user_id param from request
  const user_id = req.params.user_id;

  if (uid != user_id) return res.status(401).json({ msg: 'Not authorized to access this data' });
  
  const language = req.query.language;
  LanguageModel = mongoose.model('languageModel', LanguageSchema, language); // set collection to language from params

  try {
    const data = await LanguageModel.findOne({uid: user_id});
    if (!data) { return res.status(400).json({ msg: 'User data not found' }); }
    return res.status(200).json(data);
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'User data not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/db/language/:user_id/updated
// @desc    Get user language data updated value by user id
// @access  Private
router.get('/:user_id/updated', auth.verifyJWTToken,
[
  query('language', 'language param is required').not().isEmpty(),
],
async (req, res) => {
  const uid = req.uid;
  const user_id = req.params.user_id;
  if (uid != user_id) return res.status(401).json({ msg: 'Not authorized to access this data' });
  
  const language = req.query.language;
  LanguageModel = mongoose.model('languageModel', LanguageSchema, language); // set collection to language from params

  try {
    const data = await LanguageModel.findOne({uid: user_id});
    if (!data) return res.status(400).json({ msg: 'User data not found' });
    res.status(200).json(data.updated);
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'User data not found' });
    }
    res.status(500).send('Server Error');
  }
});

/// ---------
/// WORD
/// ---------

// @route   POST api/db/language/w
// @params  language (which language data we are posting)
// @desc    Post word to language collection
// @access  Private
router.post('/w/:word_id', auth.verifyJWTToken,
[
  header('uid', 'uid is required').not().isEmpty(),
  header('timeStamp', 'TimeStamp is required').not().isEmpty(),
  header('updated', 'Updated is required').not().isEmpty(),
  query('language', 'language param is required').not().isEmpty(),
],
async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const uid = req.header('uid');
  const timeStamp = req.header('timeStamp');
  const updated = req.header('updated');
  const language = req.query.language;
  LanguageModel = mongoose.model('languageModel', LanguageSchema, language); // set collection to language from params

  // Get Word data from body and params
  const word = req.body;
  const word_id = parseInt(req.params.word_id);

  // Make sure uid from header matches uid from token. So user can only access their own data
  if (uid != req.uid) return res.status(401).json({ msg: 'Not authorized to access this data' });

  try {
    // Check is user language document exists
    let data = await LanguageModel.findOne({ uid: uid });

    // If document does not exist
    if (!data) {
      const userData = { uid, timeStamp, updated };
      data = await createLanguageData(data, userData);
      // data = await createLanguageData(data, { uid: uid }, timeStamp, updated);
    }
    // Try to find Word in array
    // Find document with mathing user id and word with matching word_id
    await LanguageModel.findOne({ uid: uid, "words.id": word_id }, async function(err, result) {
      if(err) { return res.status(500).send(err.message); }
      if (result == null) { // if this word does not exist in document (not in array), add this Word to array
        await LanguageModel.updateOne({ uid: uid }, { "$addToSet": { "words": word } }, function(err, d1) {
          if(err) { return res.status(500).send(err.message); }
        });
      } else { // if this Word already exists in document, update this Word values
        await LanguageModel.updateOne({ uid: uid, words: { $elemMatch: { "id": word_id } } }, { $set: { 'words.$': word } }, function(err, d2) {
          if(err) { return res.status(500).send(err.message); }
        });
      } // * using updateOne method DOES NOT return new version of document. Please note we are returning the OLD version of the document.
      return languageDataUpdateTime(res, data, timeStamp, updated);
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server error');
  }
});

/// ---------
/// QUESTION
/// ---------

// @route   POST api/db/language/q
// @params  language (which language data we are posting)
// @desc    Post question to language collection
// @access  Private
router.post('/q/:question_id', auth.verifyJWTToken,
[
  header('uid', 'uid is required').not().isEmpty(),
  header('timeStamp', 'TimeStamp is required').not().isEmpty(),
  header('updated', 'Updated is required').not().isEmpty(),
  query('language', 'language param is required').not().isEmpty(),
],
async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const uid = req.header('uid');
  const timeStamp = req.header('timeStamp');
  const updated = req.header('updated');
  const language = req.query.language;
  LanguageModel = mongoose.model('languageModel', LanguageSchema, language); // set collection to language from params

  // Get Question data from body and params
  const question = req.body;
  const question_id = parseInt(req.params.question_id);

  // Make sure uid from header matches uid from token. So user can only access their own data
  if (uid != req.uid) return res.status(401).json({ msg: 'Not authorized to access this data' });

  try {
    // Check is user language document exists
    let data = await LanguageModel.findOne({ uid: uid });

    // If document does not exist
    if (!data) {
      const userData = { uid, timeStamp, updated };
      data = await createLanguageData(data, userData);
      // data = await createLanguageData(data, { uid: uid }, timeStamp, updated);
    }

    // Try to find Question in array
    // Find document with mathing user id and question with mathing question_id
    await LanguageModel.findOne({ uid: uid, "questions.id": question_id }, async function(err, result) {
      if(err) { return res.status(500).send(err.message); }
      if (result == null) { // if this question does not exist in document (not in array), add this Question to array
        await LanguageModel.updateOne({ uid: uid }, { "$addToSet": { "questions": question } }, function(err, d1) {
          if(err) { return res.status(500).send(err.message); }
        });
      } else { // if this Question already exists in document, update this Question values
        await LanguageModel.updateOne({ uid: uid, questions: { $elemMatch: { "id": question_id } } }, { $set: { 'questions.$': question } }, function(err, d2) {
          if(err) { return res.status(500).send(err.message); }
        });
      } // * using updateOne method DOES NOT return new version of document. Please note we are returning the OLD version of the document.
      return languageDataUpdateTime(res, data, timeStamp, updated);
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server error');
  }
});

module.exports = router;