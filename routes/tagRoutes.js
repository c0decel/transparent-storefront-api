const express = require('express');
const checkBroom = require('./../utils/appFunctions.js');
const router = express.Router();

//Models
const forumModels = require('../models/forumModels.js');
const userModels = require('../models/userModels.js');
const storeModels = require('../models/storeModels.js');

//Store models
const Tag = storeModels.Tag;
const Product = storeModels.Product;

const passport = require('passport');
require('../passport.js');

/**
 * Basic user permissions
 */
//Get all tags
router.get('/', (req, res) => {
    Tag.find()
    .then((Tag) => {
        res.status(201).json(Tag);
    })
    .catch((err) => {
        console.error(`Error fetching tags: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    });
});

//Get one tag
router.get('/:id', (req, res) => {
    Tag.findById(req.params.id)
    .then((Tag) => {
        if (!Tag) {
            return res.status(404).send(`Tag does not exist.`);
        }
        res.json(Tag);
    })
    .catch((err) => {
        console.error(`Error fetching tag: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    });
});

/**
 * Admin permissions
 */
//Post tag
router.post('/', passport.authenticate('jwt', { session: false}), checkBroom, (req, res) => {
    Tag.findOne({ Tag: req.body.Tag })
    .then((existingTag) => {
        if (existingTag) {
            return res.status(400).send(`${req.body.Tag} already exists.`);
        } else {
            Tag.create(req.body)
            .then((newTag) => {
                res.status(201).json(newTag);
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send(`Error: ${err.toString()}`);
            })
        }
    })
    .catch((err) => {
        console.error(`Error posting tag: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    });
});

//Delete tag
router.delete('/:id', passport.authenticate('jwt', { session: false }), checkBroom, (req, res) => {
    Tag.findByIdAndDelete(req.params.id)
    .then((existingTag) => {
        if (!existingTag) {
            res.status(404).send(`${req.params.id} doesn't exist.`)
        } else {
            res.status(200).send(`${req.params.id} deleted.`)
        }
    })
    .catch((err) => {
        console.error(`Error deleting tag: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    });
});

module.exports = router;
