const { Model } = require('mongoose');

const passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    Models = require('./models.js'),
    User = Models.User,
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
            console.log(`${username} ${password}`);
            await Users.findOne({ Username: username })
            .then((user) => {
                if (!user) {
                    console.log('Wrong username.');
                    return callback(null, false, {
                        message: 'Invalid credentials.'
                    });
                }
                console.log('Done.')
                return callback(null, user);
            })
            .catch((err) => {
                if (err) {
                    console.log(err);
                    return callback(err);
                }
            })
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
