const express = require('express');
const router = express.Router();
const boardsController = require('../controllers/boardsController');

/* GET users listing. */
router.get('/', boardsController.getAllBoards);

module.exports = router;
