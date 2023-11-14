const express = require('express');
const router = express.Router();

const userCtrl = require('../controllers/user')

router.post('/signup', userCtrl.signup); //Fonctionne
router.post('/login', userCtrl.login); //Fonctionne

module.exports = router;
