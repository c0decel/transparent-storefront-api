const express = require('express');
const router = express.Router();
const { formatDate, formatTime } = require('./../utils/dateUtils.js');

//Models
const forumModels = require('../models/forumModels.js');
const userModels = require('../models/userModels.js');
const storeModels = require('../models/storeModels.js');

//User models
const User = userModels.User;

//Store models
const Tag = storeModels.Tag;
const Product = storeModels.Product;
const Review = storeModels.Review;


const passport = require('passport');
require('../passport.js');

/**
 * Basic user permissions
 */
//Get all reviews
router.get('/', (req, res) => {
    Review.find()
    .then((Review) => {
        res.status(201).json(Review);
    })
    .catch((err) => {
        console.error(`Error fetching reviews: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    });
});

//Get one review
router.get('/:id', (req, res) => {
    Review.findOne({ id: req.params.ReviewID })
    .then((Review) => {
        if (!Review) {
            return res.status(404).send(`Review does not exist.`);
        }
        res.json({Review});
    })
    .catch((err) => {
        console.error(`Error fetching review: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    });
});

/**
 * Logged in user permissions
 */
//Write a review
router.post('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const { Rating, UserID, ProductID, Content } = req.body;
        const product = await Product.findById(ProductID);
        const user = await User.findById(UserID);
        const userPurchases = user.Purchases;

        if (!product) {
            return res.status(404).send(`Error: product not found.`);
        }

        const relatedPurchases = userPurchases.filter((purchase) => purchase.Name === product.Name && purchase.Status === 'Active');

        if (relatedPurchases.length < 1) {
            return res.status(403).send(`You can't review products you haven't received.`);
        } else {
            const currentDate = new Date();
            const formattedDate = formatDate(currentDate);
            const formattedTime = formatTime(currentDate);

            const review = await Review.create({
                Rating,
                User: UserID,
                Username: user.Username,
                Product: ProductID,
                Content,
                ReviewDate: formattedDate,
                ReviewTime: formattedTime
            });
    
            await review.save();
    
            await User.findByIdAndUpdate(UserID, { $push: { Reviews: review._id } });
    
            await Product.findByIdAndUpdate(ProductID, { $push: { Reviews: review._id } });
            return res.status(201).json(`Review created successfully: ${review._id}`);
        }
        
    } catch (err) {
        console.error(`Error posting review: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    }
    
});

module.exports = router;