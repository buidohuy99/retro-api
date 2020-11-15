const TagType = require('../models/TagType');

module.exports.getAllTagTypes =  async () => {
    return await TagType.findAll();
}