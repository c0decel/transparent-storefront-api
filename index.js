require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');

const app = express();

const Models = require('./models.js');
const Product = Models.Product;
const User = Models.User;

const cors = require('cors');
const { validationResult, check } = require('express-validator');
let allowedOrigins = ['http://localhost:8080', 'http://localhost:4200', 'https://transparent-storefront-api-7a631c0a8a92.herokuapp.com'];

app.use(cors({
    origin: (origin, callback) => {
      if(!origin) return callback(null, true);
      if(allowedOrigins.indexOf(origin) === -1){
        let message = 'The CORS policy for this application does not allow access from origin ' + origin;
        return callback(new Error(message), false);
      }
      return callback(null, true);
    }
  }));

// Set up middleware
app.use(morgan('common'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let auth = require('./auth')(app);

const passport = require('passport');
require('./passport');

//For live
const mongoURI = process.env.CONNECTION_URI;

//For local testing
//const mongoURI = 'mongodb://127.0.0.1:27017/Storefront-API';

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Failed to connect ', err);
  });

const port = process.env.PORT || 8080;

app.listen(port, '0.0.0.0',() => {
console.log('Listening on Port ' + port);
});

//For local testing
//app.listen(8080, () => {
//   console.log('Listening on port 8080.');
//})

//Default page
app.get('/', (req, res) => {
    res.send('Transparent Storefront API');
});

//Get documentation
app.get('/documentation', (req, res) => {
    res.sendFile('public/documentation.html', {root: __dirname});
});

/**
 * Product logic
 */

//Get all products
app.get('/products', (req, res) => {
    Product.find()
    .then((Product) => {
        res.status(201).json(Product);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

//Get one product
app.get('/products/:id', (req, res) => {
    Product.findOne({ id: req.params.ProductID })
    .then((Product) => {
        if (!Product) {
            return res.status(404).send('Product does not exist.');
        }
        res.json(Product);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

//Upload new product
app.post('/products', passport.authenticate('jwt', { session: false }), (req, res) => {
    if (!req.user.hasBroom) {
        return res.status(403).send('Mods ONLY.');
    }
    
    Product.findOne({ Name: req.body.Name })
    .then((existingProduct) => {
        if (existingProduct) {
            return res.status(400).send(req.body.Name + ' already exists.');
        } else {
            Product.create(req.body)
            .then((newProduct) => {
                res.status(201).json(newProduct)
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error: ' + err)
            })
        }
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

//Delete product
app.delete('/products/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
    Product.findOneAndDelete({ id: req.params.ProductID })
    .then((existingProduct) => {
        if (!existingProduct) {
            res.status(404).send(req.params.Name + ' does not exist.')
        } else {
            res.status(200).send(req.params.Name + ' deleted.')
        }
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

/**
 * User logic
 */
//Get all users
app.get('/users', passport.authenticate('jwt', { session: false }), (req, res) => {
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
app.get('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
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

//Upload new user
app.post('/users', [
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

//Delete user
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
    if (!req.user.hasBroom) {
        return res.status(403).send('Mods ONLY.');
    }
    
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

//Get cart items
app.get('/users/:Username/cart', async (req, res) => {
    try {
        const user = await User.findOne({ Username: req.params.Username }).populate('Cart.ProductID');
        res.status(200).json(user.Cart);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//Add product to cart
app.put('/users/:Username/cart/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const updatedCart = await User.findOneAndUpdate(
            { Username: req.params.Username },
            {
                $addToSet: { Cart: req.params.id }
            },
            { new: true }
        );

        if (!updatedCart) {
            return res.status(404).send('User not found.');
        }
        res.json(updatedCart);

    } catch (err) {
        console.error(err);
        res.status(500).send('Error: ' + err)
    }
});

//Remove product from cart
app.delete('/users/:Username/cart/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const updatedCart = await User.findOneAndUpdate(
            { Username: req.params.Username },
            {
                $pull: { Cart: req.params.id }
            },
            { new: true }
        );

        if (!updatedCart) {
            return res.status(404).send('User not found.');
        }
        res.json(updatedCart);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error: ' + err)
    }
});

//Get wishlist items
app.get('/users/:Username/wishlist', async (req, res) => {
    try {
        const user = await User.findOne({ Username: req.params.Username }).populate('Wishlist.ProductID');
        res.status(200).json(user.Wishlist);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//Add product to wishlist
app.put('/users/:Username/wishlist/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const updatedWishlist = await User.findOneAndUpdate(
            { Username: req.params.Username },
            {
                $addToSet: { Wishlist: req.params.id }
            },
            { new: true }
        );

        if (!updatedWishlist) {
            return res.status(404).send('User not found.');
        }
        res.json(updatedWishlist);

    } catch (err) {
        console.error(err);
        res.status(500).send('Error: ' + err)
    }
});

//Remove product from wishlist
app.delete('/users/:Username/wishlist/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const updatedWishlist = await User.findOneAndUpdate(
            { Username: req.params.Username },
            {
                $pull: { Wishlist: req.params.id }
            },
            { new: true }
        );

        if (!updatedWishlist) {
            return res.status(404).send('User not found.');
        }
        res.json(updatedWishlist);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error: ' + err)
    }
});
