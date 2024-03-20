const express = require('express');
const checkBroom = require('../appFunctions.js');
const router = express.Router();
const Models = require('../models.js');
const Expense = Models.Expense;

const passport = require('passport');
require('../passport.js');

/**
 * Basic user permissions
 */
//Get all expenses
router.get('/', (req, res) => {
    Expense.find()
    .then((Expense) => {
        res.status(201).json(Expense);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});


/**
 * Admin permissions
 */
//Log an expense
router.post('/', passport.authenticate('jwt', { session: false }), checkBroom, (req, res) => {
    Expense.create(req.body)
    .then((newExpense) => {
        res.status(201).json(newExpense);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

module.exports = router;