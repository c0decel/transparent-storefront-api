const express = require('express');
const checkBroom = require('./appFunctions.js');
const router = express.Router();
const Models = require('./models.js');
const Sale = Models.Sale;

const passport = require('passport');
require('./passport');

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
        console.error(err);
        res.status(500).send('Error: ' + err);
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
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

module.exports = router;