const bcrypt = require('bcrypt');
const saltRounds = parseInt(process.env.SALT_ROUNDS);

module.exports.hashPassword = async (password) => {
    return await bcrypt.hash(password, saltRounds);
}

module.exports.checkPassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
}

