const Board = require('../models/Board');
const Tag = require('../models/Tag');
const TagType = require('../models/TagType')
const sequelize = require('../configs/sequelize');

module.exports.getBoardsOfUser = async (user_id) => {
    if (!user_id) return null;
    return await Board.findAll({where: {user_id}, order: [
        ['createdAt', 'DESC']
    ]});
}

module.exports.addBoard = async (user_id, {board_name, board_description = null, board_image = null}) => {
    if(!user_id || !board_name) throw new Error("missing arguments");
    const t = await sequelize.transaction();
    try{  
        const newBoard = await Board.create({board_name, board_description, board_image, user_id}, {transaction: t});
        t.commit();
        return newBoard;
    } catch (err) {
        t.rollback();
        throw err;
    }
}

module.exports.modifyInfo_OfBoard = async (user_id, board_id, {board_name, board_description, board_image}) => {
    if(!user_id || !board_id || !board_name) throw new Error("missing arguments");
    const t = await sequelize.transaction();
    try{  
        const board = await Board.findAll({where: {id: board_id, user_id}, transaction: t});
        if(!board || board.length <= 0) {
            throw new Error("board not found");
        }
        if(!board_name){
            throw new Error("Board must have a name");
        }
        await Board.update({board_name, board_description, board_image} ,{where: {id: board_id, user_id}, transaction: t});
        const found = await Board.findByPk(board_id, {transaction: t});
        t.commit();
        return found;
    } catch (err) {
        t.rollback();
        throw err;
    }
}

module.exports.deleteBoard = async (user_id, board_id) => {
    if(!user_id || !board_id) throw new Error("missing arguments");
    const t = await sequelize.transaction();
    try{
        const board = await Board.findAll({where: {id: board_id, user_id}, transaction: t});
        if(!board || board.length <= 0) {
            throw new Error("board not found");
        }
        await Board.destroy({where: {id: board_id, user_id}, transaction: t});
        t.commit();
        return;
    } catch (err) {
        t.rollback();
        throw err;
    }
}

module.exports.getBoardContent = async (user_id, board_id, board_collab) => {
    if(!user_id || (!board_id && !board_collab)) throw new Error("missing arguments");
    const t = await sequelize.transaction();
    try{
        const whereclause = {
            user_id,
        };
        if(board_id){
            whereclause.id = board_id;
        }else {
            whereclause.board_collab = board_collab;
        }
        const board = await Board.findOne({where: whereclause, include: Tag,
            order: [[
                Tag, 'previous_tag', 'ASC'
            ]]
            ,transaction: t});
        if(!board || board.length <= 0) {
            throw new Error("board not found");
        }
        t.commit();
        return board;
    } catch (err) {
        t.rollback();
        throw err;
    }
}
