const jwtSecret = 'your_jwt_secret'; //has to be same jwt key used in strategy

const jwt = require('jsonwebtoken'),
    passport = require('passport');

require('./passport'); //local passport.js file

let generateJWTToken = (user) => {
    return jwt.sign(user, jwtSecret, {
        subject: user.Username, //username to be encoded in jwt
        expiresIn: '21d', //specifies expiry date
        algorithm: 'HS256' //algo used to sign/encode values of jwt
    });
}

/* POST Login. */
module.exports = (router) => {
    router.post('/login', (req, res) => {
        passport.authenticate('local', { session: false }, (user) => {
            console.log(user);
            if (!user) {
                return res.status(400).json({
                    message: 'Something is wrong',
                    user: user
                });
            }
            req.login(user, { session: false }, (error) => {
                if (error) {
                    res.send(error);
                }
                let token = generateJWTToken(user.toJSON());
                const response = {
                    user: {
                        _id: user._id,
                        Username: user.Username,
                        hasBroom: user.hasBroom,
                        isSponsor: user.isSponsor
                    },
                    token: token
                }
                console.log(response);
                return res.json(response);
            });
        })(req, res);
    });
}
