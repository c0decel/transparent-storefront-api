const express = require('express');
const router = express.Router();
const checkBroom = require('./appFunctions.js');
const checkAuth = require('./appFunctions.js');
const Models = require('./models.js');
const Product = Models.Product;
const User = Models.User;

const { validationResult, check } = require('express-validator');

const passport = require('passport');
require('./passport');

/**
 * Basic user permissions
 */
//Upload new user
router.post('/', [
    check('Username', 'Username must be at least 5 characters.').isLength({min: 5}),
    check('Username', 'Non alphanumeric characters not allowed.').isAlphanumeric(),
    check('Password', 'Add a password').not().isEmpty(),
    check('Email', 'Invalid email').isEmail()
], (req, res) => {
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    let hashedPass = User.hashPass(req.body.Password);
    User.findOne({ Username: req.body.Username })
    .then((user) => {
        if (user) {
            return res.status(400).send(req.body.Username + ' already exists.');
        } else {
            User.create({
                Username: req.body.Username,
                Password: hashedPass,
                Email: req.body.Email,
                Birthday: req.body.Birthday
            })
            .then((user) => {
                res.status(201).json(user)
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error: ' + err);
            })
        }
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

/**
 * Logged in user permissions
 */
//Get cart items
router.get('/:Username/cart', checkAuth, async (req, res) => {
    try {
        const user = await User.findOne({ Username: req.params.Username }).populate('Cart.ProductID');
        res.status(200).json(user.Cart);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add product to cart
router.put('/:Username/cart/:id', passport.authenticate('jwt', { session: false }), checkAuth, async (req, res) => {
    try {
        const productId = req.params.id;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).send('Product not found.');
        }

        const updatedCart = await User.findOneAndUpdate(
            { Username: req.params.Username },
            {
                $addToSet: { 
                    Cart: {
                        ProductID: product._id,
                        Name: product.Name,
                        Price: product.Price,
                        Image: product.Image
                    }
                }
            },
            { new: true }
        );

        if (!updatedCart) {
            return res.status(404).send('User not found.');
        }

        res.json(updatedCart);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
    }
});


//Remove product from cart
router.delete('/:Username/cart/:id', passport.authenticate('jwt', { session: false }), checkAuth, async (req, res) => {
    try {
       const productId = req.params.id;

        const updatedCart = await User.findOneAndUpdate(
            { Username: req.params.Username },
            {
                $pull: { 
                    Cart: { ProductID: productId }
                }
            },
            { new: true }
        );

        if (!updatedCart) {
            return res.status(404).send('User not found.');
        }

        res.json(updatedCart);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
    }
});


//Get wishlist items
router.get('/:Username/wishlist', checkAuth, async (req, res) => {
    try {
        const user = await User.findOne({ Username: req.params.Username }).populate('Wishlist.ProductID');
        res.status(200).json(user.Wishlist);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add product to wishlist
router.put('/:Username/wishlist/:id', passport.authenticate('jwt', { session: false }), checkAuth, async (req, res) => {
    try {
        const productId = req.params.id;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).send('Product not found.');
        }

        const updatedWishlist = await User.findOneAndUpdate(
            { Username: req.params.Username },
            {
                $addToSet: { 
                    Wishlist: {
                        ProductID: product._id,
                        Name: product.Name,
                        Price: product.Price,
                        Image: product.Image
                    }
                }
            },
            { new: true }
        );

        if (!updatedWishlist) {
            return res.status(404).send('User not found.');
        }

        res.json(updatedWishlist);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
    }
});

//Remove product from wishlist
router.delete('/:Username/wishlist/:id', passport.authenticate('jwt', { session: false }), checkAuth, async (req, res) => {
    try {
        const productId = req.params.id;
        const updatedWishlist = await User.findOneAndUpdate(
            { Username: req.params.Username },
            {
                $pull: { 
                    Cart: { ProductID: productId }
                }
            },
            { new: true }
        );

        if (!updatedWishlist) {
            return res.status(404).send('User not found.');
        }

        res.json(updatedWishlist);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
    }
});

/**
 * Admin permissions
 */
//Get all users
router.get('/', passport.authenticate('jwt', { session: false }), checkBroom, (req, res) => {
    User.find()
    .then((User) => {
        res.status(201).json(User);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

//Get one user
router.get('/:Username', passport.authenticate('jwt', { session: false }), checkBroom, (req, res) => {
    User.findOne({ Username: req.params.Username })
    .then((User) => {
        if (!User) {
            return res.status(404).send('User does not exist.');
        }
        res.json(User);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

//Delete user
router.delete('/:Username', passport.authenticate('jwt', { session: false }), checkBroom, (req, res) => {
    User.findOneAndDelete({ Username: req.params.Username })
    .then((existingUser) => {
        if (!existingUser) {
            res.status(404).send(req.params.Username + ' does not exist.')
        } else {
            res.status(200).send(req.params.Username + ' deleted.')
        }
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

module.exports = router;