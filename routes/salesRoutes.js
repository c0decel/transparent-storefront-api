const express = require('express');
const checkBroom = require('./../utils/appFunctions.js');
const router = express.Router();
const Models = require('../models.js');
const Sale = Models.Sale;

const passport = require('passport');
require('../passport.js');

/**
 * Basic user permissions
 */
//Get all sales
router.get('/', (req, res) => {
    Sale.find()
    .then((Sale) => {
        res.status(201).json(Sale);
    })
    .catch((err) => {
        console.error(`Error getting sales: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    });
});

/**
 * Admin permissions
 */
//Log a sale
router.post('/', passport.authenticate('jwt', { session: false }), checkBroom, (req, res) => {
    Sale.create(req.body)
    .then((newSale) => {
        res.status(201).json(newSale);
    })
    .catch((err) => {
        console.error(`Error logging sale: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    });
});

module.exports = router;