const Tag = require('../models/Tag');
const Board = require('../models/Board');
const TagType = require('../models/TagType');
const sequelize = require('../configs/sequelize');

module.exports.findTagsOfColumn = async (user_id, board_id, tag_type) => {
    if(!user_id || !board_id || !tag_type) throw new Error("missing arguments");
    const t = await sequelize.transaction();
    try{
        const board = await Board.findAll({where: {id: board_id, user_id}}, {transaction: t});
        if(!board || board.length <= 0) {
            throw new Error("board not found");
        }
        const tags = await Tag.findAll({where: {tag_type, board_id}, transaction: t, 
            order: [['previous_tag', 'DESC']]});
        t.commit();
        return tags;
    } catch (err) {
        t.rollback();
        throw err;
    }
}

module.exports.addTag = async (user_id, board_id, tag_content, tag_type) => {
    if(!user_id || !board_id || !tag_content || !tag_type) throw new Error("missing arguments");
    const t = await sequelize.transaction();
    try{
        const board = await Board.findAll({where: {id: board_id, user_id}}, {transaction: t});
        if(!board || board.length <= 0) {
            throw new Error("board not found");
        }
        const checkEligibleType = await TagType.findByPk(tag_type, {transaction: t});
        if(!checkEligibleType) {
            throw new Error("type is not eligible");
        }
        const newTagToAdd = {tag_content, board_id, tag_type};
        let findPreviousTag = await Tag.findOne({where: {board_id, tag_type, next_tag: null}, transaction: t});
        if(findPreviousTag) {
            findPreviousTag = Array.isArray(findPreviousTag) ? findPreviousTag[0] : findPreviousTag;
            findPreviousTag = findPreviousTag.get({plain : true});
            newTagToAdd.previous_tag = findPreviousTag.id;
        }
        const newTag = await Tag.create(newTagToAdd, {transaction: t});
        if(findPreviousTag){
            const previous_tag_id = findPreviousTag.id;
            findPreviousTag.next_tag = newTag.id;
            findPreviousTag.id = undefined;
            await Tag.update(findPreviousTag, {where: {id: previous_tag_id}, transaction: t});
        }
        t.commit();
        return newTag;
    } catch (err) {
        t.rollback();
        throw err;
    }
}

