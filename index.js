require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');

const app = express();

const Models = require('./models.js');
const Product = Models.Product;
const Review = Models.Review;
const User = Models.User;
const Tag = Models.Tag;
const Expense = Models.Expense;
const Sale = Models.Sale;

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
 //console.log('Listening on port 8080.');
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
        res.json({Product});
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

//Get tags from product
app.get('/products/:id/tags', async (req, res) => {
    try {
        const productId = req.params.id;

        const product = await Product.findById(productId).populate('Tags');
        if (!product) {
            return res.status(404).send('Not found.')
        }
        const tagNames = product.Tags.map(tag => tag.Tag);

        res.json(tagNames);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
    }
});

//Get all tags
app.get('/tags', (req, res) => {
    Tag.find()
    .then((Tag) => {
        res.status(201).json(Tag);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

//Get one tag
app.get('/tags/:id', (req, res) => {
    Tag.findOne({ id: req.params.TagID })
    .then((Tag) => {
        if (!Tag) {
            return res.status(404).send('Tag does not exist.');
        }
        res.json(Tag);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

//Get all expenses
app.get('/expenses', (req, res) => {
    Expense.find()
    .then((Expense) => {
        res.status(201).json(Expense);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

//Get all sales
app.get('/sales', (req, res) => {
    Sale.find()
    .then((Sale) => {
        res.status(201).json(Sale);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

//Get all reviews
app.get('/reviews', (req, res) => {
    Review.find()
    .then((Review) => {
        res.status(201).json(Review);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

//Get one review
app.get('/reviews/:id', (req, res) => {
    Review.findOne({ id: req.params.ReviewID })
    .then((Review) => {
        if (!Review) {
            return res.status(404).send('Review does not exist.');
        }
        res.json({Review});
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

/**
 * Admin permissions
 */

// Upload new product
app.post('/products', passport.authenticate('jwt', { session: false }), async (req, res) => {
    if (!req.user.hasBroom) {
        return res.status(403).send('Mods ONLY.');
    }
    
    try {
        const { Name, Price, Description, Stock, Image, TagIds } = req.body;

        const existingProduct = await Product.findOne({ Name });

        if (existingProduct) {
            return res.status(400).send(Name + ' already exists.');
        }

        const existingTags = await Tag.find({ TagID: { $in: TagIds } });

        const newProduct = await Product.create({
            Name,
            Price,
            Description,
            Stock,
            Image,
            Tags: existingTags.map(tag => tag._id)
        });

        newProduct.Tags = existingTags;

        res.status(201).json(newProduct);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
    }
});






//Delete product
app.delete('/products/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
    if (!req.user.hasBroom) {
        return res.status(403).send('Mods ONLY.');
    }
    
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

//Post tag
app.post('/tags', passport.authenticate('jwt', { session: false}), (req, res) => {
    if (!req.user.hasBroom) {
        return res.status(403).send('Mods ONLY.');
    }

    Tag.findOne({ Tag: req.body.Tag })
    .then((existingTag) => {
        if (existingTag) {
            return res.status(400).send(req.body.Tag + ' already exists.');
        } else {
            Tag.create(req.body)
            .then((newTag) => {
                res.status(201).json(newTag);
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

//Delete tag
app.delete('/tags/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
    if (!req.user.hasBroom) {
        return res.status(403).send('Mods ONLY.');
    }
    
    Product.findOneAndDelete({ id: req.params.TagID })
    .then((existingTag) => {
        if (!existingTag) {
            res.status(404).send(req.params.Tag + ' does not exist.')
        } else {
            res.status(200).send(req.params.Tag + ' deleted.')
        }
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

//Add tag to product
app.put('/products/:id/tags/:tagId', passport.authenticate('jwt', { session: false }), async (req, res) => {
    if (!req.user.hasBroom) {
        return res.status(403).send('Mods ONLY.');
    }
    
    try {
        const productId = req.params.id;
        const tagId = req.params.tagId;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).send('Product not found.');
        }
        const tag = await Tag.findById(tagId);
        if (!tag) {
            return res.status(404).send('Tag not found.');
        }

        product.Tags.push({
            TagID: tag._id,
            Name: tag.Tag,
            Description: tag.Description
        });

        const updatedProduct = await product.save();

        res.json(updatedProduct);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
    }
});

// Remove tag from product
app.delete('/products/:id/tags/:tagId', passport.authenticate('jwt', { session: false }), async (req, res) => {
    if (!req.user.hasBroom) {
        return res.status(403).send('Mods ONLY.');
    }
    
    try {
        const productId = req.params.id;
        const tagId = req.params.tagId;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).send('Product not found.');
        }
        const tagIndex = product.Tags.findIndex(tag => tag.TagID.toString() === tagId);
        if (tagIndex === -1) {
            return res.status(404).send('Tag not found.');
        }

        product.Tags.splice(tagIndex, 1);

        const updatedProduct = await product.save();

        res.json(updatedProduct);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
    }
});

//Log an expense
app.post('/expenses', passport.authenticate('jwt', { session: false }), (req, res) => {
    if (!req.user.hasBroom) {
        return res.status(403).send('Mods ONLY.');
    }

    Expense.create(req.body)
    .then((newExpense) => {
        res.status(201).json(newExpense);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

//Log a sale
app.post('/sales', passport.authenticate('jwt', { session: false }), (req, res) => {
    if (!req.user.hasBroom) {
        return res.status(403).send('Mods ONLY.');
    }

    Sale.create(req.body)
    .then((newSale) => {
        res.status(201).json(newSale);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

//Get all users
app.get('/users', passport.authenticate('jwt', { session: false }), (req, res) => {
    if (!req.user.hasBroom) {
        return res.status(403).send('Mods ONLY.');
    }

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
    if (!req.user.hasBroom) {
        return res.status(403).send('Mods ONLY.');
    }
    
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

/**
 * User logic
 */

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

// Add product to cart
app.put('/users/:Username/cart/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
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
app.delete('/users/:Username/cart/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
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
app.get('/users/:Username/wishlist', async (req, res) => {
    try {
        const user = await User.findOne({ Username: req.params.Username }).populate('Wishlist.ProductID');
        res.status(200).json(user.Wishlist);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add product to wishlist
app.put('/users/:Username/wishlist/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
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
app.delete('/users/:Username/wishlist/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
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

//Write a review
app.post('/reviews', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const { Rating, UserID, ProductID, Content } = req.body;
        const username = req.user.Username;

        const review = new Review({
            Rating,
            User: UserID,
            Username: username,
            Product: ProductID,
            Content
        });

        await review.save();

        await User.findByIdAndUpdate(UserID, { $push: { Reviews: review._id } });

        await Product.findByIdAndUpdate(ProductID, { $push: { Reviews: review._id } });
        res.status(201).json({ message: 'Review created successfully', review });
    } catch (err) {
        console.error('Could not create review: ', err);
        res.status(500).json({ error: 'Internal server error' });
    }
    
});
