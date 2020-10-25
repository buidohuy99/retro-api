const {DataTypes} = require('sequelize');
const sequelize = require('../configs/sequelize');

const Tag = sequelize.define('Tag', {
    id: {
        type: DataTypes.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
        unique: true,
        allowNull: false,
    },
    tag_content: {
        type: DataTypes.STRING(250),
        allowNull: false,
    },
}, {
    tableName: 'tags',
});

module.exports = Tag;