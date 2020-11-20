const express = require('express');
const router = express.Router();
const cheatGenerator = require('../../js/cheatGenerator');
const jwt = require('jsonwebtoken');

// @route   GET api/cheats
// @desc    Get Cheat Code
// @access  Public
router.get('/', (req, res) => {
    res.send(cheatGenerator.getCheatCode());
});

module.exports = router;