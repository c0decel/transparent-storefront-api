const express = require('express');
const router = express.Router();
const checkBroom = require('./../utils/appFunctions.js');
const Models = require('../models.js');
const Ban = Models.Ban;

const passport = require('passport');
require('../passport.js');

/**
 * Basic user permissions
 */
//Get all threadbans
router.get('/', (req, res) => {
    Ban.find()
    .then((Ban) => {
        res.status(201).json(Ban);
    })
    .catch((err) => {
        console.error(`Error fetching threadbans: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    });
});

//Get one threadban
router.get('/:id', (req, res) => {
    Ban.findById(req.params.id)
    .then((Ban) => {
        if(!Ban) {
            return res.status(404).send(`Ban does not exist`);
        }
        res.json({Ban});
    })
    .catch((err) => {
        console.error(`Error fetching ban: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    });
});

module.exports = router;

