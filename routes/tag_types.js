const express = require('express');
const router = express.Router();
const tagTypesController = require('../controllers/tagTypesController');

// GET
router.get('/', tagTypesController.getAllTagTypes);

module.exports = router;