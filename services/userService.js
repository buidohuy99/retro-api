const User = require('../models/User');
const BCrypt = require('../utilities/bcrypt');
const sequelize = require('../configs/sequelize');
const {QueryTypes} = require('sequelize');

module.exports.createUser = async(username, password, email, phone_number = null) => {
    const t = await sequelize.transaction();
    try{
        const uniqueInfoRecord = await this.checkUniqueInfo_OfUser({username, password, email, phone_number}, t);
        if(uniqueInfoRecord){
            throw new Error("user info(s) are not unique");
        }
        const hashed = await BCrypt.hashPassword(password);
        const newUser = await User.create({username, password: hashed, email, phone_number}, {transaction: t});
        t.commit();
        return newUser;
    } catch (err) {
        t.rollback();
        return null;
    }
}

module.exports.checkUniqueInfo_OfUser = async({username, password, email, phone_number, display_name}, transaction) => {
    const sql = "SELECT * FROM users u WHERE u.username = :username OR u.email = :email";
    const [results, meta] = await sequelize.query(sql, {
        nest: true,
        model: User, 
        mapToModel: true, 
        type: QueryTypes.SELECT,
        replacements: {username: username ? username : null, email: email ? email : null},
        transaction: transaction ? transaction : undefined
    });
    return results;
}

module.exports.findUserByInfos = async({username, password, email, phone_number, display_name}, transaction) => {
    const sql = "SELECT * FROM users u WHERE u.username = :username OR u.email = :email";
    const [results, meta] = await sequelize.query(sql, {
        nest: true,
        model: User, 
        mapToModel: true, 
        type: QueryTypes.SELECT,
        replacements: {username: username ? username : null, email: email ? email : null},
        transaction: transaction ? transaction : undefined
    });
    return results;
}

module.exports.findUserByID = async(id) => {
    return await User.findAll({where : {id}});
}

module.exports.updateUser = async(user, email, current_password, new_password) => {
    const t = await sequelize.transaction();
    try{
        const uniqueInfoRecord = await this.checkUniqueInfo_OfUser({password: new_password, email}, t);
        if(uniqueInfoRecord){
            throw new Error("user info(s) are not unique");
        }
        const update_obj = {
            email,
        }
        if(current_password && new_password){
            const result = await BCrypt.checkPassword(current_password, user.password);
            if(!result) return null;
            update_obj.password = await BCrypt.hashPassword(new_password);
        }
        await User.update(update_obj, {where : {id: user.id}, transaction: t});
        const output = await User.findByPk(user.id, {transaction: t});
        t.commit();
        return output;
    } catch (err) {
        t.rollback();
        throw err;
    }
}