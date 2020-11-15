const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { passport } = require('../utilities/JWT');

router.post('/register', usersController.register);
router.post('/login', usersController.login);
router.post('/logout', usersController.logout);

router.post('/check-token-valid', passport.authenticate('jwt', { session: false }), usersController.checkToken);
router.get('/profile', passport.authenticate('jwt', { session: false }), usersController.getProfile);
router.post('/update-profile', passport.authenticate('jwt', { session: false }), usersController.modifyProfile);
router.post('/refresh-token', usersController.refreshToken);

module.exports = router;