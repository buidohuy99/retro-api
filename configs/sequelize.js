const { Sequelize , Transaction} = require('sequelize');

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PW, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    pool: {
        max: 5,
        min: 0,
        idle: 10000
    },
    logging: false,
    isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
});

module.exports = sequelize;