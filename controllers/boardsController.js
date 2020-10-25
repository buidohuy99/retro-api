const Board = require('../models/Board');
const User = require('../models/User');

module.exports.getAllBoards = async (req, res, next) => {
    res.send(await Board.findAll());
} 