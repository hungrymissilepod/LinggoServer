const mongoose = require('mongoose');

const UserDataGlobalSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
    default: 'Anonymous',
  },
  profilePicture: {
    type: String,
    default: '',
  },
  playtimeLifetime: {
    type: Number,
    default: 0,
  },
  learnTimeLifetime: {
    type: Number,
    default: 0,
  },
  signUpMethod: {
    type: String,
    default: '',
  },
  hasFinishedOnBoarding: {
    type: Boolean,
    default: false,
  },
  onBoardingStep: {
    type: String,
    default: '',
  },
  installTime: {
    type: Number,
    default: 0,
  },
  onBoardingCompleteTime: {
    type: Number,
    default: 0,
  },
  reviewButtonUnlocked: {
    type: Boolean,
    default: false,
  },
  gdprConfirmed: {
    type: Boolean,
    default: false,
  },
  globalRank: {
    type: Number,
    default: 0,
  },
  lifetimeEXP: {
    type: Number,
    default: 0,
  },
  coins: {
    type: Number,
    default: 0,
  },
  coinsSpent: {
    type: Number,
    default: 0,
  },
  coinsLifetime: {
    type: Number,
    default: 0,
  },
  dailyGoal: {
    type: Number,
    default: 20,
  },
  dailyStreak: {
    type: Number,
    default: 0,
  },
  dailyStreakLongest: {
    type: Number,
    default: 0,
  },
  totalWordsUnlocked: {
    type: Number,
    default: 0,
  },
  totalQuestionsUnlocked: {
    type: Number,
    default: 0,
  },
  totalUnitsUnlocked: {
    type: Number,
    default: 0,
  },
  streakFreezeUseCount: {
    type: Number,
    default: 0,
  },
  comboShieldUseCount: {
    type: Number,
    default: 0,
  },
  adRequestVideoAdCount: {
    type: Number,
    default: 0,
  },
  adWatchVideoAdCount: {
    type: Number,
    default: 0,
  },
  adRequestNativeAdCount: {
    type: Number,
    default: 0,
  },
  adWatchNativeAdCount: {
    type: Number,
    default: 0,
  },
  adRequestInterstitialAdCount: {
    type: Number,
    default: 0,
  },
  adWatchInterstitialAdCount: {
    type: Number,
    default: 0,
  },
  adRequestTotalAdCount: {
    type: Number,
    default: 0,
  },
  adWatchTotalAdCount: {
    type: Number,
    default: 0,
  },
  langLevels: [{
    language : String,
    level : Number,
  }],
  inventory: {
    type: Object,
  },
  achievements: [{
    id : String,
    name : String,
    description : String,
    isSecret : Boolean,
    stages : [{
      id : Number,
      requirement : Number,
      reward : Number,
      completed : Boolean,
      completionTime : Number,
      gotCompletionReward : Boolean,
      completiongotCompletionRewardTimeTime : Number,
    }],
  }],
  updated: {
    type: Number,
    required: true,
  },
});

module.exports = UserDataGlobal = mongoose.model('userDataGlobal', UserDataGlobalSchema, 'UserDataGlobal');