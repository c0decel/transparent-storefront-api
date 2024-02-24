const express = require('express');
const checkBroom = require('./appFunctions.js');
const mongoose = require('mongoose');
const router = express.Router();
const Models = require('./models.js');
const Tag = Models.Tag;
const Product = Models.Product;

const passport = require('passport');
require('./passport');

/**
 * Basic user permissions
 */
//Get all products
router.get('/', (req, res) => {
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
router.get('/:id', (req, res) => {
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
router.get('/:id/tags', async (req, res) => {
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

/**
 * Admin permissions
 */
// Upload new product
router.post('/', passport.authenticate('jwt', { session: false }), checkBroom, async (req, res) => {
    try {
        const { Name, Price, Description, Stock, Image, Tags } = req.body;

        const existingProduct = await Product.findOne({ Name });

        if (existingProduct) {
            return res.status(400).send(Name + ' already exists.');
        }

        const newProduct = await Product.create({
            Name,
            Price,
            Description,
            Stock,
            Image,
            Tags
        });


        res.status(201).json(newProduct);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
    }
});

//Update product stock
router.put('/:id', passport.authenticate('jwt', { session: false }), checkBroom, async (req, res) => {
    try {
        const { newStock } = req.body;

        const product = await Product.findById(req.params.id);
        console.log(product)

        if (!product) {
            return res.status(404).send('Product not found.');
        }

        const updatedProduct = await Product.findOneAndUpdate(
            { _id: req.params.id },
            { $set: { Stock: newStock } },
            { new: true }
        );


        return res.status(200).json(updatedProduct);
    } catch (err) {
        console.error(err);
        return res.status(500).send('Internal server error.');
    }
});

//Add tag to product
router.put('/:id/tags/:tagId', passport.authenticate('jwt', { session: false }), checkBroom, async (req, res) => {
    try {
        const tagId = req.params.tagId;

        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).send('Product not found.');
        }

        const tag = await Tag.findById(tagId);
        if (!tag) {
            return res.status(404).send('Tag not found.');
        }
        console.log('Tag', tag);

        const updatedProduct = await Product.findOneAndUpdate(
            { _id: req.params.id },
            { $addToSet: { Tags: tag} },
            { new: true }
        );
        console.log(updatedProduct);

        return res.status(200).json(updatedProduct);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
    }
});

// Remove tag from product
router.delete('/:id/tags/:tagId', passport.authenticate('jwt', { session: false }), checkBroom, async (req, res) => { 
    try {
        const tagId = req.params.tagId;

        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).send('Product not found.');
        }

        const tag = await Tag.findById(tagId);
        if (!tag) {
            return res.status(404).send('Tag not found.');
        }
        console.log(tag);


        const updatedProduct = await Product.findOneAndUpdate(
            { _id: req.params.id },
            { $pull: { Tags: tag._id } },
            { new: true }
        );
        console.log(updatedProduct);

        return res.status(200).json(updatedProduct);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
    }
});

//Delete product
router.delete('/:id', passport.authenticate('jwt', { session: false }), checkBroom, (req, res) => {
    Product.findOneAndDelete({ _id: req.params.id })
    .then((existingProduct) => {
        if (!existingProduct) {
            res.status(404).send(req.params.id + ' does not exist.')
        } else {
            res.status(200).send(req.params.id + ' deleted.')
        }
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

module.exports = router;

