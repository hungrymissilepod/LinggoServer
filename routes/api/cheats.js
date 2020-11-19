const express = require('express');
const router = express.Router();
const cheatGenerator = require('../../js/cheatGenerator');

router.get('/', (req, res) => {
    res.send(cheatGenerator.getCheatCode());
});

module.exports = router;