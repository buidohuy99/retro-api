const tagService = require('../services/tagService');

module.exports.findTagOfBoard = async (req, res, next) => {
    let user = req.user;
    if(!user || (user.length && user.length !== 1)){
        return res.status(404).send("found no such user");
    }
    user = user[0].get({plain : true});

    const {board_id, tag_type} = req.body;
    if(!board_id || !tag_type) {
        return res.status(400).json({info: "missing arguments"});
    }

    try{
        const tagInfo = await tagService.findTagsOfColumn(user.id, board_id, tag_type);
        return res.status(200).json({info: "tag found", tagInfo});
    } catch (err) {
        console.log(err);
        return res.status(400).json(err);
    }
}

module.exports.addTag = async (req, res, next) => {
    let user = req.user;
    if(!user || (user.length && user.length !== 1)){
        return res.status(404).send("found no such user");
    }
    user = user[0].get({plain : true});

    const {board_id, tag_content, tag_type} = req.body;
    if(!board_id || !tag_content || !tag_type) {
        return res.status(400).json({info: "missing arguments"});
    }

    try{
        const tagInfo = await tagService.addTag(user.id, board_id, tag_content, tag_type);
        return res.status(200).json({info: "tag inserted", tagInfo});
    } catch (err) {
        return res.status(400).json(err);
    }
}

module.exports.deleteTag = async (req, res, next) => {
    let user = req.user;
    if(!user || (user.length && user.length !== 1)){
        return res.status(404).send("found no such user");
    }
    user = user[0].get({plain : true});

    const {board_id, tag_id} = req.body;
    if(!board_id || !tag_id) {
        return res.status(400).json({info: "please provide a board and/or a tag"});
    }

    try{
        await tagService.deleteTag(user.id, board_id, tag_id);
        return res.status(200).json({info: "tag deleted"});
    } catch (err) {
        console.log(err);
        return res.status(400).json(err);
    }
}

module.exports.editTag = async (req, res, next) => {
    let user = req.user;
    if(!user || (user.length && user.length !== 1)){
        return res.status(404).send("found no such user");
    }
    user = user[0].get({plain : true});

    const {board_id, tag_id, tag_content, tag_type, tag_to_exchange, left_side, right_side} = req.body;
    if(!board_id || !tag_id) {
        return res.status(400).json({info: "please provide a board and/or a tag"});
    }
    if(!tag_content) {
        return res.status(400).json({info: "you need at least some content to modify the tag"});
    }

    try{
        const updatedTag = await tagService.modifyTag(user.id, board_id, tag_id, tag_content, tag_type, tag_to_exchange, left_side, right_side);
        return res.status(200).json({info: "tag modified", tagInfo: updatedTag});
    } catch (err) {
        console.log(err);
        return res.status(400).json(err);
    }
}