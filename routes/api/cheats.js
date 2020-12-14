const express = require('express');
const router = express.Router();
const cheatGenerator = require('../../js/cheatGenerator');
const auth = require('../../middleware/auth');

// @route   GET api/cheats
// @desc    Get Cheat Code
// @access  Public
// TODO: make this private. user must have JWTToken, be logged in, some kind of security
router.get('/', (req, res) => {
    res.send(cheatGenerator.getCheatCode());
});

// @route   GET api/cheats/verifyCheat
// @desc    Compares user cheat code with cheat code on server. Returns whether code is correct or not
// @access  Public
// ? add jwt auth here to make sure they have a token?
router.get('/verifyCheat', auth.verifyWhiteListDevice, (req, res) => {
    const deviceId = req.header('deviceId');
    const code = req.header('code');

    // Get cheat code on server
    var appData = cheatGenerator.getCheatCode();
    var cheatCode = JSON.parse(appData).appCode;

    console.log('server cheat' + cheatCode);
    console.log('user cheat' + code);
    
    // Check if codes match
    if (code == cheatCode) {
        console.log('verifyCheat - Codes match'); res.sendStatus(200);
    } else {
        console.log('verifyCheat - Does not match'); res.sendStatus(401); // forbidden - wrong code
    }
});

module.exports = router;