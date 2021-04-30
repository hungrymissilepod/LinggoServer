const express = require('express');
const router = express.Router();
const auth = require('../../../middleware/auth');
const { check, validationResult, header } = require('express-validator');
var moment = require('moment-timezone');

const UserDataGlobal = require('../../../models/UserGlobal');
const UserDataLang = require('../../../models/UserLang');
const UserToken = require('../../../models/UserToken');
const DailyEXP = require('../../../models/DailyEXP');

// ------
// USER TOKEN DATA
// ------

// @route   GET api/db/user/token/all
// @desc    Gets all users fcm tokens from database. Only Firebase Cloud Function can do this. Not accessible to app. ONLY FOR TESTING!
// @access  Private
router.get('/token/all', auth.verifyFirebaseCloudFunction,
[],
async (req, res) => {
  let myUsers = [];

  UserToken.find({}, function(err, users) {
    users.forEach(function(user) {
      myUsers.push(user);
    });    
    res.send(myUsers);
  });
});

// @route   POST api/db/user/token/remove-token
// @desc    Deletes a fcmToken from user token array. Only Firebase Cloud Function can do this. Not accessible to app.
// @access  Private
router.post('/token/remove-token', auth.verifyFirebaseCloudFunction,
[
  header('uid', 'uid is required').not().isEmpty(),
  header('fcmToken', 'fcmToken is required').not().isEmpty(),
],
async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const uid = req.header('uid');
  const fcmToken = req.header('fcmToken');

  try {
    let data = await UserToken.findOneAndUpdate(
      { uid: uid },
      { $pull: { fcmTokens: fcmToken } },
      { new: true},
    );
    return res.status(200).send(data);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/db/user/token/get-users-review-notifications
// @desc    Returns an array of users who need to be sent review notifications now in their local timezone
// @access  Private
router.get('/token/get-users-review-notifications', auth.verifyFirebaseCloudFunction,
[],
async (req, res) => {

  let users = [];

  /// Get all timezones
  zones = moment.tz.names();
   /// Use Promise.all to wait for all of the timezoens to be checked via MongoDB
  await Promise.all(zones.map(async (zone) => {
    /// Convert current time to timezone time and get local hour
    var hour = moment.utc(moment.now()).tz(zone).hour();
    // console.log(`Current time in: ${zone} - ${hour}`);
    
    /// Get all users in db where reviewNotifications are ON and it is their review time in their local timezone
    let results = await UserToken.find({ reviewNotificationsOn: true, timeZone: zone, reviewNotificationsTime: hour });
    results.forEach(function(r) {
      console.log(r);
      users.push(r);
    });
  }));
  res.send(users);
});

// @route   GET api/db/user/token/get-users-days-away
// @desc    Returns an array of users whose last log in time was between these days
// @access  Private
router.get('/token/get-users-days-away', auth.verifyFirebaseCloudFunction,
[],
async (req, res) => {
  const lower = req.header('lower');
  const upper = req.header('upper');
  let lowerTime = moment().subtract(lower,'days').valueOf();
  let upperTime = moment().subtract(upper,'days').valueOf();
  console.log('lower:',lower);
  console.log('upper:',upper);
  console.log('lowerTime:',lowerTime);
  console.log('upperTime:',upperTime);
  let users = [];

  zones = moment.tz.names();
  await Promise.all(zones.map(async (zone) => { /// for each timezone
    var hour = moment.utc(moment.now()).tz(zone).hour();
    // if (hour === 20) { /// only send these notifications at 8pm
      // console.log(`Current time in: ${zone} - ${hour}`);
      
      /// Find users in this timezone whose last log in time was between these days
      let results = await UserToken.find({ timeZone: zone, lastLoginTime: { $gt: upperTime, $lt: lowerTime } });
      results.forEach(function(r) {
        console.log(r);
        users.push(r);
      });
    // }
  }));
  console.log(users);
  res.send(users);
});

router.get('/token/test',
[],
async (req, res) => {

  var hour = moment.utc(moment.now()).tz('Asia/Kolkata').hour() + '00';
  console.log(hour);

  res.send(200);
});

// @route   POST api/db/user/token
// @desc    Post user fcm token to database
// @access  Private
router.post('/token', auth.verifyJWTToken,
[
  header('uid', 'uid is required').not().isEmpty(),
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
    fcmToken,
    reviewNotificationsOn,
    reviewNotificationsTime,
    timeZone,
    lastLoginTime,
  } = req.body;

  const userData = {
    uid,
    fcmToken,
    reviewNotificationsOn,
    reviewNotificationsTime,
    timeZone,
    lastLoginTime,
  }

  try {

    /// First find if this fcmToken is registered to another user and remove it from their fcmToken array
    /// This will stop the same device being registered to multiple users
    /// Find documents where their [uid] does not match this user's uid and their [fcmTokens] array does not contain this fcmToken, and remove that token from the array
    await UserToken.updateMany(
      { uid: { $ne: userData.uid }, fcmTokens: { $in: userData.fcmToken }},
      { $pull: { fcmTokens: userData.fcmToken } },
    );

    /// Find and update or insert (upsert) user token data
    /// $addToSet means that we will add this token if it is not already in the [fcmTokens] array
    let data = await UserToken.findOneAndUpdate(
      { uid: userData.uid},
      {
        $set: {
          reviewNotificationsOn: userData.reviewNotificationsOn,
          reviewNotificationsTime: userData.reviewNotificationsTime,
          timeZone: userData.timeZone,
          lastLoginTime: userData.lastLoginTime
        },
        $addToSet: { fcmTokens: userData.fcmToken },
      },
      { upsert: true }
    );

    return res.status(200).send(data);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});


// ------
// USER GLOBAL DATA
// ------

// @route   POST api/db/user/global
// @desc    Post user global data to database
// @access  Private
router.post('/global', auth.verifyJWTToken,
[
  header('uid', 'uid is required').not().isEmpty(),
  check('linggoID', 'LinggoID is required').not().isEmpty(),
  check('username', 'Username is required').not().isEmpty(),
  check('timeStamp', 'TimeStamp is required').not().isEmpty(),
  check('updated', 'Updated is required').not().isEmpty(),
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
    linggoID,
    username,
    currentLanguage,
    currentModule,
    profilePicture,
    playtimeLifetime,
    learnTimeLifetime,
    signUpMethod,
    hasFinishedOnBoarding,
    onBoardingStep,
    installTime,
    onBoardingCompleteTime,
    hasReviewedApp,
    lastTimeAskedToReviewApp,
    reviewNotificationsOn,
    reviewNotificationTime,
    lastTimeAskedReviewNotifications,
    likedOnFacebook,
    reviewButtonUnlocked,
    gdprPopupShown,
    personalisedAds,
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
    totalUnitsComplete,
    streakFreezeUseCount,
    comboShieldUseCount,
    perfectionistCurrentLessonCount,
    adRequestVideoAdCount,
    adWatchVideoAdCount,
    adRequestNativeAdCount,
    adWatchNativeAdCount,
    adRequestInterstitialAdCount,
    adWatchInterstitialAdCount,
    adRequestTotalAdCount,
    adWatchTotalAdCount,
    languages,
    inventory,
    achievements,
    configVersionData,
    timeStamp,
    updated,
  } = req.body;

  const userData = {
    uid,
    linggoID,
    username,
    currentLanguage,
    currentModule,
    profilePicture,
    playtimeLifetime,
    learnTimeLifetime,
    signUpMethod,
    hasFinishedOnBoarding,
    onBoardingStep,
    installTime,
    onBoardingCompleteTime,
    hasReviewedApp,
    lastTimeAskedToReviewApp,
    reviewNotificationsOn,
    reviewNotificationTime,
    lastTimeAskedReviewNotifications,
    likedOnFacebook,
    reviewButtonUnlocked,
    gdprPopupShown,
    personalisedAds,
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
    totalUnitsComplete,
    streakFreezeUseCount,
    comboShieldUseCount,
    perfectionistCurrentLessonCount,
    adRequestVideoAdCount,
    adWatchVideoAdCount,
    adRequestNativeAdCount,
    adWatchNativeAdCount,
    adRequestInterstitialAdCount,
    adWatchInterstitialAdCount,
    adRequestTotalAdCount,
    adWatchTotalAdCount,
    languages,
    inventory,
    achievements,
    configVersionData,
    timeStamp,
    updated,
  }

  try {
    // Check is user already exists
    let data = await UserDataGlobal.findOne({ uid: uid });

    // If user exists, update
    if (data) {
      return res.status(200).send(updateUserGlobal(data, userData));
    }
    return res.status(200).send(createUserGlobal(data, userData));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

async function createUserGlobal(data, userData) {
  data = new UserDataGlobal(userData);
  await data.save();
  return data;
}

async function updateUserGlobal(data, userData) {
  // Make sure that the [timeStamp] and [updated] values being sent are higher than the values currently in cloud. This ensures that the data is not regressing
  if (userData.timeStamp > data.timeStamp && userData.updated > data.updated) {
    data = await UserDataGlobal.findOneAndUpdate(
      { uid: data.uid }, // find by uid
      { $set: userData }, // update all userData
      { new: true }
    );
  }
  return data;
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

// @route   GET api/db/user/global/:user_id
// @desc    Get user's linggoID
// @access  Private
router.get('/global/:user_id/linggoID', auth.verifyJWTToken, async (req, res) => {
  // Get uid from JWTToken. We need to make sure users can only get their OWN data
  const uid = req.uid;
  // Get the user_id param from request
  const user_id = req.params.user_id;

  if (uid != user_id) return res.status(401).json({ msg: 'Not authorized to access this data' });

  try {
    const data = await UserDataGlobal.findOne({uid: user_id});
    if (!data) return res.status(400).json({ msg: 'User data not found' });
    if (data.linggoID != null) {
      return res.send(data.linggoID);
    }
    return res.status(400).json({ msg: 'Linggo ID is null' });
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'User data not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/db/user/global/:user_id/updated
// @desc    Get user global data updated value by user id
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
  check('timeStamp', 'TimeStamp is required').not().isEmpty(),
  check('updated', 'Updated is required').not().isEmpty(),
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
    timeStamp,
    updated,
  } = req.body;

  const userData = {
    uid,
    languages,
    timeStamp,
    updated,
  }

  try {
    // Check is user lang data already exists
    let data = await UserDataLang.findOne({ uid: uid });

    // If data exists, update
    if (data) {
      return res.status(200).send(updateUserLang(data, userData));
    }
    return res.status(200).send(createUserLang(data, userData));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

async function createUserLang(data, userData) {
  data = new UserDataLang(userData);
  await data.save();
  return data;
}

async function updateUserLang(data, userData) {
  if (userData.timeStamp > data.timeStamp && userData.updated > data.updated) {
    data = await UserDataLang.findOneAndUpdate(
      { uid: data.uid }, // find by uid
      { $set: userData }, // update all userData
      { new: true }
    );
  }
  return data;
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
// @desc    Get user lang data updated value by user id
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
  check('timeStamp', 'TimeStamp is required').not().isEmpty(),
  check('updated', 'Updated is required').not().isEmpty(),
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
    timeStamp,
    updated,
  } = req.body;

  const userData = {
    uid,
    list,
    timeStamp,
    updated,
  }

  try {
    // Check is user dailyexp data already exists
    let data = await DailyEXP.findOne({ uid: uid });

    // If data exists, update
    if (data) {
      return res.status(200).send(updateDailyEXP(data, userData));
    }
    return res.status(200).send(createDailyEXP(data, userData));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

async function createDailyEXP(data, userData) {
  data = new DailyEXP(userData);
  await data.save();
  return data;
}

async function updateDailyEXP(data, userData) {
  if (userData.timeStamp > data.timeStamp && userData.updated > data.updated) {
    data = await DailyEXP.findOneAndUpdate(
      { uid: data.uid }, // find by uid
      { $set: userData }, // update all userData
      { new: true }
    );
  }
  return data;
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
// @desc    Get user dailyexp data updated value by user id
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

/// USERNAME - START

router.post('/:user_id/username', auth.verifyJWTToken,
[
  header('uid', 'uid is required').not().isEmpty(),
  check('timeStamp', 'TimeStamp is required').not().isEmpty(),
  check('updated', 'Updated is required').not().isEmpty(),
],
async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const uid = req.header('uid')

  // Make sure uid from header matches uid from token. So user can only access their own data
  if (uid != req.uid) return res.status(401).json({ msg: 'Not authorized to access this data' });

  const {
    username,
    timeStamp,
    updated
  } = req.body;

  try {
    /// Check if user data already exists
    let data = await UserDataGlobal.findOne({ uid: uid });

    if (!data) {
      return res.status(400).send('User data does not exist');
    }
    /// Update [username] value
    await UserDataGlobal.updateOne({ uid: uid }, { 'username': username }, function(err, result) {
      if (err) { return res.status(500).send(err.message); }
    });
    return updateTimeStamp(res, data, timeStamp, updated);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server error');
  }
});

/// USERNAME - END

/// GDPR Consent (Personalised Ads) - START

// @route   GET api/db/user/:user_id/personalisedAds
// @access  Private
router.get('/:user_id/personalisedAds', auth.verifyJWTToken, async (req, res) => {
  const uid = req.uid;
  const user_id = req.params.user_id;
  if (uid != user_id) return res.status(401).json({ msg: 'Not authorized to access this data' });
  try {
    const data = await UserDataGlobal.findOne({uid: user_id});
    if (!data) return res.status(400).json({ msg: 'User data not found' });
    res.status(200).json(data.personalisedAds);
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'User data not found' });
    }
    res.status(500).send('Server Error');
  }
});

router.post('/:user_id/personalisedAds', auth.verifyJWTToken,
[
  header('uid', 'uid is required').not().isEmpty(),
  check('timeStamp', 'TimeStamp is required').not().isEmpty(),
  check('updated', 'Updated is required').not().isEmpty(),
],
async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const uid = req.header('uid')

  // Make sure uid from header matches uid from token. So user can only access their own data
  if (uid != req.uid) return res.status(401).json({ msg: 'Not authorized to access this data' });

  const {
    personalisedAds,
    timeStamp,
    updated
  } = req.body;

  try {
    /// Check if user data already exists
    let data = await UserDataGlobal.findOne({ uid: uid });

    if (!data) {
      return res.status(400).send('User data does not exist');
    }
    /// Update [personalisedAds] value
    await UserDataGlobal.updateOne({ uid: uid }, { 'personalisedAds': personalisedAds }, function(err, result) {
      if (err) { return res.status(500).send(err.message); }
    });
    return updateTimeStamp(res, data, timeStamp, updated);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server error');
  }
});

async function updateTimeStamp(res, data, timeStamp, updated) {
  if (timeStamp > data.timeStamp && updated > data.updated) {
    data = await UserDataGlobal.findOneAndUpdate( { uid: data.uid }, { $set: { 'timeStamp': timeStamp, 'updated': updated } }, { new: true } );
  }
  return res.json(data);
}

/// GDPR Consent - END

module.exports = router;