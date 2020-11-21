const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const User = require('../../models/User');

// @route   POST api/user/
// @desc    Add user data to database
// @access  Public
router.post('/', auth.verifyJWTToken,
[
  check('uid', 'uid is required').not().isEmpty(),
  check('username', 'Name is required').not().isEmpty(),
],
async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
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
  } = req.body;

  try {
    // Check is user already exists
    let user = await User.findOne({ uid });

    if (user) {
      return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
    }

    user = new User({
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
    });

    await user.save(); // save user to database

    res.sendStatus(200);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/user/:user_id
// @desc    Get user data by user id
// @access  Private
router.get('/:user_id', auth.verifyJWTToken, async (req, res) => {
  // Get uid from JWTToken. We need to make sure users can only get their OWN data
  const uid = req.uid;
  // Get the user_id param from request
  const user_id = req.params.user_id;

  if (uid != user_id) return res.status(401).json({ msg: 'Not authorized to access this data' });

  try {
    const data = await User.findOne({uid: user_id});
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

module.exports = router;