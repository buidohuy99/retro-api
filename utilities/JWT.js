const passport = require('passport');
const passportJWT = require('passport-jwt');
const jwt = require('jsonwebtoken');
const ExtractJwt = passportJWT.ExtractJwt;
const JwtStrategy = passportJWT.Strategy;
const jwtOptions = {};
const userService = require('../services/userService');

jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
jwtOptions.secretOrKey = process.env.JWT_KEY;

// lets create our strategy for web token
const strategy = new JwtStrategy({jwtFromRequest: jwtOptions.jwtFromRequest, secretOrKey: jwtOptions.secretOrKey}, async (jwt_payload, next) => {
    const user = await userService.findUserByID(jwt_payload.id);
    if (user) {
        next(null, user);
    } else {
        next(null, false);
    }
});
// use the strategy
passport.use(strategy);

module.exports.passport = passport;
module.exports.jwtOptions = jwtOptions;
module.exports.jwt = jwt;
module.exports.refreshTokenSecret = process.env.JWT_REFRESH_KEY;