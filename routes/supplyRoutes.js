const express = require('express');
const router = express.Router();
const checkBroom = require('../appFunctions.js');
const Models = require('../models.js');
const Supply = Models.Supply;
const User = Models.User;

const { validationResult, check } = require('express-validator');

const passport = require('passport');
require('../passport.js');

/**
 * Basic user permissions
 */
//Get all supplies
router.get('/', (req, res) => {
    Supply.find()
    .then((Supply) => {
        res.status(201).json(Supply);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

//Get one supply
router.get('/:id', (req, res) => {
    Supply.findOne({ id: req.params.SupplyID })
    .then((Supply) => {
        if (!Supply) {
            return res.status(404).send('Supply does not exist.');
        }
        res.json({Supply});
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

/**
 * Admin permissions
 */
//Log new supply
router.post('/', passport.authenticate('jwt', { session: false }), checkBroom, async (req, res) => {
    try {
        const { Name, Cost, Description, Quantity, Supplier, Measurement } = req.body;

        const existingSupply = await Supply.findOne({ Name });

        if (existingSupply) {
            return res.status(400).send(Name + ' already exists.');
        }

        const newSupply = await Supply.create({
            Name,
            Cost,
            Description,
            Quantity,
            Supplier,
            Measurement
        });
        res.status(201).json(newSupply);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
    }
});

//Delete supply
router.delete('/:id', passport.authenticate('jwt', { session: false }), checkBroom, (req, res) => {
    Supply.findOneAndDelete({ id: req.params.id })
    .then((existingSupply) => {
        if (!existingSupply) {
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
