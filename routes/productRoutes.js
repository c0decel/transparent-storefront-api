const express = require('express');

const multer = require('multer');
const crypto = require('crypto');
const sharp = require('sharp');

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

require('dotenv').config();

const checkBroom = require('../utils/appFunctions.js');
const mongoose = require('mongoose');
const router = express.Router();
const { accessKey, secretAccessKey, bucketName, bucketRegion, randomImageName, upload, uploadToS3 } = require('./../utils/s3Utils.js');

//Models
const forumModels = require('../models/forumModels.js');
const userModels = require('../models/userModels.js');
const storeModels = require('../models/storeModels.js');

//Store models
const Tag = storeModels.Tag;
const Product = storeModels.Product;
const Supply = storeModels.Supply;
const Discount = storeModels.Discount;

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
        console.error(`Error fetching products: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    });
});

//Get one product
router.get('/:id', (req, res) => {
    Product.findOne({ id: req.params.ProductID })
    .then((Product) => {
        if (!Product) {
            return res.status(404).send(`Product not found.`);
        }
        res.json({Product});
    })
    .catch((err) => {
        console.error(`Error fetching product: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    });
});

//Get tags from product
router.get('/:id/tags', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('Tags');
        if (!product) {
            return res.status(404).send(`Product not found.`)
        }
        const tagNames = product.Tags.map(tag => tag.Tag);

        res.json(tagNames);
    } catch (err) {
        console.error(`Error fetching tags: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    }
});

//Get product by tag
router.get('/tags/:id', async (req, res) => {
    try {
        const products = await Product.find({ Tags: req.params.id });
        res.json(products);
      } catch (err) {
        console.error(`Error fetching product: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
      }
});

//Get supplies from product
router.get('/:id/supplies', async (req, res) => {
    try {

        const product = await Product.findById(req.params.id).populate('Supplies');
        if (!product) {
            return res.status(404).send(`Product not found.`)
        }
        const supplies = product.Supplies;
        return res.status(200).json(supplies);


    } catch (err) {
        console.error(`Error fetching supplies: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    }
});

/**
 * Admin permissions
 */
// Upload new product
router.post('/', upload.array('productImages', 5), passport.authenticate('jwt', { session: false }), checkBroom, async (req, res) => {
    try {
        const { Name, Price, Description, Stock, Image, Tags, Supplies, Upcharge } = req.body;

        const existingProduct = await Product.findOne({ Name });

        if (existingProduct) {
            return res.status(400).send(`${Name} already exists.`);
        }

        const folderPath = 'product-images/';
        const imageDimension = { width: undefined, height: undefined };
        let imageUrls = [];

        if (!req.files || req.files.length === 0) {
            imageUrls.push('https://www.ncenet.com/wp-content/uploads/2020/04/No-image-found.jpg');
        } else {
            const uploadPromises = req.files.map(file => uploadToS3(file, folderPath, imageDimension, s3));
            imageUrls = await Promise.all(uploadPromises);
        }

        const newProduct = await Product.create({
            Name,
            Price,
            Description,
            Stock,
            Tags,
            Supplies,
            Upcharge,
            ProductImages: imageUrls
        });
        res.status(201).json(newProduct);
    } catch (err) {
        console.error(`Error posting product: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    }
});

//Change product images
router.put('/:productId/images', upload.array('productImages', 5), passport.authenticate('jwt', { session: false }), checkBroom, async (req, res) => {
    try {
      const productId = req.params.productId;
      const product = await Product.findById(productId);
  
      if (!product) {
        return res.status(404).send(`Product not found.`);
      }
  
      const folderPath = 'product-images/';
      const imageDimension = { width: undefined, height: undefined };
      let imageUrls = [];
  
      if (!req.files || req.files.length === 0) {
        imageUrls.push('https://www.ncenet.com/wp-content/uploads/2020/04/No-image-found.jpg');
      } else {
        const uploadPromises = req.files.map(file => uploadToS3(file, folderPath, imageDimension, s3));
        imageUrls = await Promise.all(uploadPromises);
      }
  
      product.ProductImages = imageUrls;
      const updatedProduct = await product.save();
  
      return res.status(200).json(updatedProduct);
    } catch (err) {
      console.error(`Error: ${err.toString()}`);
      res.status(500).send(`Error: ${err.toString()}`);
    }
  });
  

//Create discount code
router.post('/discount', passport.authenticate('jwt', {session: false}), checkBroom, async (req, res) => {
    try {
        const { Name, Type, Description, ExpiresOn, IsActive } = req.body;

        const existingDiscount = await Discount.findOne({ Name });

        if (existingDiscount) {
            return res.status(400).send(`${Name} already exists.`);
        }

        const newDiscount = await Discount.create({
            Name,
            Type,
            Description,
            ExpiresOn,
            IsActive
        });
        res.status(201).json(newDiscount);

    } catch(err) {
        console.error(`Error posting discount: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    }
});

//Update product stock
router.put('/:id', passport.authenticate('jwt', { session: false }), checkBroom, async (req, res) => {
    try {
        const { newStock } = req.body;

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).send(`Product not found.`);
        }

        const updatedProduct = await Product.findOneAndUpdate(
            { _id: req.params.id },
            { $set: { Stock: newStock } },
            { new: true }
        );


        return res.status(200).json(updatedProduct);
    } catch (err) {
        console.error(`Error updating stock: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    }
});

//Add tag to product
router.put('/:id/tags/:tagId', passport.authenticate('jwt', { session: false }), checkBroom, async (req, res) => {
    try {

        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).send(`Product not found.`);
        }

        const tag = await Tag.findById(req.params.tagId);
        if (!tag) {
            return res.status(404).send(`Tag not found.`);
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
        console.error(`Error adding tag: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    }
});


// Remove tag from product
router.delete('/:id/tags/:tagId', passport.authenticate('jwt', { session: false }), checkBroom, async (req, res) => { 
    try {

        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).send(`Product not found.`);
        }

        const tag = await Tag.findById(req.params.tagId);
        if (!tag) {
            return res.status(404).send(`Tag not found.`);
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
        console.error(`Error removing tag: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    }
});

//Add supply to product
router.put('/:id/supplies/:supplyId', passport.authenticate('jwt', { session: false }), checkBroom, async (req, res) => {
    try {

        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).send(`Product not found.`);
        }

        const supply = await Supply.findById(req.params.supplyId);
        if (!supply) {
            return res.status(404).send(`Supply not found.`);
        }
        console.log('Supply', supply);

        const updatedProduct = await Product.findOneAndUpdate(
            { _id: req.params.id },
            { $addToSet: { Supplies: supply} },
            { new: true }
        );
        console.log(updatedProduct);

        return res.status(200).json(updatedProduct);
    } catch (err) {
        console.error(`Error adding supply: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    }
});

// Remove supply from product
router.delete('/:id/supplies/:supplyId', passport.authenticate('jwt', { session: false }), checkBroom, async (req, res) => { 
    try {

        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).send(`Product not found.`);
        }

        const supply = await Supply.findById(req.params.supplyId);
        if (!supply) {
            return res.status(404).send(`Supply not found.`);
        }
        console.log(supply);

        const updatedProduct = await Product.findOneAndUpdate(
            { _id: req.params.id },
            { $pull: { Supplies: supply._id } },
            { new: true }
        );
        console.log(updatedProduct);

        return res.status(200).json(updatedProduct);
    } catch (err) {
        console.error(`Error removing supply: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    }
});

//Delete product
router.delete('/:id', passport.authenticate('jwt', { session: false }), checkBroom, (req, res) => {
    Product.findOneAndDelete({ id: req.params.id })
    .then((existingProduct) => {
        if (!existingProduct) {
            res.status(404).send(`${req.params.id} does not exist.`)
        } else {
            res.status(200).send(`${req.params.id} deleted.'`)
        }
    })
    .catch((err) => {
        console.error(`Error deleting product: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    });
});

module.exports = router;
