const mongoose = require('mongoose');

const passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    Models = require('./models/forumModels.js'),
    passportJWT = require('passport-jwt');

let Users = Models.User,
    JWTStrategy = passportJWT.Strategy,
    ExtractJWT = passportJWT.ExtractJwt;

passport.use(
        new LocalStrategy({
            usernameField: 'Username',
            passwordField: 'Password'
        },
        async (username, password, callback) => {
            try {
                const user = await Users.findOne({ Username: username }).select('+Password');
                if (!user) {
                    console.log('Wrong username.');
                    return callback(null, false, {
                        message: 'Invalid credentials.'
                    });
                }

                if (!user.validatePass(password)) {
                    console.log('Wrong password.');
                    return callback(null, false, {
                        message: 'Invalid credentials.'
                    });
                }
                console.log('Done.')
                // Return only necessary user data, excluding password
                return callback(null, {
                    _id: user._id,
                    Username: user.Username,
                    hasBroom: user.hasBroom,
                    isSponsor: user.isSponsor
                });
            } catch (err) {
                console.log(err);
                return callback(err);
            }
        }
    )
    );
    

passport.use(new JWTStrategy({
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: 'sneeds_feed_and_seed'
}, async (jwtPayload, callback) => {
    return await Users.findById(jwtPayload._id)
    .then((user) => {
        return callback(null, user);
    })
    .catch((err) => {
        return callback(err)
    });
}));