module.exports.modifyTag = async (user_id, board_id, tag_id, tag_content, tag_type, tag_to_exchange, left_side, right_side) => {
    if(!user_id || !board_id || !tag_content || !tag_id) throw new Error("missing arguments");
    const t = await sequelize.transaction();
    try{
        const board = await Board.findAll({where: {id: board_id, user_id}, transaction: t});
        if(!board || board.length <= 0) {
            throw new Error("board not found");
        }
        const checkEligibleTag = (await Tag.findByPk(tag_id, {transaction: t})).get({plain : true});
        if(!checkEligibleTag) {
            throw new Error("tag is not available");
        }

        const newUpdate = {tag_content};
        // Change the tag type of a card - needs an insert point
        if(tag_type){
            const checkEligibleType = await TagType.findByPk(tag_type, {transaction: t});
            if(!checkEligibleType) {
                throw new Error("type is not eligible");
            }
            let leftCard, rightCard;
            if(!left_side && !right_side) throw new Error("cannot change tag type with out a position");
            if(left_side){
                leftCard = (await Tag.findByPk(left_side, {transaction: t})).get({plain : true});
            }
            if(right_side){
                rightCard = (await Tag.findByPk(right_side, {transaction: t})).get({plain : true});
            }
            if(!leftCard && !rightCard) throw new Error("illegal position to change tag type");
            if(leftCard && !rightCard && leftCard.next_tag !== null) throw new Error("inconsistent position info to change tag type");
            if(!leftCard && rightCard && rightCard.previous_tag !== null) throw new Error("inconsistent position info to change tag type");
            if(leftCard && rightCard && (leftCard.next_tag !== rightCard.id || rightCard.previous_tag !== leftCard.id)) throw new Error("inconsistent position info to change tag type");
            // Update the new left and right cards if its an elligible move
            const leftTagUpdate = {
                next_tag: checkEligibleTag.id,
            };
            const rightTagUpdate = {
                previous_tag: checkEligibleTag.id
            };
            if(leftCard){
                await Tag.update(leftTagUpdate, {where: {id: leftCard.id}, transaction: t});
            }
            if(rightCard){
                await Tag.update(rightTagUpdate, {where: {id: rightCard.id}, transaction: t})
            }
            // Update the tags next to the current tag
            if(checkEligibleTag.previous_tag){
                await Tag.update({next_tag: checkEligibleTag.next_tag}, {where: {id: checkEligibleTag.previous_tag}, transaction: t});
            }
            if(checkEligibleTag.next_tag) {
                await Tag.update({previous_tag: checkEligibleTag.previous_tag}, {where: {id: checkEligibleTag.next_tag}, transaction: t});
            }
            //Update current tag
            await Tag.update({previous_tag: leftCard ? leftCard.id : null, next_tag: rightCard ? rightCard.id : null}, {where: {id: tag_id}, transaction: t});

            newUpdate.tag_type = tag_type;
        }

        // Find the tag this new tag want to be exchanged with (if have) - in the current column
        if(tag_to_exchange && tag_to_exchange !== tag_id) { 
            const findExchangedTag = (await Tag.findByPk(tag_to_exchange, {transaction: t})).get({plain : true});
            if(!findExchangedTag) {
                throw new Error("exchange tag is not available");
            }

            if(!tag_type || tag_type === checkEligibleTag.tag_type){
                //Logic for swapping two tag that is not next to each other
                if(findExchangedTag.next_tag !== checkEligibleTag.id && findExchangedTag.previous_tag !== checkEligibleTag.id
                    && checkEligibleTag.next_tag !== findExchangedTag.id && checkEligibleTag.previous_tag !== findExchangedTag.id){
                    const leftTag_currentTag = {
                        next_tag: findExchangedTag.id
                    };
                    const rightTag_currentTag = {
                        previous_tag: findExchangedTag.id
                    };
                    const leftTag_exchangeTag = {
                        next_tag: tag_id
                    };
                    const rightTag_exchangeTag = {
                        previous_tag: tag_id
                    }
                    
                    //Update left right of currentTag
                    if(checkEligibleTag.previous_tag){
                        await Tag.update(leftTag_currentTag, {where: {id: checkEligibleTag.previous_tag}, transaction: t});
                    }                    
                    if(checkEligibleTag.next_tag){
                        await Tag.update(rightTag_currentTag, {where: {id: checkEligibleTag.next_tag}, transaction: t});
                    }
                    //Update left right of exchange tag
                    if(findExchangedTag.previous_tag){
                        await Tag.update(leftTag_exchangeTag, {where: {id: findExchangedTag.previous_tag}, transaction: t});
                    }
                    if(findExchangedTag.next_tag){
                        await Tag.update(rightTag_exchangeTag, {where: {id: findExchangedTag.next_tag}, transaction: t});
                    }
                    //Update current tag
                    await Tag.update({previous_tag: findExchangedTag.previous_tag, next_tag: findExchangedTag.next_tag}, {where: {id: tag_id}, transaction: t});
                    //Update exchange tag
                    await Tag.update({previous_tag: checkEligibleTag.previous_tag, next_tag: checkEligibleTag.next_tag}, {where: {id: tag_to_exchange}, transaction: t});      
                } 
                // Logic for swapping 2 tag next to each other
                else {
                    if(checkEligibleTag.next_tag === findExchangedTag.id && findExchangedTag.previous_tag === checkEligibleTag.id){
                        const leftTag_currentTag = {
                            next_tag: findExchangedTag.id
                        };
                        const rightTag_exchangeTag = {
                            previous_tag: tag_id
                        }
                        if(checkEligibleTag.previous_tag){
                            await Tag.update(leftTag_currentTag, {where: {id: checkEligibleTag.previous_tag}, transaction: t});
                        } 
                        if(findExchangedTag.next_tag){
                            await Tag.update(rightTag_exchangeTag, {where: {id: findExchangedTag.next_tag}, transaction: t});
                        }
                        //Update current tag
                        await Tag.update({previous_tag: findExchangedTag.id, next_tag: findExchangedTag.next_tag}, {where: {id: tag_id}, transaction: t});
                        //Update exchange tag
                        await Tag.update({previous_tag: checkEligibleTag.previous_tag, next_tag: checkEligibleTag.id}, {where: {id: tag_to_exchange}, transaction: t});   
                    }else if (checkEligibleTag.previous_tag === findExchangedTag.id && findExchangedTag.next_tag === checkEligibleTag.id){
                        const rightTag_currentTag = {
                            previous_tag: findExchangedTag.id
                        };
                        const leftTag_exchangeTag = {
                            next_tag: tag_id
                        };
                        if(checkEligibleTag.next_tag){
                            await Tag.update(rightTag_currentTag, {where: {id: checkEligibleTag.next_tag}, transaction: t});
                        }
                        if(findExchangedTag.previous_tag){
                            await Tag.update(leftTag_exchangeTag, {where: {id: findExchangedTag.previous_tag}, transaction: t});
                        }
                        //Update current tag
                        await Tag.update({previous_tag: findExchangedTag.previous_tag, next_tag: findExchangedTag.id}, {where: {id: tag_id}, transaction: t});
                        //Update exchange tag
                        await Tag.update({previous_tag: checkEligibleTag.id, next_tag: checkEligibleTag.next_tag}, {where: {id: tag_to_exchange}, transaction: t});   
                    }
                }
            } else {
                throw new Error("cannot perform this exchange since its illegal");
            }
        }

        const affectedRows = await Tag.update(newUpdate, {where: {id: tag_id}, transaction: t});
        if(affectedRows.length !== 1) {
            throw new Error("yo, your input somehow made me updated more/less than 1 row so FU, i roll back *gangsta*");
        }
        const updatedTag = (await Tag.findByPk(tag_id, {transaction: t})).get({plain : true});
        t.commit();
        return updatedTag;
    } catch (err) {
        t.rollback();
        throw err;
    }
}

module.exports.deleteTag = async (user_id, board_id, tag_id) => {
    if(!user_id || !board_id || !tag_id) throw new Error("missing arguments");
    const t = await sequelize.transaction();
    try{
        const board = await Board.findAll({where: {id: board_id, user_id}, transaction: t});
        if(!board || board.length <= 0) {
            throw new Error("board not found");
        }
        const checkEligibleTag = await Tag.findByPk(tag_id, {transaction: t});
        if(!checkEligibleTag) {
            throw new Error("tag is not available");
        }
        const foundTag = checkEligibleTag.get({plain: true});
        const previous_tag = foundTag.previous_tag ? (await Tag.findByPk(foundTag.previous_tag, {transaction: t})).get({plain: true}) : null;
        const next_tag = foundTag.next_tag ? (await Tag.findByPk(foundTag.next_tag, {transaction: t})).get({plain: true}) : null;
        
        const prev_id = previous_tag ? previous_tag.id : null;
        const next_id = next_tag? next_tag.id: null;
        if(previous_tag){
            previous_tag.next_tag = next_id;
            previous_tag.id = undefined;
            await Tag.update(previous_tag, {where: {id: prev_id}, transaction: t});
        }
        if(next_tag){
            next_tag.previous_tag = prev_id;
            next_tag.id = undefined;
            await Tag.update(next_tag, {where: {id: next_id}, transaction: t});
        }

        await Tag.destroy({where: {id: tag_id}, transaction: t});
        t.commit();
        return;
    } catch (err) {
        t.rollback();
        throw err;
    }
}