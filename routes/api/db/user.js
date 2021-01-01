const express = require('express');
const router = express.Router();
const auth = require('../../../middleware/auth');
const { check, validationResult, header } = require('express-validator');

const UserDataGlobal = require('../../../models/UserGlobal');
const UserDataLang = require('../../../models/UserLang');
const DailyEXP = require('../../../models/DailyEXP');

const mongoose = require('mongoose');
const LanguageSchema = require('../../../models/Language');

var langModel = mongoose.model('chineseLanguage', LanguageSchema);

// ------
// USER GLOBAL DATA
// ------

// @route   POST api/db/user/global
// @desc    Post user global data to database
// @access  Private
router.post('/global', auth.verifyJWTToken,
[
  header('uid', 'uid is required').not().isEmpty(),
  check('username', 'Username is required').not().isEmpty(),
  check('updated', 'Updated time is required').not().isEmpty(),
  check('build', 'Build is required').not().isEmpty(),
],
async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const uid = req.header('uid');

  // Make sure uid from header matches uid from token. So user can only access their own data
  if (uid != req.uid) return res.status(401).json({ msg: 'Not authorized to access this data' });

  const {
    username,
    profilePicture,
    playtimeLifetime,
    learnTimeLifetime,
    signUpMethod,
    hasFinishedOnBoarding,
    onBoardingStep,
    installTime,
    onBoardingCompleteTime,
    reviewButtonUnlocked,
    gdprConfirmed,
    globalRank,
    lifetimeEXP,
    coins,
    coinsSpent,
    coinsLifetime,
    dailyGoal,
    dailyStreak,
    dailyStreakLongest,
    totalWordsUnlocked,
    totalQuestionsUnlocked,
    totalUnitsUnlocked,
    streakFreezeUseCount,
    comboShieldUseCount,
    adRequestVideoAdCount,
    adWatchVideoAdCount,
    adRequestNativeAdCount,
    adWatchNativeAdCount,
    adRequestInterstitialAdCount,
    adWatchInterstitialAdCount,
    adRequestTotalAdCount,
    adWatchTotalAdCount,
    langLevels,
    inventory,
    achievements,
    updated,
    build,
  } = req.body;

  const userData = {
    uid,
    username,
    profilePicture,
    playtimeLifetime,
    learnTimeLifetime,
    signUpMethod,
    hasFinishedOnBoarding,
    onBoardingStep,
    installTime,
    onBoardingCompleteTime,
    reviewButtonUnlocked,
    gdprConfirmed,
    globalRank,
    lifetimeEXP,
    coins,
    coinsSpent,
    coinsLifetime,
    dailyGoal,
    dailyStreak,
    dailyStreakLongest,
    totalWordsUnlocked,
    totalQuestionsUnlocked,
    totalUnitsUnlocked,
    streakFreezeUseCount,
    comboShieldUseCount,
    adRequestVideoAdCount,
    adWatchVideoAdCount,
    adRequestNativeAdCount,
    adWatchNativeAdCount,
    adRequestInterstitialAdCount,
    adWatchInterstitialAdCount,
    adRequestTotalAdCount,
    adWatchTotalAdCount,
    langLevels,
    inventory,
    achievements,
  }

  try {
    // Check is user already exists
    let data = await UserDataGlobal.findOne({ uid: uid });

    // If user exists, update
    if (data) {
      return await updateUserGlobal(res, data, userData, updated, build);
    } 
    return await createUserGlobal(res, data, userData, updated, build);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

async function createUserGlobal(res, data, userData, updated, build) {
  userData.updated = updated; userData.build = build;
  data = new UserDataGlobal(userData);
  await data.save();
  return res.status(200).send(data);
}

async function updateUserGlobal(res, data, userData, updated, build) {
  data = await UserDataGlobal.findOneAndUpdate(
    { uid: data.uid }, // find by uid
    { $set: userData }, // update all userData
    { new: true }
  );
  // if [updated] time is greater than [updated] time on database, update it
  if (updated > data.updated) {
    if (updated < new Date().getTime()) { // ensure that the [updated] time sent is not in the future (compare to server time)
      if (build > data.build) {
        data = await UserDataGlobal.findOneAndUpdate( { uid: data.uid, 'updated': { $lt: updated }, 'build': { $lt: build } }, { $set: { 'updated': updated }, $set: { 'build': build } }, { new: true } );
      }
    }
  }
  return res.status(200).json(data);
}

// @route   GET api/db/user/global/:user_id
// @desc    Get user global data by user id
// @access  Private
router.get('/global/:user_id', auth.verifyJWTToken, async (req, res) => {
  // Get uid from JWTToken. We need to make sure users can only get their OWN data
  const uid = req.uid;
  // Get the user_id param from request
  const user_id = req.params.user_id;

  if (uid != user_id) return res.status(401).json({ msg: 'Not authorized to access this data' });

  try {
    const data = await UserDataGlobal.findOne({uid: user_id});
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

// @route   GET api/db/user/global/:user_id/updated
// @desc    Get user global data updated time by user id
// @access  Private
router.get('/global/:user_id/updated', auth.verifyJWTToken, async (req, res) => {
  const uid = req.uid;
  const user_id = req.params.user_id;
  if (uid != user_id) return res.status(401).json({ msg: 'Not authorized to access this data' });
  try {
    const data = await UserDataGlobal.findOne({uid: user_id});
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

// ------
// USER LANG DATA
// ------

// @route   POST api/db/user/langdata
// @desc    Post user lang data to database
// @access  Private
router.post('/langdata', auth.verifyJWTToken,
[
  header('uid', 'uid is required').not().isEmpty(),
  check('updated', 'Updated time is required').not().isEmpty(),
],
async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const uid = req.header('uid');

  // Make sure uid from header matches uid from token. So user can only access their own data
  if (uid != req.uid) return res.status(401).json({ msg: 'Not authorized to access this data' });

  const {
    languages,
    updated,
  } = req.body;

  const userData = {
    uid,
    languages,
  }

  try {
    // Check is user lang data already exists
    let data = await UserDataLang.findOne({ uid: uid });

    // If data exists, update
    if (data) {
      return await updateUserLang(res, data, userData, updated);
    }
    return await createUserLang(res, data, userData, updated);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

async function createUserLang(res, data, userData, updated) {
  userData.updated = updated;
  data = new UserDataLang(userData);
  await data.save();
  return res.status(200).send(data);
}

async function updateUserLang(res, data, userData, updated) {
  data = await UserDataLang.findOneAndUpdate(
    { uid: data.uid }, // find by uid
    { $set: userData }, // update all userData
    { new: true }
  );
  // if [updated] time is greater than [updated] time on database, update it
  if (updated > data.updated) {
    if (updated < new Date().getTime()) { // ensure that the [updated] time sent is not in the future (compare to server time)
      data = await UserDataLang.findOneAndUpdate( { uid: data.uid, 'updated': { $lt: updated } }, { $set: { 'updated': updated } }, { new: true } );
    }
  }
  return res.status(200).json(data);
}

// @route   GET api/db/user/langdata/:user_id
// @desc    Get user lang data by user id
// @access  Private
router.get('/langdata/:user_id', auth.verifyJWTToken, async (req, res) => {
  // Get uid from JWTToken. We need to make sure users can only get their OWN data
  const uid = req.uid;
  // Get the user_id param from request
  const user_id = req.params.user_id;

  if (uid != user_id) return res.status(401).json({ msg: 'Not authorized to access this data' });

  try {
    const data = await UserDataLang.findOne({uid: user_id});
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

// @route   GET api/db/user/langdata/:user_id/updated
// @desc    Get user lang data updated time by user id
// @access  Private
router.get('/langdata/:user_id/updated', auth.verifyJWTToken, async (req, res) => {
  const uid = req.uid;
  const user_id = req.params.user_id;
  if (uid != user_id) return res.status(401).json({ msg: 'Not authorized to access this data' });
  try {
    const data = await UserDataLang.findOne({uid: user_id});
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

// ------
// DAILY EXP
// ------

// @route   POST api/db/user/dailyexp
// @desc    Post user dailyexp data to database
// @access  Private
router.post('/dailyexp', auth.verifyJWTToken,
[
  header('uid', 'uid is required').not().isEmpty(),
  check('updated', 'Updated time is required').not().isEmpty(),
],
async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const uid = req.header('uid');

  // Make sure uid from header matches uid from token. So user can only access their own data
  if (uid != req.uid) return res.status(401).json({ msg: 'Not authorized to access this data' });

  const {
    list,
    updated,
  } = req.body;

  const userData = {
    uid,
    list,
  }

  try {
    // Check is user dailyexp data already exists
    let data = await DailyEXP.findOne({ uid: uid });

    // If data exists, update
    if (data) {
      return await updateDailyEXP(res, data, userData, updated);
    }
    return await createDailyEXP(res, data, userData, updated);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

async function createDailyEXP(res, data, userData, updated) {
  userData.updated = updated; // add [updated] value to userData. This is because we NEED [updated] value when creating object
  data = new DailyEXP(userData);
  await data.save();
  return res.status(200).send(data);
}

async function updateDailyEXP(res, data, userData, updated) {
  data = await DailyEXP.findOneAndUpdate(
    { uid: data.uid }, // find by uid
    { $set: userData }, // update all userData
    { new: true }
  );
  // if [updated] time is greater than [updated] time on database, update it
  if (updated > data.updated) {
    if (updated < new Date().getTime()) { // ensure that the [updated] time sent is not in the future (compare to server time)
      data = await DailyEXP.findOneAndUpdate( { uid: data.uid, 'updated': { $lt: updated } }, { $set: { 'updated': updated } }, { new: true } );
    }
  }
  return res.status(200).json(data);
}

// @route   GET api/db/user/dailyexp/:user_id
// @desc    Get user dailyexp data by user id
// @access  Private
router.get('/dailyexp/:user_id', auth.verifyJWTToken, async (req, res) => {
  // Get uid from JWTToken. We need to make sure users can only get their OWN data
  const uid = req.uid;
  // Get the user_id param from request
  const user_id = req.params.user_id;

  if (uid != user_id) return res.status(401).json({ msg: 'Not authorized to access this data' });

  try {
    const data = await DailyEXP.findOne({uid: user_id});
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

// @route   GET api/db/user/dailyexp/:user_id/updated
// @desc    Get user dailyexp data updated time by user id
// @access  Private
router.get('/dailyexp/:user_id/updated', auth.verifyJWTToken, async (req, res) => {
  const uid = req.uid;
  const user_id = req.params.user_id;
  if (uid != user_id) return res.status(401).json({ msg: 'Not authorized to access this data' });
  try {
    const data = await DailyEXP.findOne({uid: user_id});
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

module.exports = router;