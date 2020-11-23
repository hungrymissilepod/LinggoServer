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
  const language = req.query.language;
  LanguageModel = mongoose.model('languageModel', LanguageSchema, language); // set collection to language from params

  if (uid != user_id) return res.status(401).json({ msg: 'Not authorized to access this data' });

  try {
    const data = await LanguageModel.findOne({uid: user_id});
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

  const word = req.body;
  const word_id = parseInt(req.params.word_id);
  console.log(word_id);

  try {
    // Check is user language data already exists
    let data = await LanguageModel.findOne({ uid: uid });

    // If data exists, update
    if (data) {
      // Find word by id
      const query = { words: { $elemMatch: { 'id': word_id}}};
      // Update word with new values
      const update = { $set: { 'words.$': word} };

      data = await LanguageModel.updateOne(query, update, { new: true }, function (err, data) {
        if(err) { return res.status(500).send(err.message); }
        return res.status(200).send(data);
      });

      // * Find word by id
      // const result = LanguageModel.find({}, { words: { $elemMatch: { 'id': word_id}}}, function(err, data) {
      //   if(err) { return handleError(res, err); }
      //   return res.status(200).send(data);
      // });
    } else {
      return res.status(404).send('Cannot find word');
    }
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server error');
  }
});

// TODO: update question data


module.exports = router;