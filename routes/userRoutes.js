const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const sharp = require('sharp');

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

require('dotenv').config();

const router = express.Router();
const Models = require('../models.js');
const Product = Models.Product;
const User = Models.User;
const Post = Models.Post;
const Purchase = Models.Purchase;
const Notification = Models.Notification;
const checkBroom = require('../utils/appFunctions.js');
const { formatDate, formatTime } = require('./../utils/dateUtils.js');
const { accessKey, secretAccessKey, bucketName, bucketRegion, randomImageName, upload, uploadToS3 } = require('./../utils/s3Utils.js');

const { validationResult, check } = require('express-validator');

const passport = require('passport');
require('../passport.js');

const s3 = new S3Client({
    credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretAccessKey,
    },
    region: bucketRegion
});

const storage = multer.memoryStorage();

const validateUserInput = [
    check('Username', 'Username must be at least 5 characters.').isLength({ min: 5 }),
    check('Username', 'Non alphanumeric characters not allowed.').isAlphanumeric(),
    check('Password', 'Add a password').not().isEmpty(),
    check('Email', 'Invalid email').isEmail(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }
        next();
    }
];

const uploadSingleFile = upload.single('image');


/**
 * Basic user permissions
 */
//Upload new user
router.post('/', [
    check('Username', 'Username must be at least 5 characters.').isLength({ min: 5 }),
    check('Username', 'Non alphanumeric characters not allowed.').isAlphanumeric(),
    check('Password', 'Add a password').not().isEmpty(),
    check('Email', 'Invalid email').isEmail()
    ], uploadSingleFile, async (req, res, next) => {
    let profilePic;
    let defaultNum = req.body.defaultNum;
    try {

        if (req.file) {
            const folderPath = 'profile-pics/';
            const imageDimension = { height: 400, width: 400, fit: 'cover'};
            const file = req.file;
            profilePic = await uploadToS3(file, folderPath, imageDimension, s3);
        } else {
            if ((!req.file && !req.body.ProfileImage) || defaultNum > 3 || isNaN(defaultNum)) {
                function pickRandomPic() {
                    // 3 for number of default profile pics
                    defaultNum = Math.floor(Math.random() * 3) + 1;
                    return defaultNum;
                }
                profilePic = `https://ts-demo-bucket-img.s3.amazonaws.com/profile-pics/default-profile-pic-${pickRandomPic()}.png`;
            } else {
                profilePic = `https://ts-demo-bucket-img.s3.amazonaws.com/profile-pics/default-profile-pic-${defaultNum}.png`;
            }
        }

        const currentDate = new Date();
        const formattedDate = formatDate(currentDate);
        const formattedTime = formatTime(currentDate);  
        const hashedPass = User.hashPass(req.body.Password);

        const existingUser = await User.findOne({ Username: req.body.Username });

        if (existingUser) {
            return res.status(400).send(`${req.body.Username} already exists.`);
        }
        

        const newUser = await User.create({
            Username: req.body.Username,
            Password: hashedPass,
            Email: req.body.Email,
            Birthday: req.body.Birthday,
            JoinDate: formattedDate,
            JoinTime: formattedTime,
            Bio: req.body.Bio,
            Status: req.body.Status,
            ProfileImage: profilePic
        });

        res.status(201).json(newUser);

    } catch (err) {
        console.error(`Error fetching list: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    }
    
});

/**
 * Logged in user permissions
 */

//Get notifications
router.get('/notifications', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).populate('Notifications');

        if (!user) {
            return res.status(404).send(`User not found.`);
        }

        return res.status(201).json(user.Notifications);
    } catch(err) {
        return res.status(404).send(`Not found.`);
    }
});

//Mark all as read
router.put('/notifications', passport.authenticate('jwt', { session: false}), async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).populate('Notifications');

        if (!user) {
            return res.status(404).send(`User not found.`);
        }

        const notifs = user.Notifications;
        console.log(user)

        if (notifs.length < 1) {
            return res.status(404).send(`No notifs to mark`)
        }
        
        for (let notif of notifs) {
            notif.Status = 'Read';
            await notif.save();
        }

        res.status(200).send(`All notifications marked as read.`);

    } catch(err) {
        return res.status(404).send(`Not found.`);
    }
});

//Get purchases
router.get('/:Username/purchases', async (req, res) => {
    try {
        const user = await User.findOne({ Username: req.params.Username });

        res.status(200).json(user.Purchases);
    } catch (err) {
        console.error(`Error fetching purchase history: ${err.toString()}`);
    }
});

//Get most recent purchase
router.get('/:Username/purchases/last', async (req, res) => {
    try {
        const user = await User.findOne({ Username: req.params.Username });
        const purchase = await user.Purchases[user.Purchases.length - 1];

        if (!purchase) {
            return res.status(404).json(`Purchase not found.`);
        }

        res.status(200).json(purchase);
    } catch (err) {
        console.error(`Error fetching purchase: ${err.toString()}`);
    }
});

//Get cart items
router.get('/:Username/cart', async (req, res) => {
    try {
        const user = await User.findOne({ Username: req.params.Username }).populate('Cart.ProductID');
        res.status(200).json(user.Cart);
    } catch (err) {
        console.error(`Error fetching cart: ${err.toString()}`);
        return res.status(500).json(`Internal server error.`);
    }
});

// Add product to cart
router.put('/:Username/cart/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const productId = req.params.id;
        const user = await User.findOne({ Username: req.params.Username });
        const product = await Product.findById(productId);

        if (!user) {
            return res.status(404).send(`User not found.`);
        }

        if (user.Username !== req.user.Username) {
            return res.status(403).send(`You can't add to other user's cart.`);
        }

        if (!product) {
            return res.status(404).send(`Product not found.`);
        }

        user.Cart.push({
            ProductID: product._id,
                Name: product.Name,
                Price: product.Price,
                Image: product.Image
        });

        const updatedCart = await user.save();

        res.json(updatedCart);
    } catch (err) {
        console.error(`Error adding to cart: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    }
});


//Remove product from cart
router.delete('/:Username/cart/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
       const productId = req.params.id;
       const user = await User.findOne({ Username: req.params.Username });

        if (!user) {
            return res.status(404).send(`User not found.`);
        }

        if (user.Username !== req.user.Username) {
            return res.status(403).send(`You can't remove from other user's cart.`);
        }

        user.Cart = user.Cart.filter(item => !item.ProductID.equals(productId));

        const updatedCart = await user.save();

        res.json(updatedCart);
    } catch (err) {
        console.error(`Error removing from cart: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    }
});

//Get wishlist items
router.get('/:Username/wishlist', async (req, res) => {
    try {
        const user = await User.findOne({ Username: req.params.Username }).populate('Wishlist.ProductID');
        res.status(200).json(user.Wishlist);
    } catch (err) {
        console.error(`Error fetching list: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    }
});

