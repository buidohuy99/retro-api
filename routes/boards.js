const express = require('express');
const router = express.Router();
const boardsController = require('../controllers/boardsController');
const tagsController = require('../controllers/tagsController');
const tagsRouter = require('./tags');

// GET
router.get('/', boardsController.getAllBoards);
//router.get('/content', boardsController.collabLink);

// POST
router.post('/add', boardsController.addBoard);
router.post('/delete', boardsController.deleteBoard);
router.post('/update-info', boardsController.updateInfo_OfBoard);
router.post('/content', boardsController.getBoardContent);
router.post('/get-tags', tagsController.findTagOfBoard);

// Using others
router.use('/edit-board', tagsRouter);

module.exports = router;
