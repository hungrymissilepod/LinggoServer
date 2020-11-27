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
  query('language', 'language param is required').not().isEmpty(),
],
async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const uid = req.header('uid');
  const language = req.query.language;
  LanguageModel = mongoose.model('languageModel', LanguageSchema, language); // set collection to language from params

  // Make sure uid from header matches uid from token. So user can only access their own data
  if (uid != req.uid) return res.status(401).json({ msg: 'Not authorized to access this data' });

  const {
    words,
    questions,
  } = req.body;

  const userData = {
    uid,
    words,
    questions,
  }

  try {
    // Check is user language data already exists
    let data = await LanguageModel.findOne({ uid: uid });

    // If data exists, update
    if (data) {
      data = await LanguageModel.findOneAndUpdate(
        { uid: data.uid }, // find by uid
        { $set: userData }, // update all userData
        { new: true }
      );
      return res.json(data);
    }
    
    // If data does not already exist, create
    data = new LanguageModel(userData);
    await data.save(); // save data to database
    res.status(200).send(data);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/db/language
// @desc    Get user language data
// @access  Private
router.get('/', auth.verifyJWTToken,
[
  header('uid', 'uid is required').not().isEmpty(),
  query('language', 'language param is required').not().isEmpty(),
],
async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const uid = req.header('uid');
  const language = req.query.language;
  LanguageModel = mongoose.model('languageModel', LanguageSchema, language); // set collection to language from params

  // Make sure uid from header matches uid from token. So user can only access their own data
  if (uid != req.uid) return res.status(401).json({ msg: 'Not authorized to access this data' });

  try {
    const data = await LanguageModel.findOne({uid: uid});
    if (!data) return res.status(400).json({ msg: 'User data not found' });
    res.json(data);
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
  query('language', 'language param is required').not().isEmpty(),
],
async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const uid = req.header('uid');
  const language = req.query.language;
  LanguageModel = mongoose.model('languageModel', LanguageSchema, language); // set collection to language from params

  // Get Word data from body and params
  const word = req.body;
  const word_id = parseInt(req.params.word_id);

  // Make sure uid from header matches uid from token. So user can only access their own data
  if (uid != req.uid) return res.status(401).json({ msg: 'Not authorized to access this data' });

  try {
    // Check is user language document exists
    let doc = await LanguageModel.findOne({ uid: uid });

    // If document does not exist
    if (!doc) {
      doc = new LanguageModel({ uid: uid }); // create document
      await doc.save(); // save document to database
    }

    // await LanguageModel.findOne({ uid: uid, words: { id: word_id }}, async function(err, data) {};

    // Try to find Word in array
    // Find document with mathing user id and word with matching word_id
    await LanguageModel.findOne({ uid: uid, "words.id": word_id }, async function(err, data) {
      if(err) { return res.status(500).send(err.message); }
      if (data == null) { // if this word does not exist in document (not in array)
        // add this Word to array
        await LanguageModel.updateOne({ uid: uid }, { "$addToSet": { "words": word } }, function(err, data) {
          if(err) { return res.status(500).send(err.message); }
        });
      } else { // if this Word already exists in document
        // update this Word values
        await LanguageModel.updateOne({ uid: uid, words: { $elemMatch: { "id": word_id } } }, { $set: { 'words.$': word } }, function(err, data) {
          if(err) { return res.status(500).send(err.message); }
        });
      }
    });
    return res.sendStatus(200);
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
  query('language', 'language param is required').not().isEmpty(),
],
async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const uid = req.header('uid');
  const language = req.query.language;
  LanguageModel = mongoose.model('languageModel', LanguageSchema, language); // set collection to language from params

  // Get Question data from body and params
  const question = req.body;
  const question_id = parseInt(req.params.question_id);

  // Make sure uid from header matches uid from token. So user can only access their own data
  if (uid != req.uid) return res.status(401).json({ msg: 'Not authorized to access this data' });

  try {
    // Check is user language document exists
    let doc = await LanguageModel.findOne({ uid: uid });

    // If document does not exist
    if (!doc) {
      doc = new LanguageModel({ uid: uid }); // create document
      await doc.save(); // save document to database
    }

    // Try to find Question in array
    // Find document with mathing user id and question with mathing question_id
    await LanguageModel.findOne({ uid: uid, "questions.id": question_id }, async function(err, data) {
      if(err) { return res.status(500).send(err.message); }
      if (data == null) { // if this question does not exist in document (not in array)
        // add this Question to array
        await LanguageModel.updateOne({ uid: uid }, { "$addToSet": { "questions": question } }, function(err, data) {
          if(err) { return res.status(500).send(err.message); }
        });
      } else { // if this Question already exists in document
        // update this Question values
        await LanguageModel.updateOne({ uid: uid, questions: { $elemMatch: { "id": question_id } } }, { $set: { 'questions.$': question } }, function(err, data) {
          if(err) { return res.status(500).send(err.message); }
        });
      }
    });
    
    return res.sendStatus(200);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server error');
  }
});


module.exports = router;