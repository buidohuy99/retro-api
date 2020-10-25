const {DataTypes} = require('sequelize');
const sequelize = require('../configs/sequelize');

const Board = sequelize.define('Board', {
    id: {
        type: DataTypes.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
        unique: true,
        allowNull: false,
    },
    board_name: {
        type: DataTypes.STRING(80),
        allowNull: false,
    },
    board_description: {
        type: DataTypes.TEXT,
        defaultValue: null,
    },
    board_image: {
        type: DataTypes.TEXT,
        defaultValue: null,
    },
}, {
    tableName: 'boards',
});

module.exports = Board;