// Add product to wishlist
router.put('/:Username/wishlist/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const productId = req.params.id;
        const user = await User.findOne({ Username: req.params.Username });
        const product = await Product.findById(productId);

        if (!user) {
            return res.status(404).send(`User not found.`);
        }

        if (user.Username !== req.user.Username) {
            return res.status(403).send(`You can't add to other user's wishlist.`);
        }

        if (!product) {
            return res.status(404).send(`Product not found.`);
        }

        user.Wishlist.push({
            ProductID: product._id,
            Name: product.Name,
            Price: product.Price,
            Image: product.Image
        });

        const updatedWishlist = await user.save();

        res.json(updatedWishlist);
    } catch (err) {
        console.error(`Error adding to list: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    }
});

//Remove product from wishlist
router.delete('/:Username/wishlist/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const productId = req.params.id;
        const user = await User.findOne({ Username: req.params.Username });

        if (!user) {
            return res.status(404).send(`User not found.`);
        }

        if (user.Username !== req.user.Username) {
            return res.status(403).send(`You can't remove from other user's wishlist.`);
        }

        user.Wishlist = user.Wishlist.filter(item => !item.ProductID.equals(productId));

        const updatedWishlist = await user.save();

        res.json(updatedWishlist);
    } catch (err) {
        console.error(`Error removing from list: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    }
});

