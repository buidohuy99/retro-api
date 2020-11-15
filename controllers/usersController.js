const userService = require('../services/userService');
const jwt = require('../utilities/JWT').jwt;
const jwtOptions = require('../utilities/JWT').jwtOptions;
const refreshTokenSecret = require('../utilities/JWT').refreshTokenSecret;
const BCrypt = require('../utilities/bcrypt');
const RefreshToken = require('../models/RefreshToken');
const sequelize = require('../configs/sequelize');

module.exports.register = async (req, res, next) => {
    const {username, password, email, phone_number, getRefreshToken} = req.body;
    if(!username || !password || !email) {
        return res.status(400).json({info: "sorry, you need username password and email at the very least"});
    }
    const newUser = await userService.createUser(username, password, email, phone_number);
    if(!newUser){
        return res.status(400).json({info: "sorry, username and/or email already existed in DB"});
    }
    const payload = { id: newUser.id };
    const token = jwt.sign(payload, jwtOptions.secretOrKey, {
        expiresIn: parseInt(process.env.JWT_TOKEN_EXPIRY),
    });
    const returnItem = { msg: 'ok, sent a token', user_id: payload.id, access_token: "Bearer " + token, access_maxAge: parseInt(process.env.JWT_TOKEN_EXPIRY) * 1000};
    if(getRefreshToken){
        const refreshToken = jwt.sign(payload, refreshTokenSecret, {
            expiresIn: parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRY),
        });
        const nowUnixSeconds = Math.round(Number(new Date()) / 1000);
        await RefreshToken.create({refresh_token: refreshToken, valid_until: nowUnixSeconds + parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRY)});
        returnItem.refresh_token = refreshToken; 
        returnItem.refresh_maxAge = parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRY) * 1000;
    }
    return res.status(200).json(returnItem);
} 

module.exports.login = async (req, res, next) => {
    const {username, password, email, getRefreshToken} = req.body;
    if ((username || email) && password) {
        let user = await userService.findUserByInfos({username, email});
        if (!user || (user.length && user.length !== 1)) {
            res.status(404).json({info: 'No such user found'});
            return;
        }
        user = user.length ? user[0].get({plain : true}) : user.get({plain:  true});
        if (await BCrypt.checkPassword(password, user.password)) {
            const payload = { id: user.id };
            const token = jwt.sign(payload, jwtOptions.secretOrKey, {
                expiresIn: parseInt(process.env.JWT_TOKEN_EXPIRY),
            });
            const returnItem = { msg: 'ok, sent a token', user_id: payload.id, access_token: "Bearer " + token, access_maxAge: parseInt(process.env.JWT_TOKEN_EXPIRY) * 1000};
            if(getRefreshToken){
                const refreshToken = jwt.sign(payload, refreshTokenSecret, {
                    expiresIn: parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRY),
                });
                const nowUnixSeconds = Math.round(Number(new Date()) / 1000);
                await RefreshToken.create({refresh_token: refreshToken, valid_until: nowUnixSeconds + parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRY)});
                returnItem.refresh_token = refreshToken; 
                returnItem.refresh_maxAge = parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRY) * 1000;
            }
            return res.status(200).json(returnItem);
        } else {
            res.status(400).json({ msg: 'Password is incorrect'});
        }
        return;
    }
    res.status(400).json({info: "your request lacked an ID and/or email and a password"});
}

module.exports.checkToken = async (req, res, next) => {
    res.status(200).send("token is still valid");
}

// To be improve with refresh key storage if time permits (definitely not)
module.exports.refreshToken = async (req, res, next) => {
    const { refreshToken } = req.body;

    let found_token;
    const t = await sequelize.transaction();
    try{
        if(refreshToken && (found_token = await RefreshToken.findOne({where : {refresh_token: refreshToken}, transaction: t}))){
            try {
                const payload = jwt.verify(refreshToken, refreshTokenSecret);
                
                // Tạo mới mã token và trả lại cho user
                const access_token = jwt.sign({id: payload.id}, jwtOptions.secretOrKey, {
                    expiresIn: parseInt(process.env.JWT_TOKEN_EXPIRY),
                });

                const response = {
                    access_token: "Bearer " + access_token,
                    token_maxAge: parseInt(process.env.JWT_TOKEN_EXPIRY) * 1000
                }
                t.commit();
                return res.status(200).json(response);
            } catch (err) {
                console.log(err);
                if (err instanceof jwt.JsonWebTokenError) {
                    await found_token.destroy();
                    t.commit();
                    return res.status(401).send("Unauthorized, please relog");
                }
                t.rollback();
                return res.status(400).send("Bad request");
            }
        } else {
            t.rollback();
            res.status(400).json({
                message: 'Invalid refresh token',
            });
        }
    } catch(e) {
        console.log(e);
        t.rollback();
    }
}

module.exports.logout = async (req, res, next) => {
    const {refreshToken} = req.body;
    if(!refreshToken){
        return res.status(400).send("Badddd request");
    }

    let found_refresh_tok;
    if(found_refresh_tok = await RefreshToken.findOne({where: {refresh_token: refreshToken}})){
        await found_refresh_tok.destroy();
        return res.status(200).send("Log out successfully");
    }else{
        return res.status(400).send("found no such refreshToken");
    }
}

module.exports.getProfile = async (req, res, next) => {
    let user = req.user;
    if(!user || (user.length && user.length !== 1)){
        return res.status(404).send("found no such user");
    }
    user = user[0].get({plain : true});
    return res.status(200).send({info: "found this user..", user});
}

module.exports.modifyProfile = async (req, res, next) => {
    let user = req.user;
    if(!user || (user.length && user.length !== 1)){
        return res.status(404).send("found no such user");
    }
    user = user[0].get({plain : true});

    const {email, current_password, new_password} = req.body;

    try{
        const modify = await userService.updateUser(user, email, current_password, new_password);
        if(!modify){
            return res.status(400).json({info: "theres been a problem when modifying this record"});
        }
        return res.status(200).json({info: "modify record successful", record: modify});
    }catch(err){
        console.log(err);
        return res.status(400).json(err);
    }
}

