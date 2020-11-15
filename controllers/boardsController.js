const boardService = require('../services/boardService');
const tagTypeService = require('../services/tagTypeService');

module.exports.getAllBoards = async (req, res, next) => {
    let user = req.user;
    if(!user || (user.length && user.length !== 1)){
        return res.status(404).send("found no such user");
    }
    user = user[0].get({plain : true});
    return res.status(200).json(await boardService.getBoardsOfUser(user.id));
} 

module.exports.addBoard = async (req, res, next) => {
    let user = req.user;
    if(!user || (user.length && user.length !== 1)){
        return res.status(404).send("found no such user");
    }
    user = user[0].get({plain : true});
    const {board_name, board_description, board_image} = req.body;
    if(!board_name) {
        return res.status(400).json({info: "please provide a board name"});
    }
    let newBoard;
    try{
        newBoard = await boardService.addBoard(user.id, {board_name, board_description, board_image});
        return res.status(200).json({info: "successfully added board", boardInfo: newBoard});
    } catch (err) {
        return res.status(400).json({err});
    }
}

module.exports.deleteBoard = async (req, res, next) => {
    let user = req.user;
    if(!user || (user.length && user.length !== 1)){
        return res.status(404).send("found no such user");
    }
    user = user[0].get({plain : true});

    const {board_id} = req.body;
    if(!board_id) {
        return res.status(400).json({info: "please provide a board id"});
    }

    try{
        await boardService.deleteBoard(user.id, board_id);
        return res.status(200).json({info: "board Deleted"});
    } catch (err) {
        return res.status(400).json({err});
    }
}

module.exports.updateInfo_OfBoard = async (req, res, next) => {
    let user = req.user;
    if(!user || (user.length && user.length !== 1)){
        return res.status(404).send("found no such user");
    }
    user = user[0].get({plain : true});

    const {board_id, board_name, board_description, board_image} = req.body;
    if(!board_id) {
        return res.status(400).json({info: "please provide a board id"});
    }

    try{
        const output = await boardService.modifyInfo_OfBoard(user.id, board_id, {board_name, board_description, board_image});
        return res.status(200).json({info: "board info modified", modifiedBoard: output});
    } catch (err) {
        console.log(err);
        return res.status(400).json({err});
    }
}

module.exports.getBoardContent = async (req, res, next) => {
    let user = req.user;
    if(!user || (user.length && user.length !== 1)){
        return res.status(404).send("found no such user");
    }
    user = user[0].get({plain : true});
    const {board_id, board_collab} = req.body;
    let foundBoard;
    if(board_id) {    
        try{
            foundBoard = (await boardService.getBoardContent(user.id, board_id)).get({plain: true});
            const tagtypes = await tagTypeService.getAllTagTypes();
            // filter all column_types
            const column_types = foundBoard.Tags.map((tag) => {
                return tag.tag_type;
            }).concat(tagtypes.map((value) => {
                const getPlain = value.get({plain: true});
                return getPlain.id;
            })).filter((value, index, self) => self.indexOf(value) === index);
            // make arrays of each column types
            const allTags = foundBoard.Tags;
            const endingObject = {};
            column_types.forEach(element => {
                const dictionary = {};
                const tags_for_this_col = allTags.filter((value) => value.tag_type === element);
                tags_for_this_col.forEach(tag => {
                    dictionary[tag.id] = tag;
                });
                // if there's nothing for this column, bye
                if(!tags_for_this_col){
                    return;
                }
                if(tags_for_this_col.length <= 0) {
                    endingObject["col_" + String(element)] = [];
                    return;
                }
                let output = [];
                let current = dictionary[tags_for_this_col[0].id];
                while(current){
                    output = [...output, current];
                    current = dictionary[current.next_tag];
                }
                endingObject["col_" + String(element)] = output.reverse();
            });
            foundBoard.Tags = endingObject;
            return res.status(200).json({info: "heres the content, check under foundBoard attribute", foundBoard});
        } catch (err) {
            return res.status(400).json({err});
        }
    } else if (board_collab) {
        try{
            foundBoard = (await boardService.getBoardContent(user.id, null, board_collab)).get({plain: true});
            const tagtypes = await tagTypeService.getAllTagTypes();
            // filter all column_types
            const column_types = foundBoard.Tags.map((tag) => {
                return tag.tag_type;
            }).concat(tagtypes.map((value) => {
                const getPlain = value.get({plain: true});
                return getPlain.id;
            })).filter((value, index, self) => self.indexOf(value) === index);
            // make arrays of each column types
            const allTags = foundBoard.Tags;
            const endingObject = {};
            column_types.forEach(element => {
                const dictionary = {};
                const tags_for_this_col = allTags.filter((value) => value.tag_type === element);
                tags_for_this_col.forEach(tag => {
                    dictionary[tag.id] = tag;
                });
                // if there's nothing for this column, bye
                if(!tags_for_this_col){
                    return;
                }
                if(tags_for_this_col.length <= 0) {
                    endingObject["col_" + String(element)] = [];
                    return;
                }
                let output = [];
                let current = dictionary[tags_for_this_col[0].id];
                while(current){
                    output = [...output, current];
                    current = dictionary[current.next_tag];
                }
                endingObject["col_" + String(element)] = output.reverse();
            });
            foundBoard.Tags = endingObject;
            return res.status(200).json({info: "heres the content, check under foundBoard attribute", foundBoard});
        } catch (err) {
            console.log(err);
            return res.status(400).json({err});
        }
    } else {
        return res.status(400).json({info: "please provide a way to find the board"});
    }
}
