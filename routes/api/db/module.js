const express = require('express');
const router = express.Router();
const auth = require('../../../middleware/auth');
const { validationResult, header, query } = require('express-validator');

const mongoose = require('mongoose');
const ModuleSchema = require('../../../models/Module');
var ModuleModel = mongoose.model('moduleModel', ModuleSchema, 'ChineseModuleOne');

// @route   POST api/db/module
// @params  module (which module data we are posting)
// @desc    Post user module data to database
// @access  Private
router.post('/', auth.verifyJWTToken,
[
  header('uid', 'uid is required').not().isEmpty(),
  header('timeStamp', 'TimeStamp is required').not().isEmpty(),
  header('updated', 'Updated is required').not().isEmpty(),
  query('module', 'module param is required').not().isEmpty(),
],
async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const uid = req.header('uid');
  const timeStamp = req.header('timeStamp');
  const updated = req.header('updated');
  const module = req.query.module;
  ModuleModel = mongoose.model('moduleModel', ModuleSchema, module); // set collection to language from params

  // Make sure uid from header matches uid from token. So user can only access their own data
  if (uid != req.uid) return res.status(401).json({ msg: 'Not authorized to access this data' });

  const {
    version,
    build,
    id,
    units,
    lessons,
  } = req.body;

  const userData = {
    uid,
    version,
    build,
    id,
    units,
    lessons,
    timeStamp,
    updated,
  }

  try {
    // Check is user module data already exists
    let data = await ModuleModel.findOne( { uid: uid });

    // If data exists, update
    if (data) {
      return res.status(200).send(updateModuleData(data, userData));
    }
    return res.status(200).send(createModuleData(data, userData));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

async function createModuleData(data, userData) {
  data = new ModuleModel(userData);
  await data.save();
  return data;
}

async function updateModuleData(data, userData) {
  if (userData.timeStamp > data.timeStamp && userData.updated > data.updated) {
    data = await ModuleModel.findOneAndUpdate(
      { uid: data.uid }, // find by uid
      { $set: userData }, // update all userData
      { new: true }
    );
  }
  return data;
}

async function updateTimeStampModuleData(res, data, timeStamp, updated) {
  if (timeStamp > data.timeStamp && updated > data.updated) {
    data = await ModuleModel.findOneAndUpdate( { uid: data.uid }, { $set: { 'timeStamp': timeStamp, 'updated': updated } }, { new: true } );
  }
  return res.json(data);
}

// @route   GET api/db/module/:user_id
// @params  module (which module data we are getting)
// @desc    Get module data
// @access  Private
router.get('/:user_id', auth.verifyJWTToken,
[
  query('module', 'module param is required').not().isEmpty(),
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

  const module = req.query.module;
  ModuleModel = mongoose.model('moduleModel', ModuleSchema, module); // set collection to module from params

  try {
    const data = await ModuleModel.findOne({uid: user_id});
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

// @route   GET api/db/module/:user_id/updated
// @desc    Get user module data updated value by user id
// @access  Private
router.get('/:user_id/updated', auth.verifyJWTToken,
[
  query('module', 'module param is required').not().isEmpty(),
],
async (req, res) => {
  const uid = req.uid;
  const user_id = req.params.user_id;
  if (uid != user_id) return res.status(401).json({ msg: 'Not authorized to access this data' });
  
  const module = req.query.module;
  ModuleModel = mongoose.model('moduleModel', ModuleSchema, module); // set collection to module from params

  try {
    const data = await ModuleModel.findOne({uid: user_id});
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
/// UNIT
/// ---------

// @route   POST api/db/module/unit
// @params  module (which module we are posting to)
// @desc    Post unit to module collection
// @access  Private
router.post('/unit/:unit_id', auth.verifyJWTToken,
[
  header('uid', 'uid is required').not().isEmpty(),
  header('timeStamp', 'TimeStamp is required').not().isEmpty(),
  header('updated', 'Updated is required').not().isEmpty(),
  query('module', 'module param is required').not().isEmpty(),
],
async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const uid = req.header('uid');
  const timeStamp = req.header('timeStamp');
  const updated = req.header('updated');
  const module = req.query.module;
  ModuleModel = mongoose.model('moduleModel', ModuleSchema, module); // set collection to language from params

  // Get Unit data from body and params
  const unit = req.body;
  const unit_id = req.params.unit_id;

  // Make sure uid from header matches uid from token. So user can only access their own data
  if (uid != req.uid) return res.status(401).json({ msg: 'Not authorized to access this data' });

  try {
    // Check is user module data exists
    let data = await ModuleModel.findOne({ uid: uid });

    // If data does not exist
    if (!data) {
      const userData = { uid, timeStamp, updated };
      data = await createModuleData(data, userData);
    }
    // Try to find Unit in array
    // Find document with matching user id and Unit with matching unit_id
    await ModuleModel.findOne({ uid: uid, "units.id": unit_id }, async function(err, result) {
      if(err) { return res.status(500).send(err.message); }
      if (result == null) { // if this Unit does not exist in document (not in array), add it to array
        await ModuleModel.updateOne({ uid: uid }, { "$addToSet": { "units": unit } }, function(err, d1) {
          if(err) { return res.status(500).send(err.message); }
        });
      } else { // if this Unit already exists in document, update its values
        await ModuleModel.updateOne({ uid: uid, units: { $elemMatch: { "id": unit_id } } }, { $set: { 'units.$': unit } }, function(err, d2) {
          if(err) { return res.status(500).send(err.message); }
        });
      } // * using updateOne method DOES NOT return new version of document. Please note we are returning the OLD version of the document.
      return await updateTimeStampModuleData(res, data, timeStamp, updated);
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server error');
  }
});

/// ---------
/// LESSONS
/// ---------

// @route   POST api/db/module/lesson
// @params  module (which module we are posting to)
// @desc    Post lesson to module collection
// @access  Private
router.post('/lesson/:type/:lesson_id', auth.verifyJWTToken,
[
  header('uid', 'uid is required').not().isEmpty(),
  header('timeStamp', 'TimeStamp is required').not().isEmpty(),
  header('updated', 'Updated is required').not().isEmpty(),
  query('module', 'module param is required').not().isEmpty(),
],
async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const uid = req.header('uid');
  const timeStamp = req.header('timeStamp');
  const updated = req.header('updated');
  const module = req.query.module;
  ModuleModel = mongoose.model('moduleModel', ModuleSchema, module); // set collection to language from params

  // Get Lesson data from body and params
  const lesson = req.body;
  const type = req.params.type;
  const lesson_id = parseInt(req.params.lesson_id);

  // Make sure uid from header matches uid from token. So user can only access their own data
  if (uid != req.uid) return res.status(401).json({ msg: 'Not authorized to access this data' });

  try {
    // Check is user module data exists
    let data = await ModuleModel.findOne({ uid: uid });

    // If data does not exist
    if (!data) {
      const userData = { uid, timeStamp, updated };
      data = await createModuleData(data, userData);
    }
    switch (type) {
      case "Vocab":
        return await postVocabLesson(res, uid, lesson, lesson_id);
      case "Grammar":
        return await postGrammarLesson(res, uid, lesson, lesson_id);
      case "Study":
        return await postStudyLessons(res, uid, lesson, lesson_id);
      case "VG":
        return await postVGLessons(res, uid, lesson, lesson_id);
    }
    return await updateTimeStampModuleData(res, data, timeStamp, updated);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server error');
  }
});

async function postVocabLesson(res, uid, lesson, lesson_id) {
  await ModuleModel.findOne({ uid: uid, "lessons.vocabLessons.id": lesson_id }, async function(err, data) {
    if(err) { return res.status(500).send(err.message); }
    if (data == null) { // if this Lesson does not exist in document (not in array)
      // add this Lesson to array
      await ModuleModel.updateOne({ uid: uid }, { "$addToSet": { "lessons.vocabLessons": lesson } }, function(err, data) {
        if(err) { return res.status(500).send(err.message); }
      });
    } else { // if this Lesson already exists in document
      // update this Lesson values
      await ModuleModel.updateOne({ uid: uid, "lessons.vocabLessons": { $elemMatch: { "id": lesson_id } } }, { $set: { "lessons.vocabLessons.$": lesson } }, function(err, data) {
        if(err) { return res.status(500).send(err.message); }
      });
    }
  });
  return res.sendStatus(200);
}

async function postGrammarLesson(res, uid, lesson, lesson_id) {
  await ModuleModel.findOne({ uid: uid, "lessons.grammarLessons.id": lesson_id }, async function(err, data) {
    if(err) { return res.status(500).send(err.message); }
    if (data == null) {
      await ModuleModel.updateOne({ uid: uid }, { "$addToSet": { "lessons.grammarLessons": lesson } }, function(err, data) {
        if(err) { return res.status(500).send(err.message); }
      });
    } else {
      await ModuleModel.updateOne({ uid: uid, "lessons.grammarLessons": { $elemMatch: { "id": lesson_id } } }, { $set: { "lessons.grammarLessons.$": lesson } }, function(err, data) {
        if(err) { return res.status(500).send(err.message); }
      });
    }
  });
  return res.sendStatus(200);
}

async function postStudyLessons(res, uid, lesson, lesson_id) {
  await ModuleModel.findOne({ uid: uid, "lessons.studyLessons.id": lesson_id }, async function(err, data) {
    if(err) { return res.status(500).send(err.message); }
    if (data == null) {
      await ModuleModel.updateOne({ uid: uid }, { "$addToSet": { "lessons.studyLessons": lesson } }, function(err, data) {
        if(err) { return res.status(500).send(err.message); }
      });
    } else {
      await ModuleModel.updateOne({ uid: uid, "lessons.studyLessons": { $elemMatch: { "id": lesson_id } } }, { $set: { "lessons.studyLessons.$": lesson } }, function(err, data) {
        if(err) { return res.status(500).send(err.message); }
      });
    }
  });
  return res.sendStatus(200);
}

async function postVGLessons(res, uid, lesson, lesson_id) {
  await ModuleModel.findOne({ uid: uid, "lessons.vgLessons.id": lesson_id }, async function(err, data) {
    if(err) { return res.status(500).send(err.message); }
    if (data == null) {
      await ModuleModel.updateOne({ uid: uid }, { "$addToSet": { "lessons.vgLessons": lesson } }, function(err, data) {
        if(err) { return res.status(500).send(err.message); }
      });
    } else {
      await ModuleModel.updateOne({ uid: uid, "lessons.vgLessons": { $elemMatch: { "id": lesson_id } } }, { $set: { "lessons.vgLessons.$": lesson } }, function(err, data) {
        if(err) { return res.status(500).send(err.message); }
      });
    }
  });
  return res.sendStatus(200);
}

module.exports = router;