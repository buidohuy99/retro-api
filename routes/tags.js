const express = require('express');
const router = express.Router();
const tagsController = require('../controllers/tagsController');

// POST
router.post('/add-tag', tagsController.addTag);
router.post('/delete-tag', tagsController.deleteTag);
router.post('/edit-tag', tagsController.editTag);

module.exports = router;