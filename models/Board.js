const {DataTypes, UUIDV4, UUIDV1} = require('sequelize');
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
    board_collab: {
        type: DataTypes.UUID,
        defaultValue: UUIDV1(),
    }
}, {
    tableName: 'boards',
    indexes: [
        {
          unique: true,
          fields: ['board_collab'],
        },
    ]
});

module.exports = Board;