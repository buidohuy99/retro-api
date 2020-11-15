const tagTypeService = require('../services/tagTypeService');

module.exports.getAllTagTypes = async (req, res, next) => {
    return res.status(200).json(await tagTypeService.getAllTagTypes());
}