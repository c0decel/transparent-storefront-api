const jwtSecret = 'sneeds_feed_and_seed'; 

const Models = require('./models.js');
const jwt = require('jsonwebtoken'),
    passport = require('passport');

const User = Models.User;

let generateJWTToken = (user) => {
    const userForToken = {
        _id: user._id,
        Username: user.Username
    }
  return jwt.sign(userForToken, jwtSecret, {
    subject: user.Username,
    expiresIn: '7d',
    algorithm: 'HS256'
  });
}

// Export the function containing the login logic
module.exports = (router) => {
    router.post('/login', (req, res) => {
        passport.authenticate('local', {session: false}, (error, user, info) => {
            if (!user) {
                return res.status(400).json({
                    message: 'Something went wrong.',
                    user: user
                });
            }
            req.login(user, {session: false}, (error) => {
                if (error) {
                    res.send(error);
                }
                let token = generateJWTToken(user);
                const response = {
                    user: {
                        _id: user._id,
                        Username: user.Username,
                        hasBroom: user.hasBroom,
                        isSponsor: user.isSponsor,
                        JoinDate: user.JoinDate
                    },
                    token: token
                }
                console.log(response);
                return res.json(response);
            });
        })(req, res);
    });
}