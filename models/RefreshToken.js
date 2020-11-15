const {DataTypes} = require('sequelize');
const sequelize = require('../configs/sequelize');

const RefreshToken = sequelize.define('RefreshToken', {
    id: {
        type: DataTypes.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
        unique: true,
        allowNull: false,
    },
    refresh_token: {
        type: DataTypes.STRING(1024),
        allowNull: false,
    },
    valid_until: {
        type: DataTypes.BIGINT(20),
        allowNull: false,
    },
}, {
    tableName: 'refresh_tokens',
});

module.exports = RefreshToken;