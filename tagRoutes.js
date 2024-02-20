const express = require('express');
const router = express.Router();
const Models = require('./models.js');
const Tag = Models.Tag;
const Product = Models.Product;

const passport = require('passport');
require('./passport');

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
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

//Get one tag
router.get('/:id', (req, res) => {
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

/**
 * Admin permissions
 */
//Post tag
router.post('/', passport.authenticate('jwt', { session: false}), (req, res) => {
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
router.delete('/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
    if (!req.user.hasBroom) {
        return res.status(403).send('Mods ONLY.');
    }
    
    Tag.findOneAndDelete({ _id: req.params.id })
    .then((existingTag) => {
        if (!existingTag) {
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