//Edit bio
router.put('/:id/bio', passport.authenticate('jwt', { session: false}), async (req, res) => {
    try {
        const { newBio } = req.body;
        const userId = req.params.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).send(`User not found.`);
        }

        if (userId !== req.user.id) {
            return res.status(403).send(`You can't edit someone else's bio.`);
        }

        user.Bio = newBio;

        const updatedUser = await user.save();

        return res.status(200).json(updatedUser);
    } catch(err) {
        console.error(`Error updating bio: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    }
});

//Edit status
router.put('/:id/status', passport.authenticate('jwt', { session: false}), async (req, res) => {
    try {
        const { newStatus } = req.body;
        const userId = req.params.id;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).send(`User not found.`);
        }

        if (userId !== req.user.id) {
            return res.status(403).send(`You can't edit someone else's status.`);
        }

        user.Status = newStatus;

        const updatedUser = await user.save();

        return res.status(200).json(updatedUser);
    } catch(err) {
        console.error(`Error updating status: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    }
});

//Upload new profile photo
router.put('/:Username/profile-pic', upload.single('image'), passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const user = await User.findOne({ Username: req.params.Username });

        if (!user) {
            return res.status(404).send(`User not found.`);
        }

        if (user.Username !== req.user.Username) {
            return res.status(403).send(`You can't remove from other user's wishlist.`);
        }

        if (!req.file) {
            return res.status(400).send(`No file uploaded.`);
        }

        const folderPath = 'profile-pics/';
        const imageDimension = { height: 400, width: 400, fit: 'cover'};
        const file = req.file;
        const imageUrl = await uploadToS3(file, folderPath, imageDimension, s3)

        user.ProfileImage = imageUrl;
        const updatedUser = await user.save();

        console.log(user.ProfileImage)
        console.log(imageUrl)
    
        res.status(200).send(`Profile picture updates: ${updatedUser}`);
    } catch (err) {
        console.error(`Error fetching list: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    }
});

//Get user posts
router.get('/:Username/posts', async (req, res) => {
    try {
        const user = await User.findOne({ Username: req.params.Username }).populate('Posts', '-_id -__v');
        res.status(200).json(user.Posts);
    } catch (err) {
        console.error(`Error fetching list: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    }
});

//Get user profile comments
router.get('/:Username/wall', async (req, res) => {
    try {
        const user = await User.findOne({ Username: req.params.Username }).populate('ProfileComments', '-_id -__v');
        res.status(200).json(user.ProfileComments);
    } catch (err) {
        console.error(`Error fetching list: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    }
});

//Comment on user profile 
router.post('/:Username/wall', passport.authenticate('jwt', {session: false}), async (req, res) => {
    const { Content } = req.body;

    try {
        const username = req.params.Username;
        const userId = req.user.id;
        const user = await User.findOne({ Username: username });
        const currentUser = await User.findById(userId);

        const currentDate = new Date();
        const formattedDate = formatDate(currentDate);
        const formattedTime = formatTime(currentDate);

        if (!user) {
            return res.status(404).send(`Error: ${username} not found.`);
        }

        if (!currentUser) {
            return res.status(404).send(`Error: user not found.`);
        }

        const post = await Post.create({
            User: userId,
            Username: currentUser.Username,
            Content,
            PostedAtDate: formattedDate,
            PostedAtTime: formattedTime
        });

        await post.save();

        const notif = new Notification({
            Type: 'ProfileComment',
            Content,
            NotifDate: formattedDate,
            NotifTime: formattedTime,
            UserLink: {
                UserID: userId,
                Username: currentUser.Username
            }
        });

        await notif.save();

        user.Notifications.push(notif);
        user.ProfileComments.push(post);

        await user.save();

        return res.status(201).send(post);

    } catch (err) {
        console.error(`Error fetching list: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    }
});

/**
 * Admin permissions
 */
//Get all users
router.get('/', (req, res) => {
    const hasPerms = req.user && (req.user.hasBroom === true);
    let query = User.find();

    if (!hasPerms) {
        query = query.select('-Password -Cart -Email -Birthday');
    }
    query
    .then((User) => {
        res.status(201).json(User);
    })
    .catch((err) => {
        console.error(`Error fetching users: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    });
});

//Get one user by name
router.get('/name/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
    const hasPerms = req.user && (req.user.hasBroom === true);
    let query = User.findOne({ Username: req.params.Username });

    if (!hasPerms) {
        query = query.select('-Password -Cart -Email -Birthday');
    }
    query
    .then((User) => {
        if (!User) {
            return res.status(404).send(`User not found.`);
        }
        res.json(User);
    })
    .catch((err) => {
        console.error(`Error fetching user: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    });
});

//Get user by ID
router.get('/id/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate('Posts');

        if (!user) {
            return res.status(404).send(`User not found.`);
        }

        res.json(user);

    } catch (err) {
        console.error(`Error fetching user and posts: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    }
});

//Delete user
router.delete('/:id', passport.authenticate('jwt', { session: false }), checkBroom, (req, res) => {

    User.findByIdAndDelete(req.params.id)
    .then((deletedUser) => {
        if (!deletedUser) {
            res.status(404).send(`User not found.`);
        } else {
            res.status(200).send(`Done.`);
        }
    })
    .catch((err) => {
        console.error(`Error deleting user: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    });
});


//Promote or demote user for sponsor
router.patch('/:id/toggle-sponsor', passport.authenticate('jwt', { session: false }), checkBroom, async (req, res) => {
    try {
        const user = User.findById(req.params.id);

        if (!user) {
            return res.status(404).send(`User not found.`);
        }

        user.isSponsor = !user.isSponsor;

        const notif = await Notification.create({
            Type: `SponsorPromotion`,
        });

        await notif.save();

        user.Notifications.push(notif);

        await user.save();

        res.status(200).json(user);
    } catch(err) {
        res.status(500).send(`Error: ${err.toString()}`);
    }
});


//Promote or demote user for admin
router.patch('/:id/toggle-admin', passport.authenticate('jwt', { session: false }), checkBroom, async (req, res) => {

    try {
        const user = User.findById(req.params.id);

        if (!user) {
            return res.status(404).send(`User not found.`);
        }

        user.hasBroom = !user.hasBroom;

        const notif = await Notification.create({
            Type: `AdminPromotion`
        })

        await notif.save();

        user.Notifications.push(notif);

        await user.save();

        res.status(200).json(user);
    } catch(err) {
        res.status(500).send(`Error: ${err.toString()}`);
    }
});

//Allow or deny a user to interact with forum posts
router.patch('/:userId/toggle-posting', passport.authenticate('jwt', { session: false }), checkBroom, async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = User.findById(userId);

        if (!user) {
            return res.status(404).send(`User not found.`);
        }

        user.canPost = !user.canPost;

        const newNotif = await Notification.create({
            Type: 'PostToggle',
        });

        await newNotif.save();

        user.Notifications.push(newNotif);

        await user.save();

        res.status(200).json(user);


    } catch (err) {
        console.error(`Error updating permissions: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    }
});

//Change user order status
router.put('/:Username/purchases/:purchaseId', passport.authenticate('jwt', {session: false}), checkBroom, async (req, res) => {
    const { newStatus } = req.body;

    try {
        const Username = req.params.Username;
        const purchaseId = req.params.purchaseId;
        const user = await User.findOne({ Username: Username });
        const purchase = await Purchase.findById(purchaseId);

        if (!user) {
            return res.status(404).send(`Error: ${Username} not found`);
        }

        if (!purchase) {
            return res.status(404).send(`Error: ${purchaseId} not found`);
        } 

        purchase.Status = newStatus;

        const updatedPurchase = await purchase.save();

        const statusNotif = Notification.create({
            Type: 'PurchaseUpdate',
            Content: newStatus
        });

        await statusNotif.save();

        user.Notifications.push(statusNotif);

        await user.save();

        return res.status(200).json(updatedPurchase);

    } catch (err) {
        console.error(`Error: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    }
});

module.exports = router;