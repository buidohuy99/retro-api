const {DataTypes} = require('sequelize');
const sequelize = require('../configs/sequelize');

const TagType = sequelize.define('TagType', {
    id: {
        type: DataTypes.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
        unique: true,
        allowNull: false,
    },
    tagtype_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
}, {
    tableName: 'tag_types',
});

module.exports = TagType;