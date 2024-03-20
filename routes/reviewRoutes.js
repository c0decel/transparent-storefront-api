const express = require('express');
const router = express.Router();
const Models = require('../models.js');
const Tag = Models.Tag;
const Product = Models.Product;
const Review = Models.Review;
const User = Models.User;

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
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

//Get one review
router.get('/:id', (req, res) => {
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
 * Logged in user permissions
 */
//Write a review
router.post('/reviews', passport.authenticate('jwt', { session: false }), async (req, res) => {
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

module.exports = router;