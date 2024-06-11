const express = require('express');
const checkBroom = require('./../utils/appFunctions.js');
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
        console.error(`Error fetching expenses: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
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
        console.error(`Error logging expense: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    });
});

module.exports = router;