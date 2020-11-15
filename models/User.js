const {DataTypes} = require('sequelize');
const sequelize = require('../configs/sequelize');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
        unique: true,
        allowNull: false,
    },
    username: {
        type: DataTypes.STRING(40),
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    display_name: {
        type: DataTypes.STRING(80),
        defaultValue: null,
    },
    email: {
        type: DataTypes.STRING(120),
        allowNull: false,
        unique: true,
    },
    phone_number: {
        type: DataTypes.STRING(32),
        defaultValue: null,
    }
}, {
    tableName: 'users',
});

module.exports = User